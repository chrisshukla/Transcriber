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
async def list_jobs():
    """
    Return all jobs.
    """
    await job_manager.start_worker()
    return job_manager.list_jobs()


@router.get(
    "/{job_id}",
    response_model=JobResponse
)
async def get_job(job_id: str):
    """
    Return one job.
    """
    await job_manager.start_worker()
    job = job_manager.get_job(job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    return job


@router.post(
    "/{job_id}/retry",
    response_model=MessageResponse
)
async def retry_job(job_id: str):
    """
    Retry or resume an interrupted/failed job.
    """
    if not job_manager.exists(job_id):
        raise HTTPException(
            status_code=404,
            detail="Job not found."
        )

    success = await job_manager.retry_job(job_id)

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Unable to retry job. Original uploaded file may be missing."
        )

    return MessageResponse(
        success=True,
        message="Job retry queued successfully."
    )


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