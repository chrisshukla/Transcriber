import os
from celery import Celery
from app.utils.logger import logger

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "transcriptor",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.queue.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

def is_celery_available() -> bool:
    """Checks if Redis broker is reachable for Celery workers."""
    try:
        import redis
        client = redis.Redis.from_url(REDIS_URL, socket_timeout=1.5)
        return bool(client.ping())
    except Exception as e:
        logger.info(f"Redis/Celery not active locally ({e}). Using native sequential JobManager queue.")
        return False
