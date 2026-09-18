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

    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    completed_at: datetime | None = None

    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    output_file: str | None = None

    transcript_file: str | None = None

    pdf_file: str | None = None

    duration: float | None = None

    language: str | None = None

    error: str | None = None

    @property
    def pdf_path(self) -> str | None:
        return self.pdf_file

    @property
    def txt_path(self) -> str | None:
        return self.output_file

    @property
    def text_file(self) -> str | None:
        return self.output_file

    @property
    def json_path(self) -> str | None:
        return self.transcript_file