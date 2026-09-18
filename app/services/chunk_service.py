from pathlib import Path
from pydub import AudioSegment  # type: ignore # pyrefly: ignore [missing-import]

from app.utils.logger import logger


class ChunkService:

    def split_audio(
        self,
        audio_path: str,
        job_id:str,
        chunk_minutes: int = 10,
    ):

        audio: AudioSegment = AudioSegment.from_file(audio_path)

        output_folder = Path("chunks")/job_id
        output_folder.mkdir(parents=True, exist_ok=True)

        chunk_length = chunk_minutes * 60 * 1000

        total_chunks = (len(audio) + chunk_length - 1) // chunk_length

        logger.info(
            f"Creating {total_chunks} chunks..."
        )

        chunk_files = []

        for i in range(total_chunks):

            start = i * chunk_length
            end = min(start + chunk_length, len(audio))

            chunk: AudioSegment = audio[start:end]

            filename = f"chunk_{i+1:04d}.wav"

            output = output_folder / filename

            chunk.export(output, format="wav")

            logger.info(f"Saved {filename}")

            chunk_files.append(
                {
                    "path": str(output),
                    "offset": start / 1000,
                    "duration": (end - start) / 1000,
                }
            )

        logger.info("Chunking complete.")

        return chunk_files