"""
ORCA Agent Workflow Graph.
Assembles and compiles the LangGraph StateGraph orchestration pipeline.
"""

import os
import sys

# Ensure repository root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from langgraph.graph import StateGraph, END

from agents.state import AgentState
from agents.planner_agent import planner_node
from agents.dummy_specialist import dummy_specialist_node


def build_graph() -> StateGraph:
    """
    Constructs and wires the LangGraph StateGraph for ORCA Week 1.
    
    Flow: planner_node -> dummy_specialist_node -> END
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("dummy_specialist", dummy_specialist_node)

    # Set entry point
    workflow.set_entry_point("planner")

    # Wire edges: planner -> dummy_specialist -> END
    workflow.add_edge("planner", "dummy_specialist")
    workflow.add_edge("dummy_specialist", END)

    # Compile the graph
    app = workflow.compile()
    return app


# Export the compiled graph instance
app = build_graph()


if __name__ == "__main__":
    print("=" * 60)
    print("ORCA Agent Graph - Week 1 Test Invocation")
    print("=" * 60)

    # Initial state definition
    initial_state: AgentState = {
        "query": "Is it safe to fish near Kochi today?",
        "language": "en",
        "location": {},
        "weather_findings": {},
        "ocean_findings": {},
        "risk_findings": {},
        "final_answer": "",
        "evidence": []
    }

    # Execute graph
    final_state = app.invoke(initial_state)

    print("\n" + "=" * 60)
    print("FINAL WORKFLOW STATE:")
    print("=" * 60)
    for key, value in final_state.items():
        print(f"  {key}: {value}")
    print("=" * 60)
