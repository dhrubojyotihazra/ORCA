"""
ORCA Agent Workflow Graph.
Assembles and compiles the complete multi-agent LangGraph StateGraph orchestration pipeline.
Flow: planner -> weather_node -> ocean_node -> risk_node -> synthesizer_node -> END
"""

import os
import sys

# Ensure UTF-8 output encoding for Windows terminal printing
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure repository root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from langgraph.graph import StateGraph, END

from agents.state import AgentState
from agents.planner_agent import planner_node
from agents.weather_agent import weather_node
from agents.ocean_agent import ocean_node
from agents.risk_agent import risk_node
from agents.synthesizer_agent import synthesizer_node


def build_graph() -> StateGraph:
    """
    Constructs and wires the complete LangGraph StateGraph for ORCA.
    
    Pipeline Flow:
    planner -> weather_node -> ocean_node -> risk_node -> synthesizer_node -> END
    """
    workflow = StateGraph(AgentState)

    # Add all nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("weather_node", weather_node)
    workflow.add_node("ocean_node", ocean_node)
    workflow.add_node("risk_node", risk_node)
    workflow.add_node("synthesizer_node", synthesizer_node)

    # Set entry point
    workflow.set_entry_point("planner")

    # Wire sequential execution edges
    workflow.add_edge("planner", "weather_node")
    workflow.add_edge("weather_node", "ocean_node")
    workflow.add_edge("ocean_node", "risk_node")
    workflow.add_edge("risk_node", "synthesizer_node")
    workflow.add_edge("synthesizer_node", END)

    # Compile the graph
    app = workflow.compile()
    return app


# Export compiled graph instance
app = build_graph()


if __name__ == "__main__":
    print("=" * 80)
    print("ORCA Agent Graph - Week 3 Complete Pipeline Multilingual Test Invocations")
    print("=" * 80)

    queries = [
        ("Query 1 (English)", "Is it safe to fish near Kochi tomorrow morning?", "en"),
        ("Query 2 (Hindi)", "क्या कल कोच्चि के पास मछली पकड़ना सुरक्षित है?", "hi"),
        ("Query 3 (Bengali)", "আগামীকাল কোচি কাছে মাছ ধরা কি নিরাপদ?", "bn")
    ]

    for label, query_text, lang_code in queries:
        print(f"\n" + "-" * 80)
        print(f"RUNNING TEST: {label}")
        print(f"QUERY: '{query_text}'")
        print("-" * 80)

        initial_state: AgentState = {
            "query": query_text,
            "language": lang_code,
            "location": {},
            "weather_findings": {},
            "ocean_findings": {},
            "risk_findings": {},
            "final_answer": "",
            "evidence": []
        }

        final_state = app.invoke(initial_state)

        print("\nFINAL ANSWER:")
        print(final_state["final_answer"])
        print("\nEVIDENCE CITATIONS:")
        for ev in final_state["evidence"]:
            print(f"  • {ev}")
        print("-" * 80)

    print("\n" + "=" * 80)
    print("All 3 test invocations completed successfully.")
    print("=" * 80)
