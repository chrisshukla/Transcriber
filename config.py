from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

UPLOAD_FOLDER = BASE_DIR / "uploads"
AUDIO_FOLDER = BASE_DIR / "audio"
OUTPUT_FOLDER = BASE_DIR / "output"
TEMP_FOLDER = BASE_DIR / "temp"

FFMPEG_PATH = "ffmpeg"

SUPPORTED_VIDEO_FORMATS = {
    ".mp4",
    ".mov",
    ".mkv",
    ".avi",
    ".webm",
    ".m4v"
}

AUDIO_SAMPLE_RATE = 16000
AUDIO_CHANNELS = 1

UPLOAD_FOLDER.mkdir(exist_ok=True)
AUDIO_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)
TEMP_FOLDER.mkdir(exist_ok=True)