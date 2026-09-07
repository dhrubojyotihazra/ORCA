"""
ORCA Agent State Schema.
Defines the shared state dictionary passed across all nodes in the LangGraph workflow.
"""

from typing import TypedDict, Dict, Any, List


class AgentState(TypedDict):
    """
    Shared state for the ORCA agentic workflow.
    
    Fields:
        query: The raw input question from the user.
        language: Detected language code ('en', 'hi', 'bn').
        location: Extracted location info dictionary (containing lat, lon, name).
        weather_findings: Structured findings returned by the Weather Agent.
        ocean_findings: Structured findings returned by the Ocean Agent.
        risk_findings: Structured findings returned by the Risk/Geofence Agent.
        final_answer: Synthesized final plain-language response.
        evidence: List of supporting evidence strings or data citations.
    """
    query: str
    language: str
    location: Dict[str, Any]
    weather_findings: Dict[str, Any]
    ocean_findings: Dict[str, Any]
    risk_findings: Dict[str, Any]
    final_answer: str
    evidence: List[str]
