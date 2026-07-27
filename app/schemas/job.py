from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.job_status import JobStatus


class JobResponse(BaseModel):
    id: str
    filename: str

    status: JobStatus
    progress: int

    language: Optional[str] = None
    duration: Optional[float] = None

    created_at: datetime
    completed_at: Optional[datetime] = None

    pdf_path: Optional[str] = None
    txt_path: Optional[str] = None
    json_path: Optional[str] = None

    error: Optional[str] = None

    class Config:
        from_attributes = True