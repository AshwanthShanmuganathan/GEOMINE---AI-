from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.storage_service import get_storage_provider

router = APIRouter(prefix="/api/upload", tags=["Uploads & Storage"])

ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
}

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload an evidence photo or statutory document.
    Saves file to persistent storage (local volume or S3) and returns file metadata.
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed types: JPEG, PNG, WEBP, PDF, DOCX, TXT."
        )

    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 25 MB."
        )

    storage = get_storage_provider()
    result = storage.save_file(
        file_content=file_content,
        filename=file.filename or "upload.bin",
        content_type=file.content_type or "application/octet-stream"
    )

    return result

