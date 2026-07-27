from pathlib import Path

from app.utils.logger import logger


class TextService:

    def generate(self, transcript: dict, output_txt: str) -> str:

        output = Path(output_txt)
        output.parent.mkdir(parents=True, exist_ok=True)

        logger.info("Generating TXT transcript...")

        with open(output, "w", encoding="utf-8") as file:

            file.write("AI TRANSCRIPTION REPORT\n")
            file.write("=" * 80 + "\n\n")

            file.write(f"Language : {transcript.get('language', 'Unknown')}\n")
            file.write(f"Duration : {round(transcript.get('duration', 0), 2)} seconds\n\n")

            file.write("=" * 80 + "\n\n")

            for segment in transcript.get("segments", []):

                file.write(
                    f"[{segment['start']:.2f}s - {segment['end']:.2f}s] "
                    f"{segment['text']}\n"
                )

        logger.info("TXT generated successfully.")

        return str(output)