from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "eaglai",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(name="worker.tasks.analyze_video")
def analyze_video_task(job_id: str):
    """
    Proxy task to send analyze_video to the worker.
    The actual implementation is in the worker service.
    """
    pass
