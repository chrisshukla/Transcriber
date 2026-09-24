from app.queue.celery_app import celery_app
from app.services.transcription_service import TranscriptionService
from app.repositories.job_repository import JobRepository
from app.utils.logger import logger


@celery_app.task(name="transcribe_task", bind=True, max_retries=3, default_retry_delay=10)
def transcribe_task(self, video_path: str, job_id: str):
    """
    Celery background worker task for processing video/audio transcription.
    Executes in a distributed worker node independently of FastAPI server threads.
    """
    logger.info(f"Celery worker picked up task for job {job_id} (Path: {video_path})")
    try:
        service = TranscriptionService()
        job = service.process(video_path, job_id)
        logger.info(f"Celery worker completed job {job_id} successfully.")
        return job
    except Exception as exc:
        logger.error(f"Celery worker encountered error on job {job_id}: {exc}", exc_info=True)
        JobRepository.fail_job(job_id, f"Execution Error: {str(exc)}")
        raise self.retry(exc=exc)
