from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.queue.job_store import job_manager

router = APIRouter()
jobs = job_manager


@router.post("/transcribe")
async def transcribe(
    filename: str
):

    video_path = Path("uploads") / filename

    if not video_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    job = jobs.create_job(filename)

    await jobs.enqueue_job(
        str(video_path),
        job.id
    )


    return {
        "message": "Transcription job queued successfully.",
        "job_id": job.id,
        "status": job.status,
        "progress": job.progress
    }