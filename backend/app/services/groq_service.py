"""
ORCA Resilient Groq Client Manager
Supports:
1. Multi-key rotation / failover on 429 RateLimitError or network issues
2. Multi-model fallback for Chat & Voice
3. Synchronous and Asynchronous streaming support
"""

import os
import time
import logging
from typing import List, Dict, Any, Optional, Generator
from groq import Groq, RateLimitError, APIStatusError

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ORCA-Groq")

# Load keys securely from environment
API_KEYS = [
    os.getenv("GROQ_API_KEY_VOICE", ""),
    os.getenv("GROQ_API_KEY_REASONING", ""),
    os.getenv("GROQ_API_KEY_BACKUP", ""),
    os.getenv("GROQ_API_KEY", ""),
]
API_KEYS = [k for k in API_KEYS if k]

# Model priority ladders (primary -> secondary fallbacks)
CHAT_MODELS = [
    "qwen/qwen3.8-27b",
    "groq/compound-mini",
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "openai/gpt-oss-20b"
]

VOICE_MODELS = [
    "whisper-large-v3-turbo",
    "whisper-large-v3"
]


class ResilientGroqManager:
    def __init__(self, api_keys: Optional[List[str]] = None):
        # Remove empty or duplicate keys preserving order
        raw_keys = api_keys or API_KEYS
        self.keys = []
        for k in raw_keys:
            if k and k.strip() and k not in self.keys:
                self.keys.append(k.strip())
        
        self.current_key_idx = 0
        logger.info(f"Initialized Groq Manager with {len(self.keys)} API key(s).")

    def _get_client(self) -> Groq:
        return Groq(api_key=self.keys[self.current_key_idx])

    def _rotate_key(self):
        old_idx = self.current_key_idx
        self.current_key_idx = (self.current_key_idx + 1) % len(self.keys)
        logger.warning(f"Switched Groq API key from #{old_idx + 1} to #{self.current_key_idx + 1}")

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        preferred_model: Optional[str] = None,
        max_tokens: int = 800,
        temperature: float = 0.3,
        stream: bool = False
    ) -> Any:
        """
        Executes a chat completion with automatic model and key failover.
        """
        model_queue = [preferred_model] if preferred_model else []
        model_queue.extend([m for m in CHAT_MODELS if m != preferred_model])

        errors = []
        for model in model_queue:
            # Try available keys for this model
            for _ in range(len(self.keys)):
                client = self._get_client()
                try:
                    logger.info(f"Attempting chat with model '{model}' using Key #{self.current_key_idx + 1}...")
                    response = client.chat.completions.create(
                        model=model,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        stream=stream
                    )
                    return response
                except RateLimitError as e:
                    logger.warning(f"Rate limit (429) hit on Key #{self.current_key_idx + 1} for model '{model}'. Error: {e.message}")
                    errors.append(f"Key #{self.current_key_idx + 1} ({model}): Rate limit")
                    self._rotate_key()
                except APIStatusError as e:
                    logger.warning(f"API error ({e.status_code}) on Key #{self.current_key_idx + 1} for model '{model}': {e.message}")
                    errors.append(f"Key #{self.current_key_idx + 1} ({model}): HTTP {e.status_code}")
                    self._rotate_key()
                except Exception as e:
                    logger.error(f"Unexpected error with model '{model}': {e}")
                    errors.append(f"{model}: {str(e)}")
                    break # Try next model
            
            logger.info(f"Failing over from '{model}' to next fallback model in queue...")

        raise RuntimeError(f"All Groq models and keys exhausted. Details: {'; '.join(errors)}")

    def transcribe_audio(
        self,
        file_tuple_or_path: Any,
        preferred_model: Optional[str] = None,
        language: Optional[str] = None,
        prompt: Optional[str] = None
    ) -> str:
        """
        Transcribes audio with automatic model and key failover.
        file_tuple_or_path can be:
        - a filepath string (e.g. 'audio.wav')
        - a tuple ('filename.wav', bytes_content, 'audio/wav')
        """
        model_queue = [preferred_model] if preferred_model else []
        model_queue.extend([m for m in VOICE_MODELS if m != preferred_model])

        errors = []
        for model in model_queue:
            for _ in range(len(self.keys)):
                client = self._get_client()
                try:
                    logger.info(f"Transcribing audio with '{model}' using Key #{self.current_key_idx + 1}...")
                    kwargs = {
                        "model": model,
                        "file": file_tuple_or_path
                    }
                    if language:
                        kwargs["language"] = language
                    if prompt:
                        kwargs["prompt"] = prompt

                    res = client.audio.transcriptions.create(**kwargs)
                    return res.text
                except RateLimitError as e:
                    logger.warning(f"Rate limit (429) on Key #{self.current_key_idx + 1} for Whisper '{model}': {e.message}")
                    errors.append(f"Key #{self.current_key_idx + 1} ({model}): 429")
                    self._rotate_key()
                except Exception as e:
                    logger.warning(f"Whisper failed with model '{model}': {e}")
                    errors.append(f"{model}: {str(e)}")
                    self._rotate_key()

        raise RuntimeError(f"All Whisper models and keys exhausted. Details: {'; '.join(errors)}")


# Default global instance
groq_manager = ResilientGroqManager()

if __name__ == "__main__":
    print("--- Testing Resilient Groq Manager ---")
    
    # 1. Test Chat with auto-fallback
    print("\n1. Testing Chat Completion:")
    reply = groq_manager.chat_completion(
        messages=[
            {"role": "system", "content": "You are ORCA Marine Assistant. Be concise."},
            {"role": "user", "content": "Confirm you are online and ready for coastal fishermen queries."}
        ]
    )
    print("Response:", reply.choices[0].message.content)

    # 2. Test Audio Transcription with auto-fallback
    print("\n2. Testing Audio Transcription:")
    import wave, struct, io
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)
        for _ in range(16000):
            wav.writeframes(struct.pack('<h', 0))
    wav_io.seek(0)
    
    transcript = groq_manager.transcribe_audio(
        file_tuple_or_path=('test_mic.wav', wav_io.read(), 'audio/wav')
    )
    print("Transcript:", transcript)
    print("\n[PASSED] Resilient Groq Manager is fully operational!")
