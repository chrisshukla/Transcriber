from pathlib import Path
import shutil
from uuid import uuid4
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".mp4",
    ".avi",
    ".mov",
    ".mkv",
    ".webm",
    ".mp3",
    ".wav",
    ".m4a"
}


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type."
        )

    destination = UPLOAD_DIR / f"{uuid4()}_{file.filename}"

    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        if destination.exists():
            try:
                destination.unlink()
            except Exception:
                pass

        if isinstance(e, OSError) and (getattr(e, 'errno', None) == 28 or "No space left on device" in str(e)):
            raise HTTPException(
                status_code=507,
                detail="Server storage is full. Cannot save uploaded file."
            )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    return {
        "message": "File uploaded successfully.",
        "filename": file.filename,
        "path": str(destination)
    }