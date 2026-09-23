import time
import threading
from typing import Optional

from faster_whisper import WhisperModel  # type: ignore

from app.core.config import (
    WHISPER_MODEL_SIZE,
    WHISPER_DEVICE,
    WHISPER_COMPUTE_TYPE,
    WHISPER_CPU_THREADS,
)
from app.utils.logger import logger


class WhisperService:

    _model: Optional[WhisperModel] = None
    _batched_pipeline = None
    _transcribe_lock = threading.Lock()

    def __init__(
        self,
        model_size: str = WHISPER_MODEL_SIZE,
        device: str = WHISPER_DEVICE,
        compute_type: str = WHISPER_COMPUTE_TYPE,
        cpu_threads: int = WHISPER_CPU_THREADS,
    ):

        if WhisperService._model is None:

            logger.info(f"Loading Faster-Whisper model ('{model_size}')...")

            if device == "auto":
                try:
                    import torch

                    device = "cuda" if torch.cuda.is_available() else "cpu"

                except Exception:
                    device = "cpu"

            if compute_type == "auto":

                if device == "cuda":
                    compute_type = "float16"
                else:
                    compute_type = "int8"

            num_threads = cpu_threads

            logger.info(
                f"Device: {device} | Compute Type: {compute_type} | CPU Threads: {num_threads}"
            )

            try:
                WhisperService._model = WhisperModel(
                    model_size,
                    device=device,
                    compute_type=compute_type,
                    cpu_threads=num_threads,
                    local_files_only=True,
                )
            except Exception:
                WhisperService._model = WhisperModel(
                    model_size,
                    device=device,
                    compute_type=compute_type,
                    cpu_threads=num_threads,
                )

            try:
                from faster_whisper import BatchedInferencePipeline
                WhisperService._batched_pipeline = BatchedInferencePipeline(model=WhisperService._model)
                logger.info("Faster-Whisper BatchedInferencePipeline enabled for maximum speed.")
            except Exception as batch_err:
                logger.warning(f"BatchedInferencePipeline not initialized, falling back to standard pipeline: {batch_err}")

            logger.info(f"Whisper model ('{model_size}') loaded successfully.")

        self.model = WhisperService._model
        self.batched_pipeline = WhisperService._batched_pipeline

    def transcribe(self, audio_path: str):

        logger.info(f"Starting transcription: {audio_path}")

        start_time = time.time()

        with WhisperService._transcribe_lock:
            try:
                segments, info = self.model.transcribe(
                    audio_path,
                    beam_size=1,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                    word_timestamps=False,
                    condition_on_previous_text=False,
                    temperature=0.0,
                    repetition_penalty=1.1,
                    initial_prompt="This is a Hinglish conversation with mixed Hindi and English speech.",
                )
            except Exception as err:
                logger.error(f"Whisper transcribe failed for {audio_path}: {err}")
                raise

            transcript = []

            total_segments = 0

            for segment in segments:

                transcript.append(
                    {
                        "start": round(segment.start, 2),
                        "end": round(segment.end, 2),
                        "text": segment.text.strip(),
                    }
                )

                total_segments += 1

        elapsed = round(time.time() - start_time, 2)

        logger.info(
            f"Finished transcription of {audio_path} in {elapsed} seconds."
        )

        return {
            "language": info.language,
            "language_probability": round(info.language_probability, 4),
            "duration": round(info.duration, 2),
            "processing_time": elapsed,
            "segments": transcript,
            "segment_count": total_segments,
        }

