from pathlib import Path

# Base directory
BASE_DIR = Path(".")

# Project directories
UPLOAD_DIR = BASE_DIR / "uploads"
AUDIO_DIR = BASE_DIR / "audio"
OUTPUT_DIR = BASE_DIR / "output"
TRANSCRIPT_DIR = BASE_DIR / "transcripts"
CHUNK_DIR = BASE_DIR / "chunks"
DATABASE_DIR = BASE_DIR / "database"
LOG_DIR = BASE_DIR / "logs"

# Create directories automatically
for directory in (
    UPLOAD_DIR,
    AUDIO_DIR,
    OUTPUT_DIR,
    TRANSCRIPT_DIR,
    CHUNK_DIR,
    DATABASE_DIR,
    LOG_DIR,
):
    directory.mkdir(
        parents=True,
        exist_ok=True
    )

# Whisper Model & Resource Configuration
# 'large-v3' is OpenAI's 1.55 Billion parameter Whisper model (~1.55B params, highest accuracy)
# Set to 'large-v3-turbo' for 2.5x FASTER transcription speed with nearly identical accuracy!
import os

WHISPER_MODEL_SIZE = "large-v3-turbo"
WHISPER_DEVICE = "cuda"
WHISPER_COMPUTE_TYPE = "float16"

# Reserve 2 CPU logical cores for OS, Uvicorn server, and browser UI responsiveness
WHISPER_CPU_THREADS = max(1, (os.cpu_count() or 4) - 2)


