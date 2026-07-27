from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.queue.job_store import job_manager

router = APIRouter(
    prefix="/download",
    tags=["Downloads"]
)


def _get_job(job_id: str):
    job = job_manager.get_job(job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    return job


@router.get("/pdf/{job_id}")
def download_pdf(job_id: str):

    job = _get_job(job_id)

    if not job.pdf_file:
        raise HTTPException(
            status_code=404,
            detail="PDF not available."
        )

    path = Path(job.pdf_file)

    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="PDF file not found."
        )

    return FileResponse(
        path=path,
        filename=path.name,
        media_type="application/pdf"
    )


@router.get("/txt/{job_id}")
def download_txt(job_id: str):

    job = _get_job(job_id)

    if not job.text_file:
        raise HTTPException(
            status_code=404,
            detail="TXT not available."
        )

    path = Path(job.text_file)

    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="TXT file not found."
        )

    return FileResponse(
        path=path,
        filename=path.name,
        media_type="text/plain"
    )


@router.get("/json/{job_id}")
def download_json(job_id: str):

    job = _get_job(job_id)

    if not job.transcript_file:
        raise HTTPException(
            status_code=404,
            detail="JSON transcript not available."
        )

    path = Path(job.transcript_file)

    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail="JSON transcript not found."
        )

    return FileResponse(
        path=path,
        filename=path.name,
        media_type="application/json"
    )