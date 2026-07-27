from pydantic import BaseModel

from app.models.job_status import JobStatus


class UploadResponse(BaseModel):
    job_id: str
    filename: str
    status: JobStatus
    