import os
import uuid
from pathlib import Path

import boto3
from botocore.config import Config

from app.config import get_settings

settings = get_settings()


class StorageService:
    def __init__(self):
        self.use_local = settings.use_local_storage
        self.local_dir = Path(settings.local_s3_dir)

        if not self.use_local:
            self.s3_client = boto3.client(
                "s3",
                region_name=settings.aws_region,
                config=Config(signature_version="s3v4"),
            )

    def generate_s3_key(self, user_id: str, filename: str, prefix: str = "uploads") -> str:
        """Generate a unique S3 key for a file."""
        ext = Path(filename).suffix
        unique_id = str(uuid.uuid4())
        return f"{prefix}/{user_id}/{unique_id}{ext}"

    def get_presigned_upload_url(
        self, s3_key: str, content_type: str, expires_in: int = 3600
    ) -> str:
        """Get a presigned URL for uploading a file."""
        if self.use_local:
            return f"{settings.api_base_url}/v1/uploads/local/{s3_key}"

        return self.s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.aws_s3_bucket,
                "Key": s3_key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )

    def get_presigned_download_url(
        self, s3_key: str, bucket: str | None = None, expires_in: int = 3600
    ) -> str:
        """Get a presigned URL for downloading a file."""
        if self.use_local:
            return f"{settings.api_base_url}/v1/artifacts/local/{s3_key}"

        bucket = bucket or settings.aws_s3_bucket
        return self.s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": bucket,
                "Key": s3_key,
            },
            ExpiresIn=expires_in,
        )

    def save_local_file(self, s3_key: str, content: bytes) -> str:
        """Save a file to local storage (dev mode only)."""
        file_path = self.local_dir / s3_key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(content)
        return str(file_path)

    def get_local_file_path(self, s3_key: str) -> Path:
        """Get the local file path for an S3 key."""
        return self.local_dir / s3_key

    def upload_file(self, s3_key: str, content: bytes, content_type: str) -> None:
        """Upload a file to storage (S3 or local)."""
        if self.use_local:
            self.save_local_file(s3_key, content)
        else:
            self.s3_client.put_object(
                Bucket=settings.aws_s3_bucket,
                Key=s3_key,
                Body=content,
                ContentType=content_type,
            )

    def download_file(self, s3_key: str, bucket: str | None = None) -> bytes:
        """Download a file from storage (S3 or local)."""
        if self.use_local:
            file_path = self.get_local_file_path(s3_key)
            return file_path.read_bytes()

        bucket = bucket or settings.aws_s3_bucket
        response = self.s3_client.get_object(Bucket=bucket, Key=s3_key)
        return response["Body"].read()

    def file_exists(self, s3_key: str, bucket: str | None = None) -> bool:
        """Check if a file exists in storage."""
        if self.use_local:
            return self.get_local_file_path(s3_key).exists()

        try:
            bucket = bucket or settings.aws_s3_bucket
            self.s3_client.head_object(Bucket=bucket, Key=s3_key)
            return True
        except Exception:
            return False


def get_storage_service() -> StorageService:
    return StorageService()
