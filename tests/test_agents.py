"""
ORCA Comprehensive Agent Evaluation & Edge Case Test Suite (Week 4 & 5).
Tests all 8 official sample queries, explainability evidence formatting,
empty locations, unknown languages, and multi-API downtime resilience.
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

# All 8 Official Sample Queries from the SIH26176 Dossier
DOSSIER_SAMPLE_QUERIES = [
    "Where is the nearest PFZ today?",
    "Is it safe to venture into the sea tomorrow?",
    "What are tide, weather, sea conditions near my fishing location?",
    "Are there lightning or cyclone alerts?",
    "Which regions show high chlorophyll and favourable SST?",
    "What is the safest route for a fishing vessel?",
    "Why has fish productivity declined?",
    "Which zones should be avoided due to hazardous conditions or geofencing?"
]


@pytest.mark.parametrize("query_text", DOSSIER_SAMPLE_QUERIES)
def test_dossier_sample_queries_end_to_end(query_text: str):
    """Test that all 8 official dossier sample queries execute through the graph without error and produce valid output."""
    state: AgentState = {
        "query": query_text,
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
    assert len(final_state["evidence"]) >= 2
    assert "location" in final_state
    assert final_state["location"]["name"] is not None


def test_explainability_evidence_format():
    """Test that evidence citations strictly follow the '[DATA SOURCE]: [VALUE] → [CONCLUSION]' format."""
    state: AgentState = {
        "query": "Is it safe to fish near Kochi today?",
        "language": "en",
        "location": {"name": "Kochi", "lat": 9.9312, "lon": 76.2673},
        "weather_findings": {"status": "SAFE", "wave_height": 1.2, "wind_speed": 10.0},
        "ocean_findings": {"zone_quality": "HIGH", "sst_value": 28.5, "chlorophyll_value": 1.25},
        "risk_findings": {"geofence_status": "CLEAR", "zone_type": "SAFE_OPEN_WATER", "risk_level": "LOW", "recommendation": "Safe."},
        "final_answer": "",
        "evidence": []
    }
    
    final_state = synthesizer_node(state)
    
    for citation in final_state["evidence"]:
        assert ":" in citation
        assert "→" in citation
        assert any(src in citation for src in ["INCOIS", "MOSDAC", "GIS Geofence"])


def test_edge_case_empty_location():
    """Test behavior when query contains no explicit location."""
    state: AgentState = {
        "query": "Is it safe to fish today?",
        "language": "en",
        "location": {},
        "weather_findings": {},
        "ocean_findings": {},
        "risk_findings": {},
        "final_answer": "",
        "evidence": []
    }
    
    final_state = app.invoke(state)
    
    assert final_state["location"]["name"] == "Kochi"  # Fallback extracted location
    assert len(final_state["final_answer"]) > 0


def test_edge_case_unknown_language():
    """Test behavior when query language is unsupported or unknown (defaults to 'en')."""
    state: AgentState = {
        "query": "Bonjour est-ce qu'il est sûr de pêcher aujourd'hui?",
        "language": "",
        "location": {},
        "weather_findings": {},
        "ocean_findings": {},
        "risk_findings": {},
        "final_answer": "",
        "evidence": []
    }
    
    final_state = app.invoke(state)
    
    assert final_state["language"] == "en"
    assert "Advisory" in final_state["final_answer"] or "SAFE" in final_state["final_answer"] or "CAUTION" in final_state["final_answer"]


def test_edge_case_all_apis_down_simultaneously():
    """Test full resilience when INCOIS, MOSDAC, and Geofence APIs all fail at the same time."""
    state: AgentState = {
        "query": "Is it safe to fish near Kochi today?",
        "language": "en",
        "location": {"name": "Kochi", "lat": 9.9312, "lon": 76.2673},
        "weather_findings": {},
        "ocean_findings": {},
        "risk_findings": {},
        "final_answer": "",
        "evidence": []
    }
    
    with patch("agents.weather_agent.get_alert_data", side_effect=Exception("INCOIS Down")), \
         patch("agents.ocean_agent.get_sst", side_effect=Exception("MOSDAC SST Down")), \
         patch("agents.ocean_agent.get_chlorophyll", side_effect=Exception("MOSDAC Chl Down")), \
         patch("agents.risk_agent.check_geofence", side_effect=Exception("GIS Geofence Down")):
         
        final_state = app.invoke(state)
        
        assert final_state["weather_findings"]["status"] == "UNKNOWN"
        assert final_state["ocean_findings"]["zone_quality"] == "UNKNOWN"
        assert final_state["risk_findings"]["geofence_status"] == "UNKNOWN"
        assert len(final_state["final_answer"]) > 0
        assert len(final_state["evidence"]) >= 2
