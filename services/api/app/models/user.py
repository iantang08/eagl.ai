import uuid
from datetime import datetime

from sqlalchemy import String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    onboarding_profile: Mapped["OnboardingProfile"] = relationship(
        "OnboardingProfile", back_populates="user", uselist=False
    )
    subscription: Mapped["Subscription"] = relationship(
        "Subscription", back_populates="user", uselist=False
    )
    videos: Mapped[list["Video"]] = relationship("Video", back_populates="user")


from app.models.onboarding import OnboardingProfile
from app.models.subscription import Subscription
from app.models.video import Video
