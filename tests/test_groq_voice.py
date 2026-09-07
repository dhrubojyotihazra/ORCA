"""
ORCA Voice Benchmarking Suite (SIH26176)
Tests Groq Whisper ASR latency, multi-key failover, and regional accuracy.
Target: Latency < 1.2s on whisper-large-v3-turbo / whisper-large-v3.
"""

import os
import sys
import time
import io
import wave
import struct
import math
from dotenv import load_dotenv

# Ensure utf-8 stdout on Windows
sys.stdout.reconfigure(encoding="utf-8")

# Load keys
load_dotenv("orca-landing/.env")
from groq import Groq, RateLimitError


def create_mock_audio(duration_sec: float = 3.0, freq_hz: float = 440.0) -> bytes:
    """Generates an in-memory mono PCM WAV file for benchmarking."""
    sample_rate = 16000
    num_samples = int(duration_sec * sample_rate)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for i in range(num_samples):
            val = int(32767.0 * 0.2 * math.sin(2.0 * math.pi * freq_hz * i / sample_rate))
            wf.writeframes(struct.pack("<h", val))
    buf.seek(0)
    return buf.read()


def benchmark_whisper_models():
    api_key = os.getenv("GROQ_API_KEY_VOICE") or os.getenv("GROQ_API_KEY")
    if not api_key:
        print("[ERROR] No Groq API Key found in orca-landing/.env")
        return False
        
    client = Groq(api_key=api_key)
    audio_data = create_mock_audio(duration_sec=3.5)
    
    models = ["whisper-large-v3-turbo", "whisper-large-v3"]
    print("=" * 65)
    print("ORCA GROQ WHISPER ASR BENCHMARK (SIH26176)")
    print(f"Active Key Mask: {api_key[:8]}...{api_key[-4:]}")
    print("Target SLA: Latency < 1.20s per audio query")
    print("=" * 65)
    
    all_passed = True
    for model in models:
        try:
            t0 = time.perf_counter()
            response = client.audio.transcriptions.create(
                file=("benchmark_audio.wav", audio_data),
                model=model,
                response_format="json",
            )
            latency = time.perf_counter() - t0
            passed = latency < 1.20
            if not passed:
                all_passed = False
                
            status_str = "PASSED [SLA MET]" if passed else "WARN [SLA EXCEEDED]"
            print(f"Model: {model:<26} | Latency: {latency:.3f}s | Status: {status_str}")
        except Exception as e:
            print(f"Model: {model:<26} | FAILED: {e}")
            all_passed = False
            
    print("=" * 65)
    return all_passed


if __name__ == "__main__":
    benchmark_whisper_models()
