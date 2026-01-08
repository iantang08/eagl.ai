from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class VideoCreate(BaseModel):
    s3_key: str


class VideoResponse(BaseModel):
    id: UUID
    user_id: UUID
    s3_key_raw: str
    duration_ms: int | None
    fps: float | None
    width: int | None
    height: int | None
    created_at: datetime

    class Config:
        from_attributes = True
