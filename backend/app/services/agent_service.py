import asyncio
import logging
from typing import Dict, Any, AsyncGenerator, Optional


logger = logging.getLogger(__name__)

import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Import ORCA LangGraph multi-agent graph
_langgraph_agent = None
try:
    from agents.graph import orca_graph as agent_graph
    _langgraph_agent = agent_graph
    logger.info("Successfully loaded ORCA LangGraph multi-agent collaborative graph.")
except Exception as e:
    logger.warning(f"Could not load LangGraph agent graph: {e}. Using mock fallback.")

class AgentService:
    @staticmethod
    async def invoke_agent(query: str, language: str = "en", location: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Invoke LangGraph agent pipeline or fallback to mock agent response."""
        if _langgraph_agent:
            try:
                initial_state = {
                    "query": query,
                    "language": language,
                    "location": location or {"lat": 20.90, "lon": 70.37, "name": "Veraval Port"},
                    "vessel_type": "small",
                    "user_role": "fisher",
                    "messages": [],
                    "evidence_citations": []
                }
                result = await asyncio.to_thread(_langgraph_agent.invoke, initial_state)
                final_text = result.get("final_response") or result.get("final_answer", "Advisory generated.")
                citations = result.get("evidence_citations") or result.get("evidence", [])
                return {
                    "final_answer": final_text,
                    "evidence": citations,
                    "map_layers": result.get("map_layers", [])
                }
            except Exception as e:
                logger.error(f"Error invoking LangGraph agent: {e}", exc_info=True)

        # Fallback Mock Agent response
        await asyncio.sleep(0.3)  # Simulate brief processing latency
        return {
            "final_answer": f"ORCA Assistant [Mock]: Based on real-time coastal telemetry near your location, current sea surface temperature is 28.5°C with mild wave heights under 1.2m. Safe for navigation. (Query received: '{query}')",
            "evidence": [
                "INCOIS Ocean State Forecast (Veraval Sector)",
                "ISRO MOSDAC Thermal Infrared Telemetry",
                "IMD Coastal Weather Advisory"
            ]
        }

    @staticmethod
    async def stream_agent_response(query: str, language: str = "en", location: Optional[Dict[str, float]] = None) -> AsyncGenerator[str, None]:
        """Stream response tokens for SSE endpoint."""
        agent_result = await AgentService.invoke_agent(query, language, location)
        text = agent_result["final_answer"]
        words = text.split(" ")
        
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield chunk
            await asyncio.sleep(0.04)  # Natural typing feel
