from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class OnboardingProfileCreate(BaseModel):
    goals: list[str] = []
    skill_level: str | None = None
    dominant_hand: str | None = None
    typical_miss: str | None = None
    equipment_focus: list[str] = []
    practice_frequency: str | None = None


class OnboardingProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    goals: list[str]
    skill_level: str | None
    dominant_hand: str | None
    typical_miss: str | None
    equipment_focus: list[str]
    practice_frequency: str | None
    created_at: datetime

    class Config:
        from_attributes = True
