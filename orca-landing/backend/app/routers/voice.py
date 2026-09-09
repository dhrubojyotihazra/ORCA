import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from app.services.groq_service import GroqService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice Speech-to-Text"])

@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None)
):
    """Upload audio file (.webm, .wav, .mp3, .m4a) to transcribe into text via Groq Whisper API"""
    if not file.content_type.startswith(("audio/", "video/webm", "application/octet-stream")):
        logger.warning(f"Unexpected audio content type: {file.content_type}")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file provided.")

    res = await GroqService.transcribe_audio(
        file_bytes=file_bytes,
        filename=file.filename or "recording.webm",
        language=language
    )
    return res
