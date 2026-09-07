"""
ORCA Agent Workflow Graph.
Assembles and compiles the LangGraph StateGraph orchestration pipeline.
Updated for Week 2 with Weather Agent and Ocean Agent integration.
"""

import os
import sys

# Ensure repository root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from langgraph.graph import StateGraph, END

from agents.state import AgentState
from agents.planner_agent import planner_node
from agents.weather_agent import weather_node
from agents.ocean_agent import ocean_node


def build_graph() -> StateGraph:
    """
    Constructs and wires the LangGraph StateGraph for ORCA Week 2.
    
    Flow: planner -> weather_node -> ocean_node -> END
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("weather_node", weather_node)
    workflow.add_node("ocean_node", ocean_node)

    # Set entry point
    workflow.set_entry_point("planner")

    # Wire edges: planner -> weather_node -> ocean_node -> END
    workflow.add_edge("planner", "weather_node")
    workflow.add_edge("weather_node", "ocean_node")
    workflow.add_edge("ocean_node", END)

    # Compile the graph
    app = workflow.compile()
    return app


# Export compiled graph instance
app = build_graph()


if __name__ == "__main__":
    print("=" * 70)
    print("ORCA Agent Graph - Week 2 Full Pipeline Test Invocation")
    print("=" * 70)

    # Initial state definition
    initial_state: AgentState = {
        "query": "Is it safe to fish near Kochi today and where is the nearest PFZ?",
        "language": "en",
        "location": {},
        "weather_findings": {},
        "ocean_findings": {},
        "risk_findings": {},
        "final_answer": "",
        "evidence": []
    }

    # Execute graph through all three nodes: planner -> weather_node -> ocean_node -> END
    final_state = app.invoke(initial_state)

    print("\n" + "=" * 70)
    print("FINAL WORKFLOW STATE (Week 2):")
    print("=" * 70)
    for key, value in final_state.items():
        print(f"  {key}: {value}")
    print("=" * 70)
