from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User, Video, AnalysisJob, AnalysisResult
from app.schemas import AnalysisJobCreate, AnalysisJobResponse, AnalysisResultResponse
from app.services.auth import get_current_user
from app.services.storage import StorageService, get_storage_service

router = APIRouter(tags=["analysis"])
settings = get_settings()


@router.post("/v1/analysis_jobs", response_model=AnalysisJobResponse)
def create_analysis_job(
    data: AnalysisJobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new analysis job for a video."""
    # Verify video exists and belongs to user
    video = (
        db.query(Video)
        .filter(Video.id == data.video_id, Video.user_id == current_user.id)
        .first()
    )
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    # Check for existing pending/processing job
    existing_job = (
        db.query(AnalysisJob)
        .filter(
            AnalysisJob.video_id == data.video_id,
            AnalysisJob.status.in_(["pending", "processing"]),
        )
        .first()
    )
    if existing_job:
        return _job_to_response(existing_job)

    # Create the job
    job = AnalysisJob(
        video_id=data.video_id,
        criteria_version=data.criteria_version,
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Queue the Celery task
    from app.celery_client import analyze_video_task
    analyze_video_task.delay(str(job.id))

    return _job_to_response(job)


@router.get("/v1/analysis_jobs/{job_id}", response_model=AnalysisJobResponse)
def get_analysis_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the status of an analysis job."""
    job = (
        db.query(AnalysisJob)
        .join(Video)
        .filter(AnalysisJob.id == job_id, Video.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis job not found",
        )

    return _job_to_response(job)


@router.get("/v1/analysis_results/{result_id}", response_model=AnalysisResultResponse)
def get_analysis_result(
    result_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    storage: StorageService = Depends(get_storage_service),
):
    """Get the results of a completed analysis."""
    result = (
        db.query(AnalysisResult)
        .join(AnalysisJob)
        .join(Video)
        .filter(AnalysisResult.id == result_id, Video.user_id == current_user.id)
        .first()
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis result not found",
        )

    # Generate presigned URLs for artifacts
    results_json_url = storage.get_presigned_download_url(result.results_json_s3_key)
    thumbnail_url = storage.get_presigned_download_url(result.thumbnail_s3_key)

    return AnalysisResultResponse(
        id=result.id,
        job_id=result.job_id,
        overall_score=result.summary_score,
        results_json_url=results_json_url,
        thumbnail_url=thumbnail_url,
        created_at=result.created_at,
    )


def _job_to_response(job: AnalysisJob) -> AnalysisJobResponse:
    """Convert an AnalysisJob to its response schema."""
    return AnalysisJobResponse(
        id=job.id,
        video_id=job.video_id,
        status=job.status,
        criteria_version=job.criteria_version,
        error=job.error,
        progress=job.progress,
        result_id=job.result.id if job.result else None,
        started_at=job.started_at,
        finished_at=job.finished_at,
        created_at=job.created_at,
    )
