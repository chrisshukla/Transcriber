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

    def is_available(self) -> bool:
        if not OLLAMA_CLIENT_INSTALLED:
            return False
        try:
            res = ollama.list()
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

    def _clean_single_batch(self, batch: list, batch_idx: int, total_batches: int) -> list:
        for s in batch:
            if not s.get("hinglish_text"):
                s["hinglish_text"] = _to_hinglish(s.get("text", ""))

        batch_texts = [s.get("hinglish_text", "") for s in batch]

        prompt = (
            "You are an expert Hinglish proofreader.\n"
            "Input text is spoken Hindi mixed with English written in Roman script.\n\n"
            "Task:\n"
            "1. Restore English spelling for English words (e.g. 'stej' -> 'stage', 'kaonphidemsa' -> 'Confidence', 'maltiplayara' -> 'Multiplier', 'cherman' -> 'Chairman', 'skila' -> 'Skill', 'devalapamemta' -> 'Development', 'motiveshana' -> 'Motivation', 'shmart' -> 'Smart').\n"
            "2. Fix Roman Hindi spelling & remove dots/artifacts (e.g. 'pa.dega' -> 'padega', 'apako' -> 'aapko', 'chij' -> 'cheez', 'alaga-alaga' -> 'alag-alag', 'karemge' -> 'karenge', 'jaba' -> 'jab', 'yaha' -> 'yeh', 'upara' -> 'upar').\n"
            "3. DO NOT translate Hindi words into English. Keep the Hindi sentence structure in clean Roman script.\n\n"
            "Output JSON format:\n"
            "{\"cleaned_segments\": [\"sentence 1\", \"sentence 2\", ...]}\n\n"
            f"Input:\n{json.dumps(batch_texts, ensure_ascii=False)}"
        )

        try:
            response = ollama.chat(
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

        # Fallback sanitization even if batch LLM failed
        cleaned_batch = []
        for original_item in batch:
            cleaned_item = dict(original_item)
            cleaned_item["hinglish_text"] = _sanitize_hinglish_text(cleaned_item.get("hinglish_text", ""))
            cleaned_batch.append(cleaned_item)
        return cleaned_batch

    def clean_segments(self, segments: list, batch_size: int = 35, max_workers: int = 2) -> list:

        """
        Batch clean Hinglish transcript segments in parallel using Ollama local LLM.
        Fixes English misspellings without translating Hinglish sentences.
        """
        if not segments or not self.is_available():
            logger.info("Ollama LLM cleanup skipped (Ollama offline or no segments).")
            return segments

        logger.info(f"Starting parallel Ollama LLM cleanup ({len(segments)} segments across {max_workers} threads)...")

        batches = [segments[i:i + batch_size] for i in range(0, len(segments), batch_size)]
        total_batches = len(batches)
        cleaned_results: list = [None] * total_batches

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_idx: dict = {
                executor.submit(self._clean_single_batch, batch, idx, total_batches): idx
                for idx, batch in enumerate(batches)
            }
            for future in as_completed(future_to_idx):
                idx = future_to_idx[future]
                try:
                    cleaned_results[idx] = future.result(timeout=15.0)
                except Exception as exc:
                    logger.warning(f"Batch {idx} generated exception or timed out: {exc}")
                    cleaned_results[idx] = batches[idx]

        final_segments = []
        for res in cleaned_results:
            if res:
                final_segments.extend(res)

        logger.info("Parallel Ollama LLM cleanup finished.")
        return final_segments
