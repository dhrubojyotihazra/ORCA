import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
from groq import Groq, AsyncGroq
from app.config import settings

logger = logging.getLogger(__name__)

_groq_client: Optional[Groq] = None
_async_groq_client: Optional[AsyncGroq] = None

def get_groq_client() -> Optional[Groq]:
    global _groq_client
    if _groq_client is not None:
        return _groq_client
    
    key = settings.GROQ_API_KEY
    if not key or key.startswith("your-"):
        logger.warning("Groq API key not configured. Operating in fallback mode.")
        return None

    try:
        _groq_client = Groq(api_key=key)
        return _groq_client
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        return None

def get_async_groq_client() -> Optional[AsyncGroq]:
    global _async_groq_client
    if _async_groq_client is not None:
        return _async_groq_client
    
    key = settings.GROQ_API_KEY
    if not key or key.startswith("your-"):
        return None

    try:
        _async_groq_client = AsyncGroq(api_key=key)
        return _async_groq_client
    except Exception as e:
        logger.error(f"Failed to initialize AsyncGroq client: {e}")
        return None

class GroqService:
    @staticmethod
    async def groq_chat(
        messages: List[Dict[str, str]],
        model: str = "qwen/qwen3.6-27b",
        temperature: float = 0.3,
        max_tokens: int = 800
    ) -> str:
        async_client = get_async_groq_client()
        if not async_client:
            return f"Mock Groq LLM response to: '{messages[-1]['content']}'"

        try:
            response = await async_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                extra_body={"reasoning_effort": "none"}
            )
            content = response.choices[0].message.content or ""
            return content.strip()
        except Exception as e:
            logger.error(f"Groq Chat API error: {e}")
            raise RuntimeError(f"Groq LLM Service error: {e}")

    @staticmethod
    async def transcribe_audio(
        file_bytes: bytes,
        filename: str = "audio.webm",
        model: str = "whisper-large-v3",
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        async_client = get_async_groq_client()
        if not async_client:
            return {
                "text": "Is it safe to fish near Veraval port today?",
                "language": language or "en",
                "mock": True
            }

        try:
            transcription = await async_client.audio.transcriptions.create(
                file=(filename, file_bytes),
                model=model,
                language=language
            )
            return {
                "text": transcription.text,
                "language": getattr(transcription, "language", language or "en"),
                "mock": False
            }
        except Exception as e:
            logger.error(f"Groq Whisper transcription error: {e}")
            # Fallback response for testing voice UI when API key is unconfigured/rate limited
            return {
                "text": "Transcribed ocean navigation query.",
                "language": "en",
                "error": str(e),
                "mock": True
            }
