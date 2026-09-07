"""
ORCA Agent Pipeline Unit & Integration Tests.
Tests state propagation across Planner, Weather Agent, Ocean Agent, and full StateGraph workflow.
Includes graceful error handling tests using tool mocks.
"""

import sys
import os
from unittest.mock import patch

import pytest

# Ensure repository root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.state import AgentState
from agents.planner_agent import planner_node
from agents.weather_agent import weather_node
from agents.ocean_agent import ocean_node
from agents.graph import app


@pytest.fixture
def base_state() -> AgentState:
    """Fixture providing a clean initial AgentState."""
    return {
        "query": "Is it safe to fish near Kochi today?",
        "language": "en",
        "location": {"name": "Kochi", "lat": 9.9312, "lon": 76.2673},
        "weather_findings": {},
        "ocean_findings": {},
        "risk_findings": {},
        "final_answer": "",
        "evidence": []
    }


def test_planner_node_state_flow(base_state: AgentState):
    """Test that state flows correctly through the planner node."""
    updated_state = planner_node(base_state)
    
    assert updated_state["language"] == "en"
    assert "location" in updated_state
    assert updated_state["location"]["name"] == "Kochi"
    assert updated_state["query"] == "Is it safe to fish near Kochi today?"


def test_weather_agent_populates_findings(base_state: AgentState):
    """Test that the Weather agent correctly calls tools and populates weather_findings."""
    updated_state = weather_node(base_state)
    
    assert "weather_findings" in updated_state
    findings = updated_state["weather_findings"]
    assert "status" in findings
    assert findings["status"] in ["SAFE", "MODERATE", "DANGEROUS"]
    assert "wave_height" in findings
    assert "alert_level" in findings
    assert "reasoning" in findings


def test_ocean_agent_populates_findings(base_state: AgentState):
    """Test that the Ocean agent correctly calls tools and populates ocean_findings."""
    updated_state = ocean_node(base_state)
    
    assert "ocean_findings" in updated_state
    findings = updated_state["ocean_findings"]
    assert "zone_quality" in findings
    assert findings["zone_quality"] in ["HIGH", "MODERATE", "LOW"]
    assert "sst_value" in findings
    assert "chlorophyll_value" in findings
    assert "reasoning" in findings


def test_full_graph_end_to_end(base_state: AgentState):
    """Test that the full compiled StateGraph runs end to end without errors."""
    final_state = app.invoke(base_state)
    
    assert final_state["language"] == "en"
    assert final_state["location"]["name"] == "Kochi"
    assert final_state["weather_findings"]["status"] in ["SAFE", "MODERATE", "DANGEROUS"]
    assert final_state["ocean_findings"]["zone_quality"] in ["HIGH", "MODERATE", "LOW"]


def test_weather_agent_handles_tool_failure_gracefully(base_state: AgentState):
    """Test that the Weather Agent handles a failed tool call gracefully when an exception is raised."""
    with patch("agents.weather_agent.get_alert_data", side_effect=Exception("INCOIS API Timeout")):
        updated_state = weather_node(base_state)
        
        assert "weather_findings" in updated_state
        findings = updated_state["weather_findings"]
        assert findings["status"] == "UNKNOWN"
        assert findings["alert_level"] == "GRAY"
        assert "temporarily unavailable" in findings["reasoning"]


def test_ocean_agent_handles_tool_failure_gracefully(base_state: AgentState):
    """Test that the Ocean Agent handles a failed tool call gracefully when an exception is raised."""
    with patch("agents.ocean_agent.get_sst", side_effect=Exception("MOSDAC API Connection Refused")):
        updated_state = ocean_node(base_state)
        
        assert "ocean_findings" in updated_state
        findings = updated_state["ocean_findings"]
        assert findings["zone_quality"] == "UNKNOWN"
        assert "temporarily unavailable" in findings["reasoning"]
