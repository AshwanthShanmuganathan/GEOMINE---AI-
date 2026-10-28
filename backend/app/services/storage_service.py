import os
import uuid
import shutil
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from ..config import settings

class StorageProvider(ABC):
    @abstractmethod
    def save_file(self, file_content: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """Save file bytes and return metadata dict with url, filename, size, content_type."""
        pass

    @abstractmethod
    def get_file_url(self, file_identifier: str) -> str:
        """Resolve full public or pre-signed URL."""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, upload_dir: Optional[str] = None):
        # Determine upload directory: prioritize /app/uploads inside docker, fallback to local path
        if upload_dir:
            self.upload_dir = upload_dir
        elif os.path.exists("/app/uploads"):
            self.upload_dir = "/app/uploads"
        else:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.upload_dir = os.path.join(base_dir, "uploads")
        
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_file(self, file_content: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        # Generate clean, unique filename
        ext = os.path.splitext(filename)[1].lower()
        unique_name = f"{uuid.uuid4().hex[:12]}_{filename.replace(' ', '_')}"
        file_path = os.path.join(self.upload_dir, unique_name)

        with open(file_path, "wb") as f:
            f.write(file_content)

        file_size = len(file_content)
        file_url = f"/uploads/{unique_name}"

        return {
            "file_url": file_url,
            "filename": unique_name,
            "original_name": filename,
            "size": file_size,
            "content_type": content_type,
            "storage": "local"
        }

    def get_file_url(self, file_identifier: str) -> str:
        if file_identifier.startswith("http") or file_identifier.startswith("/"):
            return file_identifier
        return f"/uploads/{file_identifier}"


class S3StorageProvider(StorageProvider):
    """
    Prepared AWS S3 Storage Provider for production cloud deployment.
    Requires AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.
    """
    def __init__(self, bucket_name: Optional[str] = None, region: Optional[str] = None):
        self.bucket_name = bucket_name or os.getenv("AWS_S3_BUCKET")
        self.region = region or os.getenv("AWS_DEFAULT_REGION", "ap-south-1")

    def save_file(self, file_content: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        if not self.bucket_name:
            raise NotImplementedError(
                "AWS S3 is not yet active: AWS_S3_BUCKET is not configured. "
                "Use local storage provider for local development."
            )
        try:
            import boto3
            s3_client = boto3.client("s3", region_name=self.region)
            unique_key = f"evidence/{uuid.uuid4().hex[:12]}_{filename}"
            s3_client.put_object(
                Bucket=self.bucket_name,
                Key=unique_key,
                Body=file_content,
                ContentType=content_type
            )
            s3_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{unique_key}"
            return {
                "file_url": s3_url,
                "filename": unique_key,
                "original_name": filename,
                "size": len(file_content),
                "content_type": content_type,
                "storage": "s3"
            }
        except ImportError:
            raise NotImplementedError("boto3 is not installed for S3 operations.")

    def get_file_url(self, file_identifier: str) -> str:
        if file_identifier.startswith("http"):
            return file_identifier
        return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{file_identifier}"


def get_storage_provider() -> StorageProvider:
    """Return storage provider according to environment configuration."""
    storage_type = os.getenv("STORAGE_TYPE", "local").lower()
    if storage_type == "s3" and os.getenv("AWS_S3_BUCKET"):
        return S3StorageProvider()
    return LocalStorageProvider()

