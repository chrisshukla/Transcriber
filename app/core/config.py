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