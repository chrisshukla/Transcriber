from pathlib import Path
import subprocess
from app.utils.logger import logger


class AudioService:

    def extract_audio(self, video_path: str, output_path: str) -> str:
        """
        Extract audio from a video and convert it to:
        - WAV
        - PCM 16-bit
        - Mono
        - 16kHz
        """

        video = Path(video_path)

        if not video.exists():
            raise FileNotFoundError(f"Video not found: {video_path}")

        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)

        command = [
            "ffmpeg",
            "-y",
            "-i",
            str(video),

            "-vn",

            "-acodec",
            "pcm_s16le",

            "-ar",
            "16000",

            "-ac",
            "1",

            str(output)
        ]

        logger.info("Extracting audio from %s", video.name)

        try:
            subprocess.run(
                command,
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

            logger.info("Audio extraction completed.")

            return str(output)

        except subprocess.CalledProcessError as e:

            logger.error("FFmpeg Error:\n%s", e.stderr)

            raise RuntimeError("Audio extraction failed.") from e