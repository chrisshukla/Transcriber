from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.services.transcription_service import TranscriptionService
from app.queue.job_store import job_manager

router = APIRouter()

transcription_service = TranscriptionService()
jobs = job_manager


@router.post("/transcribe")
async def transcribe(
    filename: str,
    background_tasks: BackgroundTasks
):

    video_path = Path("uploads") / filename

    if not video_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    job = jobs.create_job(filename)

    background_tasks.add_task(
        transcription_service.process,
        str(video_path),
        job.id
    )

    return {
        "message": "Transcription started successfully.",
        "job_id": job.id,
        "status": job.status,
        "progress": job.progress
    }