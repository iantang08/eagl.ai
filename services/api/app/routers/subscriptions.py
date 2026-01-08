from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User, Subscription
from app.schemas import SubscriptionStatus, RCWebhookPayload
from app.services.auth import get_current_user

router = APIRouter(prefix="/v1/subscriptions", tags=["subscriptions"])
settings = get_settings()


@router.get("/status", response_model=SubscriptionStatus)
def get_subscription_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = (
        db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    )

    if not subscription:
        return SubscriptionStatus(is_active=False)

    # Check if subscription is still active
    is_active = subscription.status == "active"
    if subscription.expires_at and subscription.expires_at < datetime.utcnow():
        is_active = False

    return SubscriptionStatus(
        is_active=is_active,
        plan=subscription.plan,
        expires_at=subscription.expires_at,
    )


@router.post("/rc_webhook")
def handle_revenuecat_webhook(
    payload: RCWebhookPayload,
    db: Session = Depends(get_db),
):
    """Handle RevenueCat webhook events."""
    event = payload.event
    event_type = event.get("type")
    app_user_id = event.get("app_user_id")

    if not app_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing app_user_id",
        )

    # Find user by ID (app_user_id should be our user UUID)
    user = db.query(User).filter(User.id == app_user_id).first()
    if not user:
        # User not found, might be a test event
        return {"status": "user_not_found"}

    # Get or create subscription
    subscription = (
        db.query(Subscription).filter(Subscription.user_id == user.id).first()
    )
    if not subscription:
        subscription = Subscription(user_id=user.id)
        db.add(subscription)

    # Handle different event types
    if event_type in ["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE"]:
        subscription.status = "active"
        subscription.plan = event.get("product_id")
        expiration = event.get("expiration_at_ms")
        if expiration:
            subscription.expires_at = datetime.fromtimestamp(expiration / 1000)
    elif event_type in ["CANCELLATION", "EXPIRATION"]:
        subscription.status = "expired"
    elif event_type == "BILLING_ISSUE":
        subscription.status = "billing_issue"

    subscription.provider = "revenuecat"
    db.commit()

    return {"status": "processed"}


@router.post("/dev_activate", response_model=SubscriptionStatus)
def dev_activate_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Development-only endpoint to activate subscription without payment.
    Only available when ENABLE_DEV_SUBSCRIPTION_ENDPOINT=true.
    """
    if not settings.enable_dev_subscription_endpoint:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dev subscription endpoint is disabled",
        )

    # Get or create subscription
    subscription = (
        db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    )
    if not subscription:
        subscription = Subscription(user_id=current_user.id)
        db.add(subscription)

    # Activate subscription for 30 days
    subscription.status = "active"
    subscription.provider = "dev"
    subscription.plan = "dev_monthly"
    subscription.expires_at = datetime.utcnow() + timedelta(days=30)
    db.commit()
    db.refresh(subscription)

    return SubscriptionStatus(
        is_active=True,
        plan=subscription.plan,
        expires_at=subscription.expires_at,
    )
