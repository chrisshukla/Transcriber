import os
import sys
import site
import time
import threading
from typing import Optional

# Ensure NVIDIA CUDA DLLs are registered on Windows
if sys.platform == "win32":
    for p in site.getsitepackages() + [site.getusersitepackages()]:
        if os.path.exists(p):
            for pkg in ["cublas", "cudnn", "cuda_nvrtc"]:
                bin_path = os.path.join(p, "nvidia", pkg, "bin")
                if os.path.exists(bin_path):
                    try:
                        os.add_dll_directory(bin_path)
                    except Exception:
                        pass

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
                    compute_type = "int8_float16"
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
                from faster_whisper import BatchedInferencePipeline  # type: ignore
                WhisperService._batched_pipeline = BatchedInferencePipeline(model=WhisperService._model)  # type: ignore
                logger.info("Faster-Whisper BatchedInferencePipeline enabled for maximum speed.")
            except Exception as batch_err:
                logger.warning(f"BatchedInferencePipeline not initialized, falling back to standard pipeline: {batch_err}")

            logger.info(f"Whisper model ('{model_size}') loaded successfully.")

        self.model = WhisperService._model
        self.batched_pipeline = WhisperService._batched_pipeline

    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        initial_prompt: Optional[str] = None,
        beam_size: int = 2,
    ):

        logger.info(f"Starting transcription: {audio_path} (language override: {language})")

        if self.model is None:
            raise RuntimeError("Whisper model is not initialized.")

        start_time = time.time()

        from typing import Any
        # Build Whisper transcribe arguments dynamically
        kwargs: dict[str, Any] = {
            "beam_size": beam_size,
            "vad_filter": True,
            "vad_parameters": dict(min_silence_duration_ms=500, speech_pad_ms=400),
            "no_speech_threshold": 0.6,
            "word_timestamps": False,
            "condition_on_previous_text": False,
            "temperature": 0.0,
        }

        if language:
            kwargs["language"] = language
        if initial_prompt:
            kwargs["initial_prompt"] = initial_prompt

        with WhisperService._transcribe_lock:
            try:
                if self.batched_pipeline is not None:
                    segments, info = self.batched_pipeline.transcribe(
                        audio_path,
                        batch_size=4,
                        **kwargs
                    )
                else:
                    segments, info = self.model.transcribe(
                        audio_path,
                        **kwargs
                    )
            except Exception as err:
                logger.error(f"Whisper transcribe failed for {audio_path}: {err}")
                raise

            # Safeguard: Spoken Hindi sounds identical to Urdu phonetically.
            # If auto-detection picked Urdu ('ur'), force re-decode or map language to Hindi ('hi')
            detected_lang = info.language
            if detected_lang == "ur" and not language:
                logger.info(f"Auto-detected Urdu ('ur') for {audio_path}. Re-transcribing with language='hi' (Hindi Devanagari)...")
                kwargs["language"] = "hi"
                try:
                    if self.batched_pipeline is not None:
                        segments, info = self.batched_pipeline.transcribe(
                            audio_path,
                            batch_size=4,
                            **kwargs
                        )
                    else:
                        segments, info = self.model.transcribe(
                            audio_path,
                            **kwargs
                        )
                    detected_lang = "hi"
                except Exception as retry_err:
                    logger.warning(f"Re-transcription with language='hi' failed: {retry_err}")
                    detected_lang = "hi"

            transcript = []
            total_segments = 0

            for segment in segments:
                text_clean = segment.text.strip()
                # Exclude empty or raw Perso-Arabic scripts if mapped to hi
                if text_clean:
                    transcript.append(
                        {
                            "start": round(segment.start, 2),
                            "end": round(segment.end, 2),
                            "text": text_clean,
                        }
                    )
                    total_segments += 1

        elapsed = round(time.time() - start_time, 2)

        logger.info(
            f"Finished transcription of {audio_path} in {elapsed} seconds. Detected language: {detected_lang}"
        )

        return {
            "language": detected_lang,
            "language_probability": round(info.language_probability, 4) if hasattr(info, "language_probability") else 1.0,
            "duration": round(info.duration, 2) if hasattr(info, "duration") else 0.0,
            "processing_time": elapsed,
            "segments": transcript,
            "segment_count": total_segments,
        }

