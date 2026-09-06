"""
Experiential Labs Gateway Service for GPT-6 Astra.
Routes requests via OpenAI Chat Completions API specification:
- Base URL: https://api.experientiallabs.ai/v1
- Model: gpt-6-astra
- Authentication: EXPLABS_API_KEY
"""

import os
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Experiential-Service")

EXPERIENTIAL_BASE_URL = os.getenv("EXPERIENTIAL_BASE_URL", "https://api.experientiallabs.ai/v1")
MODEL_ID = "gpt-6-astra"


def get_experiential_client(api_key: Optional[str] = None) -> OpenAI:
    """
    Initializes an OpenAI-compatible client targeting the Experiential Labs gateway.
    """
    key = api_key or os.getenv("EXPLABS_API_KEY")
    if not key and os.name == "nt":
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Environment") as k:
                key, _ = winreg.QueryValueEx(k, "EXPLABS_API_KEY")
                if key:
                    os.environ["EXPLABS_API_KEY"] = key
        except Exception:
            pass

    if not key:
        raise ValueError(
            "EXPLABS_API_KEY environment variable is not set. "
            "Please create one under Settings -> API keys and export it."
        )

    return OpenAI(
        base_url=EXPERIENTIAL_BASE_URL,
        api_key=key
    )


def chat_completion(
    messages: List[Dict[str, str]],
    model: str = MODEL_ID,
    stream: bool = False,
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: Optional[Any] = None,
    **kwargs
) -> Any:
    """
    Executes a chat completion call with gpt-6-astra via Experiential Labs gateway.
    Preserves streaming and tool-calls as configured.
    """
    client = get_experiential_client()
    call_args: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": stream,
        **kwargs
    }
    if tools:
        call_args["tools"] = tools
    if tool_choice:
        call_args["tool_choice"] = tool_choice

    logger.info(f"Dispatching completion to Experiential gateway (model: {model}, stream={stream})...")
    return client.chat.completions.create(**call_args)
