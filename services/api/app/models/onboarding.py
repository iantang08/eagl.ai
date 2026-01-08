import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OnboardingProfile(Base):
    __tablename__ = "onboarding_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    goals: Mapped[dict] = mapped_column(JSONB, default=list)
    skill_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dominant_hand: Mapped[str | None] = mapped_column(String(10), nullable=True)
    typical_miss: Mapped[str | None] = mapped_column(String(50), nullable=True)
    equipment_focus: Mapped[dict] = mapped_column(JSONB, default=list)
    practice_frequency: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="onboarding_profile")


from app.models.user import User
