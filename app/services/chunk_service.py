import subprocess
from pathlib import Path

from app.utils.logger import logger


class ChunkService:

    def get_duration(self, audio_path: str) -> float:
        """Probe audio duration in seconds using ffprobe without loading audio into memory."""
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path,
        ]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            return float(res.stdout.strip())
        except Exception as err:
            logger.warning(f"ffprobe failed for {audio_path}: {err}. Falling back to default estimation.")
            return 0.0

    def split_audio(
        self,
        audio_path: str,
        job_id: str,
        chunk_minutes: int = 10,
    ) -> list[dict]:
        output_folder = Path("chunks") / job_id
        output_folder.mkdir(parents=True, exist_ok=True)

        duration_sec = self.get_duration(audio_path)
        chunk_length_sec = chunk_minutes * 60

        if duration_sec <= 0:
            logger.warning(f"Could not determine exact duration for {audio_path}. Processing as single chunk.")
            return [{"path": audio_path, "offset": 0.0, "duration": 0.0}]

        total_chunks = int((duration_sec + chunk_length_sec - 0.001) // chunk_length_sec)
        logger.info(f"Stream-chunking {duration_sec:.2f}s audio into {total_chunks} chunks using FFmpeg (0-RAM overhead)...")

        chunk_files = []

        for i in range(total_chunks):
            start_sec = i * chunk_length_sec
            actual_chunk_duration = min(chunk_length_sec, duration_sec - start_sec)
            filename = f"chunk_{i+1:04d}.wav"
            output = output_folder / filename

            # Use FFmpeg stream copying (-c copy or pcm_s16le) to split chunk instantly without memory allocation
            ffmpeg_cmd = [
                "ffmpeg",
                "-y",
                "-ss", str(start_sec),
                "-t", str(actual_chunk_duration),
                "-i", audio_path,
                "-c", "copy",
                str(output),
            ]

            try:
                subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            except Exception as ffmpeg_err:
                logger.warning(f"FFmpeg copy failed for {filename}: {ffmpeg_err}. Retrying with PCM re-encoding...")
                reencode_cmd = [
                    "ffmpeg", "-y", "-ss", str(start_sec), "-t", str(actual_chunk_duration),
                    "-i", audio_path, "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", str(output)
                ]
                subprocess.run(reencode_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

            logger.info(f"FFmpeg created chunk {i+1}/{total_chunks}: {filename}")
            chunk_files.append({
                "path": str(output),
                "offset": start_sec,
                "duration": actual_chunk_duration,
            })

        logger.info("FFmpeg audio chunking complete.")
        return chunk_files