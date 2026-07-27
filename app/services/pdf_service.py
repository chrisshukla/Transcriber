from pathlib import Path
from datetime import datetime

from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app.utils.logger import logger

FONT_DIR = Path("fonts")


class PDFService:

    def __init__(self):

        dev_font=FONT_DIR/"NotoSansDevanagari-VariableFont_wdth,wght.ttf"

        if dev_font.exists():
            pdfmetrics.registerFont(
                TTFont(
                    "NotoDevanagari",
                    str(dev_font)
                )
            )
            
        noto_font = FONT_DIR / "NotoSans-VariableFont_wdth,wght.ttf"

        if noto_font.exists():
            pdfmetrics.registerFont(
                TTFont("NotoSans", str(noto_font))
            )

            self.font = "NotoSans"

            logger.info("Loaded NotoSans font.")

        else:
            logger.warning("Noto font not found. Using Helvetica.")

    def generate(self, transcript: dict, output_pdf: str) -> str:

        output = Path(output_pdf)
        output.parent.mkdir(parents=True, exist_ok=True)

        logger.info("Generating PDF...")

        pdf = SimpleDocTemplate(str(output))

        styles = getSampleStyleSheet()

        title_style = styles["Title"]
        title_style.fontName = self.font

        heading_style = styles["Heading2"]
        heading_style.fontName = self.font

        normal_style = styles["Normal"]
        normal_style.fontName = self.font

        story = []

        story.append(
            Paragraph(
                "AI Transcription Report",
                title_style
            )
        )

        story.append(Spacer(1, 20))

        story.append(
            Paragraph(
                f"<b>Generated:</b> {datetime.now().strftime('%d-%m-%Y %H:%M:%S')}",
                normal_style
            )
        )

        story.append(
            Paragraph(
                f"<b>Language:</b> {transcript.get('language', 'Unknown')}",
                normal_style
            )
        )

        story.append(
            Paragraph(
                f"<b>Duration:</b> {round(transcript.get('duration',0),2)} seconds",
                normal_style
            )
        )

        story.append(Spacer(1,20))

        story.append(
            Paragraph(
                "Transcript",
                heading_style
            )
        )

        story.append(Spacer(1,10))

        for segment in transcript.get("segments", []):

            text = (
                f"[{segment['start']:.2f}s - "
                f"{segment['end']:.2f}s] "
                f"{segment['text']}"
            )

            story.append(
                Paragraph(text, normal_style)
            )

            story.append(
                Spacer(1,5)
            )

        pdf.build(story)

        logger.info("PDF Generated Successfully.")

        return str(output)