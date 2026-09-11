"""
ORCA Agent Pipeline Unit & Integration Tests.
Tests state propagation across Planner, Weather Agent, Ocean Agent, Risk Agent,
Synthesizer Agent, Language Detection, and full StateGraph workflow.
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
from agents.risk_agent import risk_node
from agents.synthesizer_agent import synthesizer_node, detect_language
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


# ============================================================================
# WEEK 3 TESTS: Risk Agent, Synthesizer Agent, Language Detection & Pipeline
# ============================================================================

def test_risk_agent_populates_findings(base_state: AgentState):
    """Test that Risk agent correctly populates risk_findings."""
    base_state["weather_findings"] = {"status": "SAFE"}
    base_state["ocean_findings"] = {"zone_quality": "HIGH"}
    
    updated_state = risk_node(base_state)
    
    assert "risk_findings" in updated_state
    findings = updated_state["risk_findings"]
    assert "geofence_status" in findings
    assert "zone_type" in findings
    assert "risk_level" in findings
    assert findings["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert "risk_reasons" in findings
    assert isinstance(findings["risk_reasons"], list)
    assert "recommendation" in findings


def test_risk_agent_critical_when_restricted_zone(base_state: AgentState):
    """Test that Risk agent returns CRITICAL when geofence tool says location is in a restricted zone."""
    base_state["location"] = {"name": "Restricted Zone", "lat": 2.0, "lon": 2.0}
    base_state["weather_findings"] = {"status": "SAFE"}
    base_state["ocean_findings"] = {"zone_quality": "HIGH"}
    
    updated_state = risk_node(base_state)
    assert updated_state["risk_findings"]["risk_level"] == "CRITICAL"
    assert updated_state["risk_findings"]["zone_type"] == "RESTRICTED_NAVAL_ZONE"


def test_risk_agent_low_when_open_water_and_safe(base_state: AgentState):
    """Test that Risk agent returns LOW when all conditions are safe and location is open water."""
    base_state["location"] = {"name": "Safe Water", "lat": 10.0, "lon": 75.0}
    base_state["weather_findings"] = {"status": "SAFE", "wave_height": 0.8, "wind_speed": 8.0}
    base_state["ocean_findings"] = {"zone_quality": "HIGH"}
    
    updated_state = risk_node(base_state)
    assert updated_state["risk_findings"]["risk_level"] == "LOW"
    assert updated_state["risk_findings"]["zone_type"] == "SAFE_OPEN_WATER"


def test_synthesizer_produces_non_empty_answer_and_evidence(base_state: AgentState):
    """Test that Synthesizer Agent produces a non-empty final_answer and populates evidence items."""
    base_state["weather_findings"] = {"status": "SAFE", "wave_height": 1.2, "wind_speed": 10.0}
    base_state["ocean_findings"] = {"zone_quality": "HIGH", "sst_value": 28.5, "chlorophyll_value": 1.25}
    base_state["risk_findings"] = {"geofence_status": "CLEAR", "zone_type": "SAFE_OPEN_WATER", "risk_level": "LOW", "recommendation": "Safe to fish."}
    
    updated_state = synthesizer_node(base_state)
    
    assert len(updated_state["final_answer"]) > 0
    assert len(updated_state["evidence"]) >= 2


def test_language_detection():
    """Test detect_language for Bengali, Hindi, and English."""
    assert detect_language('আজকে মাছ ধরা') == 'bn'
    assert detect_language('आज मछली पकड़ना') == 'hi'
    assert detect_language('Is it safe today') == 'en'


def test_full_graph_end_to_end_english():
    """Test full graph execution end to end in English."""
    state = {
        "query": "Is it safe to fish near Kochi tomorrow morning?",
        "language": "en",
        "location": {},
        "weather_findings": {},
        "ocean_findings": {},
        "risk_findings": {},
        "final_answer": "",
        "evidence": []
    }
    final_state = app.invoke(state)
    
    assert len(final_state["final_answer"]) > 0
    assert "SAFE" in final_state["final_answer"] or "Advisory" in final_state["final_answer"]
    assert len(final_state["evidence"]) >= 2


def test_full_graph_end_to_end_hindi():
    """Test full graph execution end to end in Hindi."""
    state = {
        "query": "क्या कल कोच्चि के पास मछली पकड़ना सुरक्षित है?",
        "language": "hi",
        "location": {},
        "weather_findings": {},
        "ocean_findings": {},
        "risk_findings": {},
        "final_answer": "",
        "evidence": []
    }
    final_state = app.invoke(state)
    
    assert len(final_state["final_answer"]) > 0
    assert final_state["language"] == "hi"
    assert "सलाह" in final_state["final_answer"] or "मछली" in final_state["final_answer"]


def test_full_graph_end_to_end_bengali():
    """Test full graph execution end to end in Bengali."""
    state = {
        "query": "আগামীকাল কোচি কাছে মাছ ধরা কি নিরাপদ?",
        "language": "bn",
        "location": {},
        "weather_findings": {},
        "ocean_findings": {},
        "risk_findings": {},
        "final_answer": "",
        "evidence": []
    }
    final_state = app.invoke(state)
    
    assert len(final_state["final_answer"]) > 0
    assert final_state["language"] == "bn"
    assert "পরামর্শ" in final_state["final_answer"] or "মাছ" in final_state["final_answer"]
