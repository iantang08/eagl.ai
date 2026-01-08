from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/eaglai"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Storage
    use_local_storage: bool = True
    local_s3_dir: str = "./local_s3"
    aws_s3_bucket: str = "eaglai-uploads"
    aws_s3_results_bucket: str = "eaglai-results"
    aws_region: str = "us-east-1"

    # Dev flags
    dev_skip_analysis: bool = False

    # Analysis settings
    max_frames: int = 300
    target_fps: float = 30.0

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
