from dataclasses import dataclass, field
from datetime import datetime,UTC
from uuid import uuid4

from app.models.job_status import JobStatus


@dataclass
class Job:

    id: str = field(default_factory=lambda: str(uuid4()))

    filename: str = ""

    status: JobStatus = JobStatus.UPLOADED

    progress: int = 0

    created_at: datetime = field(default_factory=lambda:datetime.now(UTC))

    updated_at: datetime = field(default_factory=lambda:datetime.now(UTC))

    output_file: str | None = None

    transcript_file: str | None = None

    pdf_file: str | None = None

    duration: float | None = None

    language: str | None = None

    error: str | None = None