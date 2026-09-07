"""
ORCA Specialist Fault-Tolerance & Mock Failure Integration Tests.
Adapted from Samprikta's unit testing methodology (mocking tool network failures).
Validates graceful fallback to baseline registries and Kochi Kerala port support.
"""

import os
import sys
from unittest.mock import patch

# Ensure project root is in path
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.state import AgentState
from agents.planner_agent import planner_node
from agents.specialists import ocean_specialist_node, weather_specialist_node, risk_specialist_node
from agents.graph import orca_graph


def test_ocean_specialist_network_failure_fallback():
    """Test that ocean_specialist_node gracefully falls back when ARGO fetch fails."""
    state: AgentState = {
        "query": "What is the SST at Paradip?",
        "location": {"lat": 20.26, "lon": 86.67, "name": "Paradip Harbour"},
    }
    
    with patch("agents.specialists.get_live_argo_sst", return_value={"is_live": False, "error": "Mock timeout"}):
        result = ocean_specialist_node(state)
        
        assert "ocean_data" in result
        ocean = result["ocean_data"]
        assert ocean["sst_celsius"] == 29.4
        assert "Cached Baseline Fallback" in ocean["source"]
        assert len(result["evidence_citations"]) >= 1


def test_weather_specialist_network_failure_fallback():
    """Test that weather_specialist_node gracefully falls back when ASCAT & Open-Meteo fail."""
    state: AgentState = {
        "query": "What is the wave height and wind at Paradip?",
        "location": {"lat": 20.26, "lon": 86.67, "name": "Paradip Harbour"},
    }
    
    with patch("agents.specialists.get_live_ascat_wind", return_value={"is_live": False, "error": "Mock timeout"}), \
         patch("agents.specialists.get_live_openmeteo_wave", return_value={"is_live": False, "error": "Mock timeout"}):
        result = weather_specialist_node(state)
        
        assert "weather_data" in result
        weather = result["weather_data"]
        assert weather["significant_wave_height_m"] == 2.1
        assert weather["wind_speed_knots"] == 18.5
        assert "Cached Baseline Fallback" in weather["source"]


def test_kochi_port_anchor_and_state_flow():
    """Test Kochi (Kerala, Arabian Sea) entity extraction and pipeline routing."""
    query = "Is it safe to fish near Kochi today and where is the nearest PFZ?"
    state: AgentState = {
        "query": query,
        "vessel_type": "medium",
        "user_role": "fisher",
    }
    
    # 1. Test planner extraction
    planned = planner_node(state)
    assert planned["location"]["name"] == "Kochi Harbour"
    assert planned["location"]["lat"] == 9.93
    assert "pfz" in planned["intent"]
    assert "safety" in planned["intent"]
    
    # 2. Test full graph execution on Kochi query
    full_result = orca_graph.invoke(state)
    assert full_result["location"]["name"] == "Kochi Harbour"
    assert "ocean_data" in full_result
    assert "weather_data" in full_result
    assert "risk_data" in full_result
    assert full_result["risk_data"]["safety_index"] is not None
    assert len(full_result["final_response"]) > 100


if __name__ == "__main__":
    print("=" * 65)
    print("RUNNING ORCA FAULT-TOLERANCE & KOCHI INTEGRATION TESTS")
    print("=" * 65)
    test_ocean_specialist_network_failure_fallback()
    print("✓ Ocean Specialist Network Failure Fallback Passed")
    test_weather_specialist_network_failure_fallback()
    print("✓ Weather Specialist Network Failure Fallback Passed")
    test_kochi_port_anchor_and_state_flow()
    print("✓ Kochi Port Anchor & End-to-End Pipeline Passed")
    print("=" * 65)
    print("ALL FAULT-TOLERANCE & INTEGRATION TESTS PASSED!")
    print("=" * 65)
