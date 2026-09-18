import time

from faster_whisper import WhisperModel  # type: ignore

from app.utils.logger import logger


class WhisperService:

    _model = None

    def __init__(
        self,
        model_size: str = "large-v3",
        device: str = "auto",
        compute_type: str = "auto",
    ):

        if WhisperService._model is None:

            logger.info("Loading Faster-Whisper model...")

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

            import os
            num_threads = os.cpu_count() or 8

            logger.info(
                f"Device: {device} | Compute Type: {compute_type} | CPU Threads: {num_threads}"
            )

            WhisperService._model = WhisperModel(
                model_size,
                device=device,
                compute_type=compute_type,
                cpu_threads=num_threads,
            )

            logger.info("Whisper model loaded successfully.")

        self.model = WhisperService._model

    def transcribe(self, audio_path: str):

        logger.info(f"Starting transcription: {audio_path}")

        start_time = time.time()

        segments, info = self.model.transcribe(
            audio_path,
            beam_size=2,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            word_timestamps=False,
            condition_on_previous_text=False,
            temperature=0.0,
            compression_ratio_threshold=2.4,
            no_speech_threshold=0.6,
            repetition_penalty=1.2,
            initial_prompt="This is a Hinglish conversation with mixed Hindi and English speech.",
        )

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
            f"Finished in {elapsed} seconds."
        )

        return {
            "language": info.language,
            "language_probability": round(info.language_probability, 4),
            "duration": round(info.duration, 2),
            "processing_time": elapsed,
            "segments": transcript,
            "segment_count": total_segments,
        }