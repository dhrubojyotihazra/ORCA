"""
ORCA Planner Agent.
Responsible for interpreting query intent, detecting language, extracting location,
and routing execution to the required specialist agents.
"""

from agents.state import AgentState


def planner_node(state: AgentState) -> AgentState:
    """
    Planner node stub for Week 1 orchestration testing.
    
    Accepts the current AgentState, extracts/logs the query, hardcodes the
    language to 'en', and sets a sample location if not already present.
    """
    query = state.get("query", "")
    print(f"\n[PLANNER NODE] Processing incoming query: '{query}'")
    
    # Hardcode language to 'en' for Week 1 stub as per requirements
    state["language"] = "en"
    
    # Set default location extraction for testing ("Kochi") if empty
    if not state.get("location"):
        state["location"] = {
            "name": "Kochi",
            "lat": 9.9312,
            "lon": 76.2673
        }
        print(f"[PLANNER NODE] Extracted location: {state['location']}")

    return state
