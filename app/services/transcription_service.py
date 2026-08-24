import json
import re
from pathlib import Path
import shutil
from app.core.config import (
    AUDIO_DIR, OUTPUT_DIR, TRANSCRIPT_DIR, CHUNK_DIR
)
from app.core.constants import MAX_CHUNK_MINUTES
from app.services.audio_service import AudioService
from app.services.whisper_service import WhisperService
from app.services.pdf_service import PDFService
from app.services.text_service import TextService
from app.services.chunk_service import ChunkService
from app.services.llm_service import LLMService

from app.queue.job_store import job_manager
from app.models.job_status import JobStatus
from app.utils.logger import logger

try:
    from indic_transliteration import sanscript  # type: ignore # pyrefly: ignore [missing-import]
    from indic_transliteration.sanscript import transliterate  # type: ignore # pyrefly: ignore [missing-import]
    INDIC_AVAILABLE = True
except ImportError:
    INDIC_AVAILABLE = False


def _to_hinglish(text: str) -> str:
    if not INDIC_AVAILABLE or not text:
        return text
    if any("\u0900" <= char <= "\u097F" for char in text):
        try:
            words = text.split(" ")
            res_words = []
            for w in words:
                if any("\u0900" <= char <= "\u097F" for char in w):
                    clean_w = w.strip(".,?!:;\"()")
                    t = transliterate(clean_w, sanscript.DEVANAGARI, sanscript.ITRANS)
                    t = t.replace(".N", "n").replace(".m", "m").replace("A", "a").replace("I", "i").replace("U", "u")
                    t = t.replace("M", "m").replace("R", "r").replace("S", "sh").replace("T", "t")
                    t = t.replace("D", "d").replace("N", "n").replace("^", "").replace("shh", "sh").replace(".d", "d")
                    if t.endswith("a") and len(t) > 2 and not t.endswith(("aa", "ia", "ua", "ea", "oa", "ra", "ka", "ga", "ya", "ha", "ba", "ma", "pa", "la", "na", "sa", "va", "ta", "da")):
                        t = t[:-1]
                    w_trans = w.replace(clean_w, t)
                    res_words.append(w_trans)
                else:
                    res_words.append(w)
            raw_hinglish = " ".join(res_words)
            from app.services.llm_service import _sanitize_hinglish_text
            return _sanitize_hinglish_text(raw_hinglish)
        except Exception:
            return text
    from app.services.llm_service import _sanitize_hinglish_text
    return _sanitize_hinglish_text(text)


