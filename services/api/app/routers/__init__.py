from app.routers.auth import router as auth_router
from app.routers.onboarding import router as onboarding_router
from app.routers.subscriptions import router as subscriptions_router
from app.routers.uploads import router as uploads_router
from app.routers.videos import router as videos_router
from app.routers.analysis import router as analysis_router
from app.routers.artifacts import router as artifacts_router

__all__ = [
    "auth_router",
    "onboarding_router",
    "subscriptions_router",
    "uploads_router",
    "videos_router",
    "analysis_router",
    "artifacts_router",
]
