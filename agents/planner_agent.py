"""
ORCA Planner Agent (SIH26176)
Decomposes user queries into domain intents, extracts spatiotemporal anchors,
and routes execution to specialist nodes.
"""

import re
from typing import Dict, Any, List
from .state import AgentState, LocationDict


# Port reference database for coastal entity recognition
PORT_REGISTRY = {
    "paradip": {"lat": 20.26, "lon": 86.67, "name": "Paradip Harbour", "sector": "Zone 4 (Odisha)"},
    "haldia": {"lat": 22.02, "lon": 88.06, "name": "Haldia Port", "sector": "Zone 4 (West Bengal)"},
    "digha": {"lat": 21.62, "lon": 87.51, "name": "Digha Coast", "sector": "Zone 4 (West Bengal)"},
    "visakhapatnam": {"lat": 17.68, "lon": 83.21, "name": "Visakhapatnam Port", "sector": "Zone 5 (Andhra)"},
    "chennai": {"lat": 13.08, "lon": 80.27, "name": "Chennai Harbour", "sector": "Zone 6 (Tamil Nadu)"},
    "mumbai": {"lat": 18.94, "lon": 72.84, "name": "Sassoon Docks", "sector": "Zone 1 (Maharashtra)"},
}

# Language detector patterns
INDIC_PATTERNS = {
    "hi": re.compile(r"[\u0900-\u097F]"),  # Devanagari (Hindi/Marathi)
    "bn": re.compile(r"[\u0980-\u09FF]"),  # Bengali
    "ta": re.compile(r"[\u0B80-\u0BFF]"),  # Tamil
}


def detect_language(text: str) -> str:
    """Detects Indic script or defaults to English."""
    for lang, pattern in INDIC_PATTERNS.items():
        if pattern.search(text):
            # Distinguish Hindi vs Marathi if needed, default to hi
            if lang == "hi" and any(w in text for w in ["आहे", "कशी", "लाटा", "हवामान"]):
                return "mr"
            return lang
    return "en"


def planner_node(state: AgentState) -> Dict[str, Any]:
    """
    Planner Node in LangGraph.
    Classifies intent, populates location/vessel context, and sets execution routes.
    """
    query = (state.get("transcribed_text") or state.get("query", "")).lower()
    
    # 1. Language Detection
    lang = state.get("language") or detect_language(query)
    
    # 2. Intent Classification across SIH Problem Statement queries
    intents: List[str] = []
    
    # PFZ (Fish zone / Chlorophyll / Catch)
    if any(k in query for k in ["fish", "pfz", "catch", "chlorophyll", "tuna", "mackerel", "मास", "মাছ", "மீன்"]):
        intents.append("pfz")
        
    # Weather (Waves, wind, cyclone)
    if any(k in query for k in ["wave", "wind", "cyclone", "weather", "hawa", "storm", "हवा", "লাটা", "বাতাস", "காற்று", "புயல்"]):
        intents.append("weather")
        
    # Safety / Navigation
    if any(k in query for k in ["safe", "safety", "danger", "index", "boat", "suraksha", "सुरक्षित", "নিরাপদ", "பாதுகாப்பு"]):
        intents.append("safety")
        
    # Geofence / IMBL border / Marine Protected Area
    if any(k in query for k in ["imbl", "border", "boundary", "mpa", "protected", "sanctuary", "restricted", "buffer zone", "সীমান্ত", "எல்லை"]):
        intents.append("geofence")
        
    # If no specific intent matched, default to general situational advisory (PFZ + Weather + Safety)
    if not intents:
        intents = ["pfz", "weather", "safety"]
        
    # 3. Location Extraction
    location: LocationDict = state.get("location") or {}
    if not location or not location.get("name"):
        matched = False
        for port_key, port_info in PORT_REGISTRY.items():
            if port_key in query:
                location = LocationDict(port_info)
                matched = True
                break
        if not matched:
            # Default fallback port per SIH Zone 4 requirements
            location = LocationDict(PORT_REGISTRY["paradip"])
            
    # 4. Vessel Type
    vessel = state.get("vessel_type") or "small"
    if "trawler" in query or "large" in query or "15m" in query:
        vessel = "large"
    elif "motorized" in query or "medium" in query or "fibre" in query:
        vessel = "medium"

    return {
        "language": lang,
        "intent": intents,
        "location": location,
        "vessel_type": vessel,
        "evidence_citations": ["Planner: Decomposed into intents: " + ", ".join(intents)],
    }
