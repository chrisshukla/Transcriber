def _format_timestamp(seconds: float | int) -> str:
    total_secs = int(seconds)
    hours = total_secs // 3600
    minutes = (total_secs % 3600) // 60
    secs = total_secs % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


class TextService:

    def generate(self, transcript: dict, output_txt: str) -> str:

        output = Path(output_txt)
        output.parent.mkdir(parents=True, exist_ok=True)

        logger.info("Generating TXT transcript...")

        dur_sec = round(float(transcript.get("duration", 0)), 2)
        dur_fmt = _format_timestamp(dur_sec)

        with open(output, "w", encoding="utf-8") as file:

            file.write("AI TRANSCRIPTION REPORT\n")
            file.write("=" * 80 + "\n\n")

            if transcript.get("filename"):
                file.write(f"File Name: {transcript.get('filename')}\n")

            file.write(f"Language : {transcript.get('language', 'Unknown')}\n")
            file.write(f"Duration : {dur_fmt} ({dur_sec} seconds)\n\n")

            file.write("=" * 80 + "\n\n")

            for segment in transcript.get("segments", []):
                s_val = segment.get("start", 0)
                e_val = segment.get("end", 0)
                start_fmt = _format_timestamp(s_val) if isinstance(s_val, (int, float)) else str(s_val)
                end_fmt = _format_timestamp(e_val) if isinstance(e_val, (int, float)) else str(e_val)

                display_text = segment.get("hinglish_text") or segment.get("text", "")
                file.write(f"[{start_fmt} - {end_fmt}] {display_text}\n")

        logger.info("TXT generated successfully.")

        return str(output)