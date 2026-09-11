"""
ORCA Synthesizer Agent.
Combines findings from Weather Agent, Ocean Agent, and Risk Agent into a single,
coherent, plain-language advisory tailored to fishermen.
Supports multilingual output (English, Hindi, Bengali) based on detected language,
and populates clear evidence citations for explainability.
"""

import sys
import os
import re
from typing import List

# Ensure package resolution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.state import AgentState


def detect_language(query: str) -> str:
    """
    Detects language from raw query string.
    
    Args:
        query: User input query text.
        
    Returns:
        Language code: 'hi' (Hindi), 'bn' (Bengali), or 'en' (English default).
    """
    if not query:
        return "en"

    # Check for Bengali Unicode character range (\u0980 - \u09FF)
    if re.search(r'[\u0980-\u09FF]', query):
        return "bn"

    # Check for Hindi / Devanagari Unicode character range (\u0900 - \u097F)
    if re.search(r'[\u0900-\u097F]', query):
        return "hi"

    # Keywords fallback check
    query_lower = query.lower()
    if any(word in query_lower for word in ["আজকে", "মাছ", "ধরা", "নিরাপদ", "আগামীকাল"]):
        return "bn"
    if any(word in query_lower for word in ["क्या", "मछली", "पकड़ना", "सुरक्षित", "आज", "कल"]):
        return "hi"

    return "en"


def synthesizer_node(state: AgentState) -> AgentState:
    """
    Synthesizer Node.
    
    1. Reads weather_findings, ocean_findings, and risk_findings from state.
    2. Detects or confirms state['language'] ('en', 'hi', 'bn').
    3. Merges findings into plain-language advisory (final_answer).
    4. Generates data citation strings for explainability (evidence).
    """
    query = state.get("query", "")
    
    # Language detection: update if language is missing or auto-detect from query
    lang = state.get("language")
    if not lang or lang == "en":
        detected_lang = detect_language(query)
        if detected_lang != "en":
            lang = detected_lang
            state["language"] = lang

    weather_findings = state.get("weather_findings", {})
    ocean_findings = state.get("ocean_findings", {})
    risk_findings = state.get("risk_findings", {})
    location = state.get("location", {})
    loc_name = location.get("name", "Target Coast")

    # Extract metrics for evidence generation
    wave_h = weather_findings.get("wave_height", 0.0)
    wind_s = weather_findings.get("wind_speed", 0.0)
    weather_status = weather_findings.get("status", "SAFE")
    
    sst_val = ocean_findings.get("sst_value", 0.0)
    chl_val = ocean_findings.get("chlorophyll_value", 0.0)
    zone_quality = ocean_findings.get("zone_quality", "MODERATE")

    geofence_status = risk_findings.get("geofence_status", "CLEAR")
    zone_type = risk_findings.get("zone_type", "SAFE_OPEN_WATER")
    risk_level = risk_findings.get("risk_level", "LOW")

    # Build Evidence citations list
    evidence: List[str] = [
        f"Wave height of {wave_h}m and wind speed of {wind_s} knots from INCOIS confirmed {weather_status} weather status.",
        f"SST of {sst_val}°C and Chlorophyll-a concentration of {chl_val} mg/m³ from MOSDAC indicated {zone_quality} fishing zone quality.",
        f"Geofence check ({geofence_status} in {zone_type}) from GIS dataset determined overall {risk_level} risk level."
    ]

    # Generate multilingual plain-language final answer
    if lang == "hi":
        if risk_level in ["CRITICAL", "HIGH"]:
            safety_msg = f"मछली पकड़ने जाने की सलाह नहीं दी जाती है। जोखिम का स्तर: {risk_level}।"
        elif risk_level == "MODERATE":
            safety_msg = f"सावधानी के साथ मछली पकड़ने जा सकते हैं। जोखिम का स्तर: मध्यम ({risk_level})।"
        else:
            safety_msg = f"हाँ, {loc_name} के पास आज मछली पकड़ना सुरक्षित है। जोखिम का स्तर: कम ({risk_level})।"

        final_answer = (
            f"सलाह: {safety_msg}\n"
            f"• मौसम स्थिति: लहरों की ऊँचाई {wave_h} मीटर और हवा की गति {wind_s} नॉट्स है ({weather_status})।\n"
            f"• समुद्री क्षेत्र गुणवत्ता: {loc_name} में SST {sst_val}°C और क्लोरोफिल {chl_val} mg/m³ के साथ संभावित मछली पकड़ने का क्षेत्र {zone_quality} है।\n"
            f"• सीमा और जोखिम चेतावनी: भू-सीमा स्थिति '{geofence_status}' ({zone_type}) है।\n"
            f"• अगला कदम: {risk_findings.get('recommendation', 'सावधानी बरतें और संचार उपकरण चालू रखें।')}"
        )

    elif lang == "bn":
        if risk_level in ["CRITICAL", "HIGH"]:
            safety_msg = f"মাছ ধরতে যাওয়ার পরামর্শ দেওয়া হচ্ছে না। ঝুঁকিমাত্রা: {risk_level}।"
        elif risk_level == "MODERATE":
            safety_msg = f"সতর্কতার সাথে মাছ ধরতে যেতে পারেন। ঝুঁকিমাত্রা: মাঝারি ({risk_level})।"
        else:
            safety_msg = f"হ্যাঁ, {loc_name} এর কাছে আজ মাছ ধরা নিরাপদ। ঝুঁকিমাত্রা: কম ({risk_level})।"

        final_answer = (
            f"পরামর্শ: {safety_msg}\n"
            f"• আবহাওয়া সারসংক্ষেপ: ঢেউয়ের উচ্চতা {wave_h} মিটার এবং বাতাসের গতি {wind_s} নট ({weather_status})।\n"
            f"• সামুদ্রিক অঞ্চলের গুণমান: {loc_name} এর কাছে SST {sst_val}°C এবং ক্লোরোফিল {chl_val} mg/m³ সহ মাছ ধরার ক্ষেত্র {zone_quality}।\n"
            f"• জিওফেন্স সতর্কবার্তা: ভূ-সীমানা অবস্থা '{geofence_status}' ({zone_type})।\n"
            f"• পরবর্তী করণীয়: {risk_findings.get('recommendation', 'সতর্ক থাকুন এবং লাইফ জ্যাকেট সঙ্গে রাখুন।')}"
        )

    else:  # English default ('en')
        if risk_level in ["CRITICAL", "HIGH"]:
            safety_msg = f"It is NOT RECOMMENDED to venture into the sea. Risk Level: {risk_level}."
        elif risk_level == "MODERATE":
            safety_msg = f"Exercise CAUTION if venturing out. Risk Level: MODERATE."
        else:
            safety_msg = f"Yes, it is SAFE to go fishing near {loc_name} today. Risk Level: LOW."

        final_answer = (
            f"Advisory: {safety_msg}\n"
            f"• Weather Summary: Wave height is {wave_h}m and wind speed is {wind_s} knots (Status: {weather_status}).\n"
            f"• Ocean Quality: SST is {sst_val}°C with Chlorophyll-a at {chl_val} mg/m³, indicating a {zone_quality} potential fishing zone.\n"
            f"• Boundary & Risk Warning: Geofence status is '{geofence_status}' in zone type '{zone_type}'.\n"
            f"• Recommended Next Steps: {risk_findings.get('recommendation', 'Maintain standard safety equipment and monitor radio alerts.')}"
        )

    state["final_answer"] = final_answer
    state["evidence"] = evidence

    print(f"[SYNTHESIZER AGENT] Generated final answer in '{lang}' ({len(evidence)} evidence citations).")
    return state
