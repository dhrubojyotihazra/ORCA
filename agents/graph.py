"""
ORCA LangGraph StateGraph Assembly (SIH26176)
Wires the multi-agent DAG connecting Planner, Specialists, and Anti-Hallucination Synthesizer.
"""

from typing import List, Any
from langgraph.graph import StateGraph, START, END
from .state import AgentState
from .planner_agent import planner_node
from .specialists import ocean_specialist_node, weather_specialist_node, risk_specialist_node
from .synthesizer_agent import synthesizer_node


def route_to_specialists(state: AgentState) -> List[str]:
    """
    Conditional edge routing from planner to required initial specialists.
    If safety is needed, routes to weather_specialist first (which chains into risk_specialist).
    """
    intents = state.get("intent", [])
    targets = []
    
    if "pfz" in intents or not intents:
        targets.append("ocean_specialist")
    if "weather" in intents or "safety" in intents or not intents:
        targets.append("weather_specialist")
    elif "geofence" in intents:
        # Pure geofence query without weather/safety requested
        targets.append("risk_specialist")
        
    if not targets:
        targets = ["ocean_specialist", "weather_specialist"]
        
    return targets


def route_from_weather(state: AgentState) -> str:
    """
    Chains from weather_specialist to risk_specialist if safety was requested,
    ensuring risk_specialist evaluates hydrodynamic formulas on actual weather data.
    """
    intents = state.get("intent", [])
    if "safety" in intents or "geofence" in intents or not intents:
        return "risk_specialist"
    return "synthesizer"


def build_orca_graph() -> Any:
    """Builds and compiles the ORCA StateGraph DAG."""
    builder = StateGraph(AgentState)
    
    # 1. Register Nodes
    builder.add_node("planner", planner_node)
    builder.add_node("ocean_specialist", ocean_specialist_node)
    builder.add_node("weather_specialist", weather_specialist_node)
    builder.add_node("risk_specialist", risk_specialist_node)
    builder.add_node("synthesizer", synthesizer_node)
    
    # 2. Graph Wiring
    builder.add_edge(START, "planner")
    
    # Conditional fan-out from planner
    builder.add_conditional_edges(
        "planner",
        route_to_specialists,
        {
            "ocean_specialist": "ocean_specialist",
            "weather_specialist": "weather_specialist",
            "risk_specialist": "risk_specialist",
        },
    )
    
    # Ocean specialist feeds directly into synthesizer
    builder.add_edge("ocean_specialist", "synthesizer")

    # Weather specialist routes conditionally to risk_specialist (if safety/geofence) or synthesizer
    builder.add_conditional_edges(
        "weather_specialist",
        route_from_weather,
        {
            "risk_specialist": "risk_specialist",
            "synthesizer": "synthesizer",
        },
    )
    
    # Risk specialist feeds into synthesizer
    builder.add_edge("risk_specialist", "synthesizer")
    
    # Exit from synthesizer
    builder.add_edge("synthesizer", END)
    
    return builder.compile()


# Global compiled pipeline instance ready for import
orca_graph = build_orca_graph()
