from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import re
from app.utils.logger import logger

try:
    import ollama  # type: ignore
    OLLAMA_CLIENT_INSTALLED = True
except ImportError:
    OLLAMA_CLIENT_INSTALLED = False


from app.utils.hinglish import _sanitize_hinglish_text, _to_hinglish


class LLMService:

    def __init__(self, model_name: str = "llama3.2"):
        self.model_name = model_name
        self._client = None
        if OLLAMA_CLIENT_INSTALLED:
            try:
                # Set a strict 15-second network timeout per request on Ollama client
                self._client = ollama.Client(timeout=15.0)
            except Exception as e:
                logger.warning(f"Could not initialize ollama.Client with timeout: {e}")

    def is_available(self) -> bool:
        if not OLLAMA_CLIENT_INSTALLED:
            return False
        try:
            client = self._client or ollama
            res = client.list()
            models_list = getattr(res, "models", []) if hasattr(res, "models") else res.get("models", [])
            available_models = []
            for m in models_list:
                m_name = getattr(m, "model", "") if hasattr(m, "model") else m.get("model", "")
                if m_name:
                    available_models.append(m_name.split(":")[0])
            logger.info(f"Ollama reachable. Available local models: {available_models}")
            return len(models_list) > 0
        except Exception as e:
            logger.warning(f"Ollama not reachable: {e}")
            return False

    def _clean_single_batch(
        self,
        batch: list,
        batch_idx: int,
        total_batches: int,
        previous_context: str = ""
    ) -> list:
        for s in batch:
            if not s.get("hinglish_text"):
                s["hinglish_text"] = _to_hinglish(s.get("text", ""))

        batch_texts = [s.get("hinglish_text", "") for s in batch]

        context_prefix = f"Previous Context: \"{previous_context}\"\n\n" if previous_context else ""

        prompt = (
            "You are an expert Hinglish & Indian English transcript proofreader.\n"
            "Input text is spoken Hindi-English code-switching written in Roman/Devanagari script.\n\n"
            f"{context_prefix}"
            "Task:\n"
            "1. Restore proper English spelling for English words (e.g., 'stej' -> 'stage', 'wich'/'vich' -> 'with', 'peepol' -> 'people', 'kaonphidemsa' -> 'Confidence', 'maltiplayar' -> 'Multiplier', 'cherman' -> 'Chairman', 'devalapamemta' -> 'Development', 'motiveshana' -> 'Motivation', 'shmart' -> 'Smart', 'dil man' -> 'the man', 'man hos' -> 'man who is', 'E for tough' -> 'T for tough').\n"
            "2. Remove obvious background music/applause hallucinations or garbled non-speech noise.\n"
            "3. Fix Roman Hindi spelling & remove transliteration artifacts (e.g., 'pa.dega' -> 'padega', 'apako' -> 'aapko', 'chij' -> 'cheez', 'alaga-alaga' -> 'alag-alag', 'karemge' -> 'karenge').\n"
            "4. DO NOT translate Hindi words to English. Keep Hindi words in clean Roman/Devanagari script as intended and preserve capitalization of brand terms (e.g. 'Smart', 'Gurukul', 'Multiplier', 'RTI').\n\n"
            "Output JSON format:\n"
            "{\"cleaned_segments\": [\"sentence 1\", \"sentence 2\", ...]}\n\n"
            f"Input:\n{json.dumps(batch_texts, ensure_ascii=False)}"
        )

        try:
            client = self._client or ollama
            response = client.chat(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                format="json",
                options={"temperature": 0.0}
            )

            if hasattr(response, "message"):
                content = getattr(response.message, "content", "").strip()
            elif isinstance(response, dict):
                content = response.get("message", {}).get("content", "").strip()
            else:
                content = str(response).strip()

            parsed = json.loads(content)
            corrected_texts = None
            if isinstance(parsed, dict):
                corrected_texts = parsed.get("cleaned_segments") or parsed.get("sentences") or parsed.get("corrected_text")
                if not corrected_texts and parsed:
                    first_val = list(parsed.values())[0]
                    if isinstance(first_val, list):
                        corrected_texts = first_val
            elif isinstance(parsed, list):
                corrected_texts = parsed

            if isinstance(corrected_texts, list):
                cleaned_batch = []
                for i, original_item in enumerate(batch):
                    cleaned_item = dict(original_item)
                    if i < len(corrected_texts) and str(corrected_texts[i]).strip():
                        cleaned_item["hinglish_text"] = str(corrected_texts[i]).strip()
                    cleaned_item["hinglish_text"] = _sanitize_hinglish_text(cleaned_item["hinglish_text"])
                    cleaned_batch.append(cleaned_item)
                logger.info(f"Ollama cleaned batch {batch_idx + 1}/{total_batches}")
                return cleaned_batch

        except Exception as batch_err:
            logger.warning(f"Ollama batch cleanup failed for index {batch_idx}: {batch_err}")

        # Fallback sanitization if batch LLM failed or timed out
        cleaned_batch = []
        for original_item in batch:
            cleaned_item = dict(original_item)
            cleaned_item["hinglish_text"] = _sanitize_hinglish_text(cleaned_item.get("hinglish_text", ""))
            cleaned_batch.append(cleaned_item)
        return cleaned_batch

    def clean_segments(self, segments: list, batch_size: int = 12, max_workers: int = 1, language: str = "hi") -> list:

        """
        Batch clean Hinglish transcript segments sequentially using Ollama local LLM.
        Fixes English misspellings without translating Hinglish sentences.
        Carries context forward across batches.
        """
        if not segments or not self.is_available():
            logger.info("Ollama LLM cleanup skipped (Ollama offline or no segments).")
            # Apply fast local regex sanitization even if LLM is skipped
            for s in segments:
                if not s.get("hinglish_text"):
                    s["hinglish_text"] = _to_hinglish(s.get("text", ""))
                s["hinglish_text"] = _sanitize_hinglish_text(s.get("hinglish_text", ""))
            return segments

        logger.info(f"Starting Ollama LLM cleanup ({len(segments)} segments in batches of {batch_size})...")

        batches = [segments[i:i + batch_size] for i in range(0, len(segments), batch_size)]
        total_batches = len(batches)
        final_segments = []
        prev_context = ""

        # Run sequentially to match local Ollama inference queueing and maintain rolling context
        for idx, batch in enumerate(batches):
            cleaned_batch = self._clean_single_batch(batch, idx, total_batches, previous_context=prev_context)
            final_segments.extend(cleaned_batch)
            if cleaned_batch:
                # Grab last 2 cleaned lines to serve as context for next batch
                tail_texts = [b.get("hinglish_text", "") for b in cleaned_batch[-2:] if b.get("hinglish_text")]
                prev_context = " ".join(tail_texts)

        logger.info("Ollama LLM cleanup finished successfully.")
        return final_segments
