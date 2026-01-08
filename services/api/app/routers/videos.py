from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Video
from app.schemas import VideoCreate, VideoResponse
from app.services.auth import get_current_user
from app.services.storage import StorageService, get_storage_service

router = APIRouter(prefix="/v1/videos", tags=["videos"])


@router.post("", response_model=VideoResponse)
def create_video(
    data: VideoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    storage: StorageService = Depends(get_storage_service),
):
    """Create a video record after upload is complete."""
    # Verify the file exists in storage
    if not storage.file_exists(data.s3_key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File not found in storage. Please upload the file first.",
        )

    video = Video(
        user_id=current_user.id,
        s3_key_raw=data.s3_key,
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    return video


@router.get("", response_model=list[VideoResponse])
def list_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0,
):
    """List user's videos with pagination."""
    videos = (
        db.query(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Video.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return videos


@router.get("/{video_id}", response_model=VideoResponse)
def get_video(
    video_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific video."""
    video = (
        db.query(Video)
        .filter(Video.id == video_id, Video.user_id == current_user.id)
        .first()
    )
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    return video
