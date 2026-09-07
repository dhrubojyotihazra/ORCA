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
    Conditional edge function routing from planner to required specialists.
    """
    intents = state.get("intent", [])
    targets = []
    
    if "pfz" in intents or not intents:
        targets.append("ocean_specialist")
    if "weather" in intents or "safety" in intents or not intents:
        targets.append("weather_specialist")
    if "safety" in intents or "geofence" in intents or not intents:
        targets.append("risk_specialist")
        
    # Fallback to at least one specialist
    if not targets:
        targets = ["ocean_specialist", "weather_specialist", "risk_specialist"]
        
    return targets


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
    
    # Conditional fan-out from planner to specialists
    builder.add_conditional_edges(
        "planner",
        route_to_specialists,
        {
            "ocean_specialist": "ocean_specialist",
            "weather_specialist": "weather_specialist",
            "risk_specialist": "risk_specialist",
        },
    )
    
    # Fan-in from specialists to synthesizer
    builder.add_edge("ocean_specialist", "synthesizer")
    builder.add_edge("weather_specialist", "synthesizer")
    builder.add_edge("risk_specialist", "synthesizer")
    
    # Exit from synthesizer
    builder.add_edge("synthesizer", END)
    
    # Compile graph
    return builder.compile()


# Global compiled pipeline instance ready for import
orca_graph = build_orca_graph()
