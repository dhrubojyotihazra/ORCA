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
    "kochi": {"lat": 9.93, "lon": 76.27, "name": "Kochi Harbour", "sector": "Zone 2 (Kerala)"},
}

# Comprehensive Indic language detector patterns
INDIC_PATTERNS = {
    "bn": re.compile(r"[\u0980-\u09FF]"),  # Bengali
    "pa": re.compile(r"[\u0A00-\u0A7F]"),  # Punjabi (Gurmukhi)
    "gu": re.compile(r"[\u0A80-\u0AFF]"),  # Gujarati
    "or": re.compile(r"[\u0B00-\u0B7F]"),  # Odia
    "ta": re.compile(r"[\u0B80-\u0BFF]"),  # Tamil
    "te": re.compile(r"[\u0C00-\u0C7F]"),  # Telugu
    "kn": re.compile(r"[\u0C80-\u0CFF]"),  # Kannada
    "ml": re.compile(r"[\u0D00-\u0D7F]"),  # Malayalam
    "hi": re.compile(r"[\u0900-\u097F]"),  # Devanagari (Hindi / Marathi)
}

MARATHI_KEYWORDS = ["आहे", "कशी", "लाटा", "हवामान", "मासे", "मार्ग", "कोणता", "बंदरापासून", "स्थिती", "लक्षात", "घेता", "सध्याचे", "सर्वात", "सुरक्षित"]


def detect_language(text: str) -> str:
    """Detects Indic script or defaults to English."""
    for lang, pattern in INDIC_PATTERNS.items():
        if pattern.search(text):
            if lang == "hi" and any(w in text for w in MARATHI_KEYWORDS):
                return "mr"
            return lang
    return "en"


def planner_node(state: AgentState) -> Dict[str, Any]:
    """
    Planner Node in LangGraph.
    Classifies intent, populates location/vessel context, and sets execution routes.
    """
    query = (state.get("transcribed_text") or state.get("query", ""))
    
    # 1. Language Detection: Detect Indic script from query first; fallback to state language
    detected = detect_language(query)
    lang = detected if detected != "en" else (state.get("language") or "en")
    query_lower = query.lower()
    
    # 2. Intent Classification across SIH Problem Statement queries
    intents: List[str] = []
    
    # PFZ (Fish zone / Chlorophyll / Catch)
    if any(k in query_lower for k in ["fish", "pfz", "catch", "chlorophyll", "tuna", "mackerel", "मास", "मासे", "মাছ", "ਮੱਛੀ", "மீன்", "ମାଛ"]):
        intents.append("pfz")
        
    # Weather (Waves, wind, cyclone)
    if any(k in query_lower for k in ["wave", "wind", "cyclone", "weather", "hawa", "storm", "हवा", "हवामान", "লাটা", "বাতাস", "আবহাওয়া", "ਲਹਿਰਾਂ", "ਮੌਸਮ", "காற்று", "புயல்", "ପାଣିପାଗ"]):
        intents.append("weather")
        if "public_bulletin" not in intents and any(k in query_lower for k in ["cyclone", "storm", "warning", "alert", "weather", "புயல்", "চক্রবাত", "ਚੱਕਰਵਾਤ"]):
            intents.append("public_bulletin")
        
    # Safety / Navigation
    if any(k in query_lower for k in ["safe", "safety", "danger", "index", "boat", "sail", "suraksha", "सुरक्षित", "मार्ग", "নিরাপদ", "পথ", "ਸੁਰੱਖਿਅਤ", "ਰਸਤਾ", "பாதுகாப்பு", "ନିରାପଦ"]):
        intents.append("safety")
        if "public_bulletin" not in intents:
            intents.append("public_bulletin")
        
    # Geofence / IMBL border / Marine Protected Area
    if any(k in query_lower for k in ["imbl", "border", "boundary", "mpa", "protected", "sanctuary", "restricted", "buffer zone", "सीमा", "সীমান্ত", "ਬਾਰਡਰ", "எல்லை"]):
        intents.append("geofence")
        
    # Public Research Bulletin (Official Government Bulletins, IMD, NDMA, INCOIS public alerts)
    if any(k in query_lower for k in [
        "bulletin", "bulletins", "official alert", "imd alert", "cyclone warning", "ndma", "incois advisory",
        "public portal", "official notice", "government alert", "advisory", "advisories", "public bulletin",
        "cyclone alert", "forecast bulletin", "official bulletin", "warning", "warnings", "alert", "alerts",
        "notice", "notices", "government", "sarkari", "khabar", "खबर", "বিজ্ঞপ্তি", "ਸੂਚਨਾ", "அறிவிப்பு",
        "advisor", "public advisor", "research agent"
    ]):
        if "public_bulletin" not in intents:
            intents.append("public_bulletin")

    # If no specific intent matched, default to general situational advisory (PFZ + Weather + Safety + Public Bulletin)
    if not intents:
        intents = ["pfz", "weather", "safety", "public_bulletin"]
        
    # 3. Location Extraction
    location: LocationDict = state.get("location") or {}
    if not location or not location.get("name"):
        matched = False
        for port_key, port_info in PORT_REGISTRY.items():
            if port_key in query_lower or port_info.get("name", "").lower() in query_lower:
                location = LocationDict(port_info)
                matched = True
                break
        if not matched:
            # Default fallback port per SIH Zone 4 requirements
            location = LocationDict(PORT_REGISTRY["paradip"])
            
    # 4. Vessel Type
    vessel = state.get("vessel_type") or "small"
    if "trawler" in query_lower or "large" in query_lower or "15m" in query_lower:
        vessel = "large"
    elif "motorized" in query_lower or "medium" in query_lower or "fibre" in query_lower:
        vessel = "medium"

    # 5. User Role Register (defaults to 'fisher')
    valid_roles = ["fisher", "coast_guard", "port_operator", "scientist"]
    raw_role = (state.get("user_role") or "fisher").lower().strip()
    user_role = raw_role if raw_role in valid_roles else "fisher"

    return {
        "language": lang,
        "intent": intents,
        "location": location,
        "vessel_type": vessel,
        "user_role": user_role,
        "evidence_citations": ["Planner: Decomposed into intents: " + ", ".join(intents)],
    }
