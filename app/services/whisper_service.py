import time

from faster_whisper import WhisperModel

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

            logger.info(
                f"Device: {device} | Compute Type: {compute_type}"
            )

            WhisperService._model = WhisperModel(
                model_size,
                device=device,
                compute_type=compute_type,
            )

            logger.info("Whisper model loaded successfully.")

        self.model = WhisperService._model

    def transcribe(self, audio_path: str):

        logger.info(f"Starting transcription: {audio_path}")

        start_time = time.time()

        segments, info = self.model.transcribe(
            audio_path,
            beam_size=5,
            vad_filter=True,
            word_timestamps=True,
            condition_on_previous_text=True,
            temperature=0.0,
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