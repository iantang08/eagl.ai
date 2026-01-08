import mimetypes

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.config import get_settings
from app.services.storage import StorageService, get_storage_service

router = APIRouter(prefix="/v1/artifacts", tags=["artifacts"])
settings = get_settings()


@router.get("/local/{s3_key:path}")
def get_local_artifact(
    s3_key: str,
    storage: StorageService = Depends(get_storage_service),
):
    """
    Serve files from local storage (development only).
    Only works when USE_LOCAL_STORAGE=true.
    """
    if not settings.use_local_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Local artifacts endpoint not available in production",
        )

    file_path = storage.get_local_file_path(s3_key)
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    # Determine content type
    content_type, _ = mimetypes.guess_type(str(file_path))
    if not content_type:
        content_type = "application/octet-stream"

    return FileResponse(
        path=str(file_path),
        media_type=content_type,
        filename=file_path.name,
    )
