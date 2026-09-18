import asyncio
from datetime import datetime
from typing import List, Optional

from app.models.job import Job
from app.models.job_status import JobStatus
from app.repositories.job_repository import JobRepository
from app.utils.logger import logger


class JobManager:

    def __init__(self):
        self.repository = JobRepository()
        self._queue = asyncio.Queue()
        self._queued_ids = set()
        self._worker_task = None

    async def recover_queued_jobs(self):
        from pathlib import Path
        rows = self.repository.get_all_jobs()
        for row in rows:
            st = row["status"]
            if st not in (JobStatus.COMPLETED.value, JobStatus.FAILED.value):
                job_id = row["id"]
                if job_id in self._queued_ids:
                    continue
                filename = row["filename"]
                video_path = str(Path("uploads") / filename)
                if Path(video_path).exists():
                    logger.info(f"Auto-recovering interrupted/queued job {job_id} (previous status: {st}) into worker queue...")
                    self.update_status(job_id, JobStatus.QUEUED)
                    self._queued_ids.add(job_id)
                    await self._queue.put((video_path, job_id))

    async def start_worker(self):
        await self.recover_queued_jobs()
        if self._worker_task is None or self._worker_task.done():
            self._worker_task = asyncio.create_task(self._worker_loop())

    async def _worker_loop(self):
        try:
            from app.services.transcription_service import TranscriptionService
            from pathlib import Path
            service = TranscriptionService()
            logger.info("Sequential Job Queue Worker started.")
        except Exception as init_err:
            logger.error(f"Failed to initialize Worker/TranscriptionService: {init_err}")
            return

        while True:
            video_path, job_id = await self._queue.get()
            try:
                job_row = self.repository.get_job(job_id)
                if not job_row:
                    logger.info(f"Skipping job {job_id} because it was deleted from database.")
                    continue

                if not Path(video_path).exists():
                    logger.warning(f"Video file missing for job {job_id}: {video_path}")
                    self.fail_job(job_id, f"Uploaded file {video_path} no longer exists.")
                    continue

                logger.info(f"Worker picking up queued job {job_id}...")
                await asyncio.to_thread(service.process, video_path, job_id)
            except Exception as e:
                logger.error(f"Worker encountered error for job {job_id}: {e}")
            finally:
                self._queued_ids.discard(job_id)
                self._queue.task_done()

    async def enqueue_job(self, video_path: str, job_id: str):
        self.update_status(job_id, JobStatus.QUEUED)
        if job_id not in self._queued_ids:
            self._queued_ids.add(job_id)
            await self._queue.put((video_path, job_id))
        await self.start_worker()

    def _row_to_job(self, row) -> Job:

        job = Job(
            id=row["id"],
            filename=row["filename"]
        )

        job.status = JobStatus(row["status"])
        job.progress = row["progress"]
        job.duration = row["duration"]
        job.language = row["language"]
        job.error = row["error"]

        if row["created_at"]:
            try:
                job.created_at = datetime.fromisoformat(row["created_at"])
            except Exception:
                pass

        if row["completed_at"]:
            try:
                job.completed_at = datetime.fromisoformat(row["completed_at"])
            except Exception:
                pass

        job.pdf_file = row["pdf_path"]
        job.output_file = row["txt_path"]
        job.transcript_file = row["json_path"]

        return job

    def create_job(self, filename: str) -> Job:

        job = Job(filename=filename)

        self.repository.create_job(
            job.id,
            job.filename
        )

        return job

    def get_job(self, job_id: str) -> Optional[Job]:

        row = self.repository.get_job(job_id)

        if not row:
            return None

        return self._row_to_job(row)

    def list_jobs(self) -> List[Job]:

        rows = self.repository.get_all_jobs()

        return [self._row_to_job(row) for row in rows]

    def update_status(self, job_id: str, status: JobStatus):

        self.repository.update_status(
            job_id,
            status.value
        )

        return True

    def update_progress(self, job_id: str, progress: int,status:JobStatus):

        progress = max(0, min(progress, 100))

        self.repository.update_progress(
            job_id,
            progress,
            status.value
        )

        return True

    def set_duration(self, job_id: str, duration: float):

        self.repository.update_duration(
            job_id,
            duration
        )

        return True

    def set_language(self, job_id: str, language: str):

        self.repository.update_language(
            job_id,
            language
        )

        return True

    def set_transcript_file(self, job_id: str, transcript_file: str):

        self.repository.update_transcript_file(
            job_id,
            transcript_file
        )

        return True

    def complete_job(
        self,
        job_id: str,
        pdf_file: str = "",
        text_file: str = "",
        transcript_file: str = "",
    ):

        row = self.repository.get_job(job_id)

        if not row:
            return False

        self.repository.complete_job(
            job_id=job_id,
            language=row["language"],
            duration=row["duration"],
            pdf_path=pdf_file,
            txt_path=text_file,
            json_path=transcript_file
        )

        return True

    def fail_job(self, job_id: str, error: str):

        self.repository.fail_job(
            job_id,
            error
        )

        return True

    def delete_job(self, job_id: str):
        row = self.repository.get_job(job_id)
        if row:
            from pathlib import Path
            import shutil

            # Delete uploaded file if present
            if row.get("filename"):
                upload_file = Path("uploads") / row["filename"]
                if upload_file.exists():
                    try:
                        upload_file.unlink()
                        logger.info(f"Deleted upload file: {upload_file}")
                    except Exception as e:
                        logger.warning(f"Failed to delete upload file {upload_file}: {e}")

            # Delete generated output files (PDF, TXT, JSON)
            for path_key in ("pdf_path", "txt_path", "json_path"):
                if row.get(path_key):
                    fpath = Path(row[path_key])
                    if fpath.exists():
                        try:
                            fpath.unlink()
                            logger.info(f"Deleted output file: {fpath}")
                        except Exception as e:
                            logger.warning(f"Failed to delete file {fpath}: {e}")

            # Delete extracted WAV audio file if present
            if row.get("filename"):
                video_stem = Path(row["filename"]).stem
                audio_file = Path("audio") / f"{video_stem}.wav"
                if audio_file.exists():
                    try:
                        audio_file.unlink()
                        logger.info(f"Deleted audio file: {audio_file}")
                    except Exception as e:
                        logger.warning(f"Failed to delete audio file {audio_file}: {e}")

            # Delete chunks folder if present
            chunk_dir = Path("chunks") / job_id
            if chunk_dir.exists():
                try:
                    shutil.rmtree(chunk_dir)
                    logger.info(f"Deleted chunk dir: {chunk_dir}")
                except Exception as e:
                    logger.warning(f"Failed to delete chunk dir {chunk_dir}: {e}")

        self.repository.delete_job(job_id)
        return True

    def exists(self, job_id: str):

        return self.repository.get_job(job_id) is not None

    def clear(self):

        self.repository.clear_jobs()