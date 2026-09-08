"""
ORCA LangGraph StateGraph Assembly (SIH26176)
Wires the multi-agent DAG connecting Planner, Specialists, and Anti-Hallucination Synthesizer.
"""

from typing import List, Any
from langgraph.graph import StateGraph, START, END
from .state import AgentState
from .planner_agent import planner_node
from .specialists import ocean_specialist_node, weather_specialist_node, risk_specialist_node
from .public_research_agent import public_research_node
from .synthesizer_agent import synthesizer_node


def route_from_planner(state: AgentState) -> str:
    """Routes from planner to the first required specialist node."""
    intents = state.get("intent", [])
    if "pfz" in intents:
        return "ocean_specialist"
    if "weather" in intents or "safety" in intents:
        return "weather_specialist"
    if "geofence" in intents:
        return "risk_specialist"
    if "public_bulletin" in intents:
        return "public_research_specialist"
    return "ocean_specialist"


def route_from_ocean(state: AgentState) -> str:
    """Routes from ocean_specialist to weather_specialist, risk_specialist, public_research_specialist, or synthesizer."""
    intents = state.get("intent", [])
    if "weather" in intents or "safety" in intents:
        return "weather_specialist"
    if "geofence" in intents:
        return "risk_specialist"
    if "public_bulletin" in intents:
        return "public_research_specialist"
    return "synthesizer"


def route_from_weather(state: AgentState) -> str:
    """
    Chains from weather_specialist to risk_specialist if safety was requested,
    ensuring risk_specialist evaluates hydrodynamic formulas on actual weather data,
    or forwards to public_research_specialist if bulletins were requested.
    """
    intents = state.get("intent", [])
    if "safety" in intents or "geofence" in intents or not intents:
        return "risk_specialist"
    if "public_bulletin" in intents:
        return "public_research_specialist"
    return "synthesizer"


def route_from_risk(state: AgentState) -> str:
    """Routes from risk_specialist to public_research_specialist if bulletins requested, else synthesizer."""
    intents = state.get("intent", [])
    if "public_bulletin" in intents:
        return "public_research_specialist"
    return "synthesizer"


def build_orca_graph() -> Any:
    """Builds and compiles the ORCA StateGraph DAG."""
    builder = StateGraph(AgentState)
    
    # 1. Register Nodes
    builder.add_node("planner", planner_node)
    builder.add_node("ocean_specialist", ocean_specialist_node)
    builder.add_node("weather_specialist", weather_specialist_node)
    builder.add_node("risk_specialist", risk_specialist_node)
    builder.add_node("public_research_specialist", public_research_node)
    builder.add_node("synthesizer", synthesizer_node)
    
    # 2. Graph Wiring
    builder.add_edge(START, "planner")
    
    # Route from planner to first specialist
    builder.add_conditional_edges(
        "planner",
        route_from_planner,
        {
            "ocean_specialist": "ocean_specialist",
            "weather_specialist": "weather_specialist",
            "risk_specialist": "risk_specialist",
            "public_research_specialist": "public_research_specialist",
        },
    )
    
    # Route from ocean specialist
    builder.add_conditional_edges(
        "ocean_specialist",
        route_from_ocean,
        {
            "weather_specialist": "weather_specialist",
            "risk_specialist": "risk_specialist",
            "public_research_specialist": "public_research_specialist",
            "synthesizer": "synthesizer",
        },
    )

    # Route from weather specialist
    builder.add_conditional_edges(
        "weather_specialist",
        route_from_weather,
        {
            "risk_specialist": "risk_specialist",
            "public_research_specialist": "public_research_specialist",
            "synthesizer": "synthesizer",
        },
    )
    
    # Route from risk specialist
    builder.add_conditional_edges(
        "risk_specialist",
        route_from_risk,
        {
            "public_research_specialist": "public_research_specialist",
            "synthesizer": "synthesizer",
        },
    )
    
    # Public Research specialist feeds into synthesizer
    builder.add_edge("public_research_specialist", "synthesizer")
    
    # Exit from synthesizer
    builder.add_edge("synthesizer", END)
    
    return builder.compile()


# Global compiled pipeline instance ready for import
orca_graph = build_orca_graph()
