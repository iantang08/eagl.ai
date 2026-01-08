from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, OnboardingProfile
from app.schemas import OnboardingProfileCreate, OnboardingProfileResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/v1/onboarding", tags=["onboarding"])


@router.post("/profile", response_model=OnboardingProfileResponse)
def create_or_update_profile(
    data: OnboardingProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if profile already exists
    existing = (
        db.query(OnboardingProfile)
        .filter(OnboardingProfile.user_id == current_user.id)
        .first()
    )

    if existing:
        # Update existing profile
        existing.goals = data.goals
        existing.skill_level = data.skill_level
        existing.dominant_hand = data.dominant_hand
        existing.typical_miss = data.typical_miss
        existing.equipment_focus = data.equipment_focus
        existing.practice_frequency = data.practice_frequency
        db.commit()
        db.refresh(existing)
        return existing

    # Create new profile
    profile = OnboardingProfile(
        user_id=current_user.id,
        goals=data.goals,
        skill_level=data.skill_level,
        dominant_hand=data.dominant_hand,
        typical_miss=data.typical_miss,
        equipment_focus=data.equipment_focus,
        practice_frequency=data.practice_frequency,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/profile", response_model=OnboardingProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = (
        db.query(OnboardingProfile)
        .filter(OnboardingProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding profile not found",
        )
    return profile