class TranscriptionService:

    def __init__(self):
        self.audio = AudioService()
        self.whisper = WhisperService()
        self.pdf = PDFService()
        self.text = TextService()
        self.chunk = ChunkService()
        self.llm = LLMService()
        self.jobs = job_manager

    def process(self, video_path: str, job_id: str):

        video_path = Path(video_path)

        job = self.jobs.get_job(job_id)

        if job is None:
            raise ValueError(f"Job {job_id} not found.")

        filename = job.filename

        try:

            logger.info(f"Starting transcription for: {filename}")

            # ------------------------------------
            # Extract Audio
            # ------------------------------------
            self.jobs.update_progress(
                job_id,
                10,
                JobStatus.EXTRACTING_AUDIO
            )

            audio_path = AUDIO_DIR / f"{video_path.stem}.wav"

            self.audio.extract_audio(
                str(video_path),
                str(audio_path)
            )

            # ------------------------------------
            # Split Audio into Chunks
            # ------------------------------------
            self.jobs.update_progress(
                job_id,
                20,
                JobStatus.DETECTING_SPEECH
            )

            chunks = self.chunk.split_audio(
                str(audio_path),
                job_id=job_id,
                chunk_minutes=MAX_CHUNK_MINUTES
            )
            if not chunks:
                raise ValueError("No audio chunks were generated")

            # ------------------------------------
            # Whisper Transcription
            # ------------------------------------
            self.jobs.update_progress(
                job_id,
                30,
                JobStatus.TRANSCRIBING
            )

            all_segments = []

            language = None
            language_probability = None
            duration = 0
            processing_time = 0

            total_chunks = len(chunks)

            for index, chunk in enumerate(chunks):

                logger.info(
                    f"Processing chunk {index + 1}/{total_chunks}"
                )

                chunk_result = self.whisper.transcribe(
                    chunk["path"]
                )
                if language is None:
                    language = chunk_result["language"]

                if language_probability is None:
                    language_probability = chunk_result.get(
                        "language_probability"
                    )

                processing_time += chunk_result.get(
                    "processing_time",
                    0
                )

                duration = max(
                    duration,
                    chunk["offset"] + chunk_result["duration"]
                )

                for segment in chunk_result["segments"]:

                    segment["start"] += chunk["offset"]
                    segment["end"] += chunk["offset"]

                    all_segments.append(segment)

                progress = 30 + int(
                    ((index + 1) / total_chunks) * 50
                )

                self.jobs.update_progress(
                    job_id,
                    progress,
                    JobStatus.TRANSCRIBING
                )

            all_segments.sort(key=lambda s: s["start"])

            # Deduplicate hallucinated consecutive repeating segments (Whisper repetition loop safeguard)
            deduped_segments: list[dict] = []
            repeat_count: int = 0
            last_text: str | None = None

            for seg in all_segments:
                current_text: str = str(seg.get("text", "")).strip().lower()
                if current_text and current_text == last_text:
                    repeat_count += 1
                    if repeat_count >= 2:
                        continue
                else:
                    last_text = current_text
                    repeat_count = 0
                deduped_segments.append(seg)

            all_segments = deduped_segments

            for seg in all_segments:
                seg["hinglish_text"] = _to_hinglish(seg.get("text", ""))

            # Clean English spellings and typos in Hinglish text using Ollama local LLM
            all_segments = self.llm.clean_segments(all_segments)

            clean_name = Path(filename).name
            clean_stem = re.sub(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_', '', clean_name, flags=re.IGNORECASE)
            clean_stem = Path(clean_stem).stem
            clean_stem = re.sub(r'[^\w\s-]', '_', clean_stem).strip() or "transcript"

            result = {
                "filename": clean_name,
                "language": language,
                "language_probability": language_probability,
                "processing_time": round(processing_time, 2),
                "duration": duration,
                "segment_count": len(all_segments),
                "segments": all_segments
            }

            # ------------------------------------
            # Save Language & Duration
            # ------------------------------------
            self.jobs.set_language(
                job_id,
                language
            )

            self.jobs.set_duration(
                job_id,
                duration
            )

            # ------------------------------------
            # Save JSON Transcript
            # ------------------------------------

            transcript_path = TRANSCRIPT_DIR / f"{job_id}.json"

            with open(
                transcript_path,
                "w",
                encoding="utf-8"
            ) as file:

                json.dump(
                    result,
                    file,
                    ensure_ascii=False,
                    indent=4
                )

            self.jobs.set_transcript_file(
                job_id,
                str(transcript_path)
            )

            # ------------------------------------
            # Generate PDF
            # ------------------------------------
            self.jobs.update_progress(
                job_id,
                90,
                JobStatus.GENERATING_PDF
            )

            pdf_path = OUTPUT_DIR / f"{clean_stem}.pdf"

            self.pdf.generate(
                result,
                str(pdf_path)
            )

            # ------------------------------------
            # Generate TXT
            # ------------------------------------
            txt_path = OUTPUT_DIR / f"{clean_stem}.txt"

            self.text.generate(
                result,
                str(txt_path)
            )

            # ------------------------------------
            # Complete Job
            # ------------------------------------
            self.jobs.complete_job(
                job_id=job_id,
                pdf_file=str(pdf_path),
                text_file=str(txt_path),
                transcript_file=str(transcript_path)
            )

            logger.info(
                f"Job {job_id} completed successfully."
            )

            return self.jobs.get_job(job_id)

        except Exception as e:

            logger.exception(
                f"Transcription failed for job {job_id}: {e}"
            )

            self.jobs.fail_job(
                job_id,
                str(e)
            )

            raise

        finally:

            try:

                if (
                    "audio_path" in locals()
                    and audio_path.exists()
                ):
                    audio_path.unlink()

                chunk_dir = CHUNK_DIR / job_id

                if chunk_dir.exists():
                    shutil.rmtree(chunk_dir)

                logger.info(
                    "Temporary files cleaned successfully."
                )

            except Exception as cleanup_error:

                logger.warning(
                    f"Cleanup failed: {cleanup_error}"
                )