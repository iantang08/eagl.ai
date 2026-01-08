import uuid
from pathlib import Path

import boto3
from botocore.config import Config

from worker.config import get_settings

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

    def download_file(self, s3_key: str, local_path: Path) -> None:
        """Download a file from storage to local path."""
        if self.use_local:
            source = self.local_dir / s3_key
            local_path.write_bytes(source.read_bytes())
        else:
            self.s3_client.download_file(
                settings.aws_s3_bucket, s3_key, str(local_path)
            )

    def upload_file(
        self, local_path: Path, s3_key: str, content_type: str = "application/octet-stream"
    ) -> None:
        """Upload a file from local path to storage."""
        if self.use_local:
            dest = self.local_dir / s3_key
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(local_path.read_bytes())
        else:
            self.s3_client.upload_file(
                str(local_path),
                settings.aws_s3_bucket,
                s3_key,
                ExtraArgs={"ContentType": content_type},
            )

    def upload_bytes(
        self, content: bytes, s3_key: str, content_type: str = "application/octet-stream"
    ) -> None:
        """Upload bytes to storage."""
        if self.use_local:
            dest = self.local_dir / s3_key
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(content)
        else:
            self.s3_client.put_object(
                Bucket=settings.aws_s3_bucket,
                Key=s3_key,
                Body=content,
                ContentType=content_type,
            )

    def generate_result_key(self, job_id: str, filename: str) -> str:
        """Generate an S3 key for result artifacts."""
        return f"results/{job_id}/{filename}"


def get_storage_service() -> StorageService:
    return StorageService()
