from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/eaglai"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24 * 7  # 1 week

    # Storage
    use_local_storage: bool = True
    local_s3_dir: str = "./local_s3"
    aws_s3_bucket: str = "eaglai-uploads"
    aws_s3_results_bucket: str = "eaglai-results"
    aws_region: str = "us-east-1"

    # Dev flags
    dev_skip_analysis: bool = False
    enable_dev_subscription_endpoint: bool = False

    # API
    api_base_url: str = "http://localhost:8000"

    # CORS - comma-separated list of allowed origins, or "*" for dev
    cors_origins: str = "http://localhost:8081,http://localhost:3000"

    # Upload limits
    max_upload_size_mb: int = 100
    max_video_duration_seconds: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
