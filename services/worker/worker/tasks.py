import json
import tempfile
from datetime import datetime
from pathlib import Path

import structlog

from worker.celery_app import celery_app
from worker.config import get_settings
from worker.database import SessionLocal
from worker.models import AnalysisJob, AnalysisResult, Video
from worker.storage import get_storage_service
from worker.analysis import (
    analyze_video,
    create_thumbnail,
    generate_mock_result,
    result_to_dict,
)

settings = get_settings()
logger = structlog.get_logger()


def update_job_progress(db, job: AnalysisJob, progress: int, status: str = None):
    """Update job progress and optionally status."""
    job.progress = progress
    if status:
        job.status = status
    db.commit()


@celery_app.task(name="worker.tasks.analyze_video", bind=True)
def analyze_video_task(self, job_id: str):
    """Main analysis task."""
    db = SessionLocal()
    storage = get_storage_service()

    try:
        # Get job
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job:
            logger.error("Job not found", job_id=job_id)
            return

        # Update status
        job.status = "processing"
        job.started_at = datetime.utcnow()
        job.progress = 5
        db.commit()

        logger.info("Starting analysis", job_id=job_id, video_id=str(job.video_id))

        # Get video
        video = db.query(Video).filter(Video.id == job.video_id).first()
        if not video:
            raise ValueError(f"Video not found: {job.video_id}")

        update_job_progress(db, job, 10)

        # Check for dev skip mode
        if settings.dev_skip_analysis:
            logger.info("Using mock analysis (DEV_SKIP_ANALYSIS=true)", job_id=job_id)

            result = generate_mock_result()
            result_dict = result_to_dict(result)

            # Create mock artifacts
            results_key = storage.generate_result_key(job_id, "results.json")
            storage.upload_bytes(
                json.dumps(result_dict, indent=2).encode(),
                results_key,
                "application/json",
            )

            thumbnail_key = storage.generate_result_key(job_id, "thumbnail.jpg")
            # Create a simple placeholder thumbnail
            from PIL import Image
            import io

            img = Image.new("RGB", (320, 240), color=(50, 100, 50))
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            storage.upload_bytes(buf.getvalue(), thumbnail_key, "image/jpeg")

            # Update video metadata with mock values
            video.duration_ms = 3000
            video.fps = 30.0
            video.width = 1920
            video.height = 1080

            update_job_progress(db, job, 90)

        else:
            # Real analysis pipeline
            with tempfile.TemporaryDirectory() as tmpdir:
                tmpdir = Path(tmpdir)
                video_path = tmpdir / "video.mp4"

                # Download video
                update_job_progress(db, job, 15)
                logger.info("Downloading video", s3_key=video.s3_key_raw)
                storage.download_file(video.s3_key_raw, video_path)

                # Run analysis
                update_job_progress(db, job, 30)
                logger.info("Running analysis")
                result, metadata = analyze_video(video_path)

                # Update video metadata
                video.duration_ms = metadata.duration_ms
                video.fps = metadata.fps
                video.width = metadata.width
                video.height = metadata.height

                update_job_progress(db, job, 70)

                # Create thumbnail
                logger.info("Creating thumbnail")
                thumbnail_path = tmpdir / "thumbnail.jpg"

                # Use impact phase timestamp if available
                impact_ts = 0
                for phase in result.phases:
                    if phase.name == "impact":
                        impact_ts = phase.timestamp_ms
                        break

                create_thumbnail(video_path, thumbnail_path, impact_ts)

                update_job_progress(db, job, 80)

                # Upload artifacts
                logger.info("Uploading artifacts")
                result_dict = result_to_dict(result)

                results_key = storage.generate_result_key(job_id, "results.json")
                storage.upload_bytes(
                    json.dumps(result_dict, indent=2).encode(),
                    results_key,
                    "application/json",
                )

                thumbnail_key = storage.generate_result_key(job_id, "thumbnail.jpg")
                storage.upload_file(thumbnail_path, thumbnail_key, "image/jpeg")

                update_job_progress(db, job, 90)

        # Create result record
        analysis_result = AnalysisResult(
            job_id=job.id,
            summary_score=result_dict["overall_score"],
            results_json_s3_key=results_key,
            thumbnail_s3_key=thumbnail_key,
        )
        db.add(analysis_result)

        # Mark job complete
        job.status = "completed"
        job.progress = 100
        job.finished_at = datetime.utcnow()
        db.commit()

        logger.info(
            "Analysis completed",
            job_id=job_id,
            score=result_dict["overall_score"],
        )

    except Exception as e:
        logger.exception("Analysis failed", job_id=job_id, error=str(e))
        job.status = "failed"
        job.error = str(e)
        job.finished_at = datetime.utcnow()
        db.commit()
        raise

    finally:
        db.close()
