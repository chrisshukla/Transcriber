from fastapi import APIRouter, HTTPException

from app.queue.job_store import job_manager
from app.schemas.job import JobResponse
from app.schemas.common import MessageResponse

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


@router.get(
    "/",
    response_model=list[JobResponse]
)
def list_jobs():
    """
    Return all jobs.
    """
    return job_manager.list_jobs()


@router.get(
    "/{job_id}",
    response_model=JobResponse
)
def get_job(job_id: str):
    """
    Return one job.
    """

    job = job_manager.get_job(job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    return job


@router.delete(
    "/{job_id}",
    response_model=MessageResponse
)
def delete_job(job_id: str):
    """
    Delete a job.
    """

    if not job_manager.exists(job_id):
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    job_manager.delete_job(job_id)

    return MessageResponse(
        success=True,
        message="Job deleted successfully."
    )