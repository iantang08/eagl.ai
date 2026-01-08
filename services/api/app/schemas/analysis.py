from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AnalysisJobCreate(BaseModel):
    video_id: UUID
    criteria_version: str = "v1"


class AnalysisJobResponse(BaseModel):
    id: UUID
    video_id: UUID
    status: str
    criteria_version: str
    error: str | None
    progress: int
    result_id: UUID | None = None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisResultResponse(BaseModel):
    id: UUID
    job_id: UUID
    overall_score: int
    results_json_url: str
    thumbnail_url: str
    created_at: datetime

    class Config:
        from_attributes = True
