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

from app.utils.hinglish import _to_hinglish



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

            import os
            from concurrent.futures import ThreadPoolExecutor, as_completed

            total_chunks = len(chunks)
            max_chunk_workers = 2 if (os.cpu_count() or 4) >= 8 else 1
            completed_count = 0

            def _process_chunk(item):
                idx, ch = item
                logger.info(f"Processing chunk {idx + 1}/{total_chunks}")
                res = self.whisper.transcribe(ch["path"])
                return idx, ch, res

            logger.info(f"Transcribing {total_chunks} chunks using {max_chunk_workers} parallel CPU workers...")

            with ThreadPoolExecutor(max_workers=max_chunk_workers) as executor:
                futures = [executor.submit(_process_chunk, item) for item in enumerate(chunks)]
                for future in as_completed(futures):
                    idx, chunk, chunk_result = future.result()

                    if language is None:
                        language = chunk_result["language"]

                    if language_probability is None:
                        language_probability = chunk_result.get("language_probability")

                    processing_time += chunk_result.get("processing_time", 0)

                    duration = max(
                        duration,
                        chunk["offset"] + chunk_result["duration"]
                    )

                    for segment in chunk_result["segments"]:
                        segment["start"] += chunk["offset"]
                        segment["end"] += chunk["offset"]
                        all_segments.append(segment)

                    completed_count += 1
                    progress = 30 + int((completed_count / total_chunks) * 50)

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