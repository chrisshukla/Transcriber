import html
from pathlib import Path
from datetime import datetime

from reportlab.lib import colors  # type: ignore
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle  # type: ignore
from reportlab.platypus import (  # type: ignore
    SimpleDocTemplate,
    Paragraph,
    Spacer,
)
from reportlab.pdfbase import pdfmetrics  # type: ignore
from reportlab.pdfbase.ttfonts import TTFont  # type: ignore

from app.utils.logger import logger

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FONT_DIR = PROJECT_ROOT / "fonts"


class PDFService:

    def __init__(self):
        self.devanagari_available = False
        self.notosans_available = False

        dev_font_paths = [
            FONT_DIR / "NotoSansDevanagari-Regular.ttf",
            FONT_DIR / "NotoSansDevanagari-VariableFont_wdth,wght.ttf"
        ]

        for dev_font in dev_font_paths:
            if dev_font.exists():
                try:
                    pdfmetrics.registerFont(
                        TTFont("NotoDevanagari", str(dev_font))
                    )
                    self.devanagari_available = True
                    logger.info(f"Loaded Devanagari font: {dev_font.name}")
                    break
                except Exception as e:
                    logger.warning(f"Failed to register Devanagari font: {e}")

        noto_font = FONT_DIR / "NotoSans-VariableFont_wdth,wght.ttf"
        if noto_font.exists():
            try:
                pdfmetrics.registerFont(
                    TTFont("NotoSans", str(noto_font))
                )
                self.notosans_available = True
                logger.info("Loaded NotoSans font.")
            except Exception as e:
                logger.warning(f"Failed to register NotoSans font: {e}")

        if self.devanagari_available:
            self.default_font = "NotoDevanagari"
        elif self.notosans_available:
            self.default_font = "NotoSans"
        else:
            self.default_font = "Helvetica"

    def _has_devanagari(self, text: str | None) -> bool:
        if not text:
            return False
        return any("\u0900" <= char <= "\u097F" for char in text)

    def generate(self, transcript: dict, output_pdf: str) -> str:
        output = Path(output_pdf)
        output.parent.mkdir(parents=True, exist_ok=True)

        logger.info("Generating PDF...")

        pdf = SimpleDocTemplate(
            str(output),
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        lang = transcript.get("language") or ""
        header_font = "NotoSans" if self.notosans_available else "Helvetica"

        title_style = ParagraphStyle(
            "PDFTitle",
            parent=styles["Title"],
            fontName=header_font,
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#1E293B")
        )

        heading_style = ParagraphStyle(
            "PDFHeading",
            parent=styles["Heading2"],
            fontName=header_font,
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=6
        )

        normal_style = ParagraphStyle(
            "PDFNormal",
            parent=styles["Normal"],
            fontName=header_font,
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )

        devanagari_font = "NotoDevanagari" if self.devanagari_available else header_font
        english_font = "NotoSans" if self.notosans_available else "Helvetica"

        segment_devanagari_style = ParagraphStyle(
            "PDFSegDev",
            parent=styles["Normal"],
            fontName=devanagari_font,
            fontSize=10,
            leading=15,
            textColor=colors.HexColor("#1E293B")
        )

        segment_english_style = ParagraphStyle(
            "PDFSegEng",
            parent=styles["Normal"],
            fontName=english_font,
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#1E293B")
        )

        story = []

        story.append(Paragraph("AI Transcription Report", title_style))  # type: ignore
        story.append(Spacer(1, 15))  # type: ignore

        gen_time = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
        raw_duration = transcript.get("duration")
        duration_sec = round(float(raw_duration), 2) if raw_duration is not None else 0.0
        duration_min = f"{int(duration_sec // 60)}m {int(duration_sec % 60)}s"

        file_name = transcript.get("filename") or ""
        meta_parts = []
        if file_name:
            meta_parts.append(f"<b>File Name:</b> {html.escape(str(file_name))}")
        meta_parts.append(f"<b>Generated:</b> {gen_time}")
        if lang:
            meta_parts.append(f"<b>Language:</b> {html.escape(str(lang).upper())}")
        meta_parts.append(f"<b>Duration:</b> {duration_min} ({duration_sec}s)")

        metadata_text = " &nbsp;&nbsp;|&nbsp;&nbsp; ".join(meta_parts)
        story.append(Paragraph(metadata_text, normal_style))  # type: ignore
        story.append(Spacer(1, 15))  # type: ignore

        story.append(Paragraph("Transcript", heading_style))  # type: ignore
        story.append(Spacer(1, 10))  # type: ignore

        for segment in transcript.get("segments") or []:
            if not isinstance(segment, dict):
                continue

            s_val = segment.get("start") or 0
            e_val = segment.get("end") or 0

            if isinstance(s_val, (int, float)):
                start_fmt = f"{int(s_val // 60):02d}:{int(s_val % 60):02d}"
            else:
                start_fmt = str(s_val)

            if isinstance(e_val, (int, float)):
                end_fmt = f"{int(e_val // 60):02d}:{int(e_val % 60):02d}"
            else:
                end_fmt = str(e_val)

            text_val = segment.get("text")
            hinglish_val = segment.get("hinglish_text")
            display_text = text_val if text_val is not None else (hinglish_val if hinglish_val is not None else "")
            display_text = str(display_text)

            line_content = f"<b>[{start_fmt} - {end_fmt}]</b> {html.escape(display_text)}"

            if self._has_devanagari(display_text):
                cur_style = segment_devanagari_style
            else:
                cur_style = segment_english_style

            story.append(Paragraph(line_content, cur_style))  # type: ignore
            story.append(Spacer(1, 6))  # type: ignore

        pdf.build(story)  # type: ignore

        logger.info(f"PDF Generated Successfully at {output}")
        return str(output)