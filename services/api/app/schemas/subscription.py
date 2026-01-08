from datetime import datetime

from pydantic import BaseModel


class SubscriptionStatus(BaseModel):
    is_active: bool
    plan: str | None = None
    expires_at: datetime | None = None


class RCWebhookPayload(BaseModel):
    """RevenueCat webhook payload (simplified for MVP)"""
    event: dict
    api_version: str = "1.0"
