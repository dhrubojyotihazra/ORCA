"""
ORCA Ocean Analytics Specialist Agent.
Calls MOSDAC satellite observations (Sea Surface Temperature and Chlorophyll-a),
reasons over oceanographic data to evaluate Potential Fishing Zone (PFZ) quality,
and updates the AgentState with structured ocean findings.
"""

import sys
import os

# Ensure package resolution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.state import AgentState
from data.tools.mosdac_tools import get_sst, get_chlorophyll


def ocean_node(state: AgentState) -> AgentState:
    """
    Ocean Agent Node.
    
    Extracts location coordinates from AgentState, calls get_sst and get_chlorophyll,
    reasons over SST (°C) and Chlorophyll-a (mg/m³) to evaluate fishing zone quality
    (HIGH / MODERATE / LOW), and populates ocean_findings.
    Handles tool failures gracefully with fallback data.
    """
    location = state.get("location", {})
    lat = location.get("lat", 9.9312)
    lon = location.get("lon", 76.2673)
    loc_name = location.get("name", "Target Location")

    print(f"[OCEAN AGENT] Fetching MOSDAC SST and Chlorophyll data for {loc_name} (Lat: {lat}, Lon: {lon})...")

    try:
        sst_data = get_sst(lat, lon)
        chl_data = get_chlorophyll(lat, lon)

        if not sst_data or not chl_data:
            raise ValueError("MOSDAC tool returned empty payload for SST or Chlorophyll.")

        sst_val = sst_data.get("sst_celsius", 0.0)
        chl_val = chl_data.get("chlorophyll_mg_m3", 0.0)

        # Reasoning logic over oceanographic parameters:
        # Favourable fishing zone (PFZ): SST between 26°C and 29°C AND Chlorophyll > 0.5 mg/m³
        if (26.0 <= sst_val <= 29.5) and chl_val >= 1.0:
            zone_quality = "HIGH"
            reasoning = f"HIGH Potential Fishing Zone quality near {loc_name}: Optimal SST ({sst_val}°C) and high Chlorophyll-a concentration ({chl_val} mg/m³) indicate rich plankton aggregation."
        elif (25.0 <= sst_val <= 30.5) and chl_val >= 0.3:
            zone_quality = "MODERATE"
            reasoning = f"MODERATE Potential Fishing Zone quality near {loc_name}: SST ({sst_val}°C) and Chlorophyll-a ({chl_val} mg/m³) are suitable for fishing."
        else:
            zone_quality = "LOW"
            reasoning = f"LOW Potential Fishing Zone quality near {loc_name}: SST ({sst_val}°C) or Chlorophyll-a ({chl_val} mg/m³) indicates sub-optimal fish congregation conditions."

        ocean_findings = {
            "sst_value": sst_val,
            "chlorophyll_value": chl_val,
            "zone_quality": zone_quality,
            "reasoning": reasoning
        }

    except Exception as e:
        print(f"[OCEAN AGENT WARNING] Tool call failed or raised exception: {e}. Executing fallback...")
        ocean_findings = {
            "sst_value": 0.0,
            "chlorophyll_value": 0.0,
            "zone_quality": "UNKNOWN",
            "reasoning": f"Oceanographic satellite data temporarily unavailable for {loc_name} due to service error ({str(e)}). Defaulting to neutral zone assessment."
        }

    state["ocean_findings"] = ocean_findings
    print(f"[OCEAN AGENT] Ocean findings populated: {state['ocean_findings']['zone_quality']} - {state['ocean_findings']['reasoning']}")
    return state
