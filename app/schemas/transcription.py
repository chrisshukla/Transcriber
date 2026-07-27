from pydantic import BaseModel

from app.models.job_status import JobStatus


class TranscriptionResponse(BaseModel):
    job_id: str
    status: JobStatus