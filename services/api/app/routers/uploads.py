from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import Response

from app.config import get_settings
from app.models import User
from app.schemas import PresignRequest, PresignResponse
from app.services.auth import get_current_user
from app.services.storage import StorageService, get_storage_service

router = APIRouter(prefix="/v1/uploads", tags=["uploads"])
settings = get_settings()


@router.post("/presign", response_model=PresignResponse)
def get_presigned_url(
    data: PresignRequest,
    current_user: User = Depends(get_current_user),
    storage: StorageService = Depends(get_storage_service),
):
    """Generate a presigned URL for uploading a file."""
    s3_key = storage.generate_s3_key(
        str(current_user.id), data.filename, prefix="uploads"
    )
    upload_url = storage.get_presigned_upload_url(s3_key, data.content_type)

    return PresignResponse(upload_url=upload_url, s3_key=s3_key)


@router.put("/local/{s3_key:path}")
async def upload_local(
    s3_key: str,
    request: Request,
    storage: StorageService = Depends(get_storage_service),
):
    """
    Local development endpoint for uploading files.
    Only works when USE_LOCAL_STORAGE=true.
    """
    if not settings.use_local_storage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Local upload endpoint not available in production",
        )

    # Check content-length header for file size validation
    content_length = request.headers.get("content-length")
    max_size_bytes = settings.max_upload_size_mb * 1024 * 1024

    if content_length and int(content_length) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb}MB.",
        )

    content = await request.body()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file content provided",
        )

    # Double-check actual size
    if len(content) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.max_upload_size_mb}MB.",
        )

    storage.save_local_file(s3_key, content)
    return {"status": "uploaded", "s3_key": s3_key}
