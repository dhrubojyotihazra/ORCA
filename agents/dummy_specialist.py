"""
ORCA Dummy Specialist Agent.
Acts as a placeholder specialist node during Week 1 orchestration setup to prove
state propagation through the LangGraph workflow before real tools are wired.
"""

from agents.state import AgentState


def dummy_specialist_node(state: AgentState) -> AgentState:
    """
    Dummy specialist node for testing state flow.
    
    Fills weather_findings with sample safe marine condition data,
    logs the processed location, and returns the updated state.
    """
    location = state.get("location", {})
    location_name = location.get("name", "Unknown Location")
    
    print(f"[DUMMY SPECIALIST NODE] Processing location: {location_name} (Lat: {location.get('lat')}, Lon: {location.get('lon')})")
    
    # Populate dummy safe-conditions dictionary
    state["weather_findings"] = {
        "status": "SAFE",
        "wave_height_m": 1.2,
        "wind_speed_knots": 10.5,
        "alert_level": "GREEN",
        "reasoning": f"Weather conditions near {location_name} are mild with calm sea state."
    }
    
    print(f"[DUMMY SPECIALIST NODE] Updated weather_findings: {state['weather_findings']}")
    return state
