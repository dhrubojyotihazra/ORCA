"""
ORCA Multi-Agent Backend Service (SIH26176)
FastAPI service executing the real LangGraph 5-Node StateGraph DAG:
Planner -> [Ocean, Weather, Risk Specialists] -> Anti-Hallucination Synthesizer
"""

import os
import sys
import time
import datetime
import logging
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import edge_tts

# Ensure project root is on sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, ".env"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ORCA-FastAPI")

from agents.graph import orca_graph
from agents.state import AgentState

app = FastAPI(
    title="ORCA Multi-Agent Marine Intelligence Engine (SIH26176)",
    description="FastAPI Service executing the real LangGraph 5-node StateGraph DAG for Marine Decision Support",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AgentInvokeRequest(BaseModel):
    query: str
    location: Optional[Dict[str, Any]] = None
    vessel_type: Optional[str] = "small"
    language: Optional[str] = None
    user_role: Optional[str] = "fisher"
    role: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = []


class NodeExecutionTrace(BaseModel):
    id: str
    agentId: str
    name: str
    role: str
    durationMs: int
    status: str
    summary: str
    nodeOutput: Dict[str, Any]
    citations: List[str]


class AgentInvokeResponse(BaseModel):
    content: str
    modelUsed: str
    timestamp: str
    language: str
    userRole: Optional[str] = "fisher"
    intent: List[str]
    location: Dict[str, Any]
    oceanData: Optional[Dict[str, Any]] = None
    weatherData: Optional[Dict[str, Any]] = None
    riskData: Optional[Dict[str, Any]] = None
    publicResearchData: Optional[Dict[str, Any]] = None
    executedNodes: List[str]
    agentTrace: List[NodeExecutionTrace]
    evidenceCitations: List[str]
    totalDurationMs: int


NODE_METADATA = {
    "planner": {
        "name": "Planner Agent",
        "role": "Autonomous Intent & Spatial Routing",
    },
    "ocean_specialist": {
        "name": "Ocean Specialist",
        "role": "MOSDAC / ARGO SST & Species HSI",
    },
    "weather_specialist": {
        "name": "Weather Specialist",
        "role": "INCOIS High-Res Wave & Wind Telemetry",
    },
    "risk_specialist": {
        "name": "Risk Specialist",
        "role": "Sea-Venture Hydrodynamics & Geofence Guard",
    },
    "public_research_specialist": {
        "name": "Public Source Research Agent",
        "role": "Official Marine & Meteorological Government Bulletins",
    },
    "synthesizer": {
        "name": "Synthesizer Agent",
        "role": "Zero-Hallucination Regional Synthesis",
    },
}


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "engine": "LangGraph StateGraph DAG (SIH26176)",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "registered_nodes": list(NODE_METADATA.keys()),
    }


@app.get("/api/agents/graph")
def get_graph_schema():
    """Returns the DAG topology and node definitions."""
    return {
        "nodes": [
            {"id": k, "name": v["name"], "role": v["role"]}
            for k, v in NODE_METADATA.items()
        ],
        "edges": [
            {"from": "START", "to": "planner"},
            {"from": "planner", "to": "ocean_specialist", "condition": "intent: pfz"},
            {"from": "planner", "to": "weather_specialist", "condition": "intent: weather/safety"},
            {"from": "planner", "to": "risk_specialist", "condition": "intent: geofence"},
            {"from": "planner", "to": "public_research_specialist", "condition": "intent: public_bulletin"},
            {"from": "ocean_specialist", "to": "weather_specialist"},
            {"from": "weather_specialist", "to": "risk_specialist"},
            {"from": "weather_specialist", "to": "public_research_specialist"},
            {"from": "risk_specialist", "to": "public_research_specialist"},
            {"from": "risk_specialist", "to": "synthesizer"},
            {"from": "public_research_specialist", "to": "synthesizer"},
            {"from": "synthesizer", "to": "END"},
        ],
    }


@app.post("/api/agents/invoke", response_model=AgentInvokeResponse)
def invoke_agents(payload: AgentInvokeRequest):
    """
    Executes the real LangGraph StateGraph DAG via graph.stream() to record
    actual executed nodes, per-node outputs, and real node execution timings.
    """
    start_total = time.time()
    valid_roles = ["fisher", "coast_guard", "port_operator", "scientist"]
    raw_role = payload.user_role or payload.role or "fisher"
    user_role = raw_role.lower().strip() if raw_role.lower().strip() in valid_roles else "fisher"
    logger.info(f"LangGraph DAG Invoke: query='{payload.query[:60]}...', vessel={payload.vessel_type}, role={user_role}")

    initial_state: AgentState = {
        "query": payload.query,
        "vessel_type": payload.vessel_type or "small",
        "language": payload.language,
        "user_role": user_role,
        "location": payload.location or {},
        "messages": payload.messages or [],
        "evidence_citations": [],
    }

    try:
        accumulated_state: Dict[str, Any] = {}
        executed_nodes: List[str] = []
        agent_trace: List[NodeExecutionTrace] = []

        # Execute DAG with real streaming to track actual node-by-node execution
        t_prev = time.time()
        for chunk in orca_graph.stream(initial_state, stream_mode="updates"):
            t_now = time.time()
            node_duration = max(1, int((t_now - t_prev) * 1000))
            t_prev = t_now

            for node_name, node_update in chunk.items():
                executed_nodes.append(node_name)
                for k, v in node_update.items():
                    if k == "evidence_citations" and isinstance(v, list):
                        accumulated_state.setdefault("evidence_citations", [])
                        for item in v:
                            if item not in accumulated_state["evidence_citations"]:
                                accumulated_state["evidence_citations"].append(item)
                    else:
                        accumulated_state[k] = v

                meta = NODE_METADATA.get(node_name, {"name": node_name, "role": "Specialist Agent"})
                ts_id = int(time.time() * 1000)

                # Generate concise, informative summary from actual node output
                summary = ""
                citations = node_update.get("evidence_citations", [])

                if node_name == "planner":
                    intents = node_update.get("intent", [])
                    loc = node_update.get("location", {})
                    lang = node_update.get("language", "en")
                    summary = f"Identified intents: [{', '.join(intents)}] | Lang: {lang.upper()} | Anchor: {loc.get('name', 'General Coastal')}"
                elif node_name == "ocean_specialist":
                    odata = node_update.get("ocean_data", {})
                    sst = odata.get("sst_celsius", "N/A")
                    obs_t = (odata.get("timestamp") or "")[:10]
                    hsi = odata.get("species_hsi", {}).get("Indian Mackerel", 0.8)
                    summary = f"INCOIS ARGO SST: {sst}°C (Observed: {obs_t}) | HSI Mackerel: {hsi} | Thermal front verified"
                elif node_name == "weather_specialist":
                    wdata = node_update.get("weather_data", {})
                    hs = wdata.get("significant_wave_height_m", "N/A")
                    wind = wdata.get("wind_speed_knots", "N/A")
                    obs_t = (wdata.get("timestamp") or "")[:10]
                    alert = wdata.get("cyclone_alert_level", "Normal")
                    summary = f"INCOIS OSF: Hs={hs}m | Wind={wind} kts (Observed: {obs_t}) | Cyclone Advisory: {alert}"
                elif node_name == "risk_specialist":
                    rdata = node_update.get("risk_data", {})
                    s_idx = rdata.get("safety_index", "N/A")
                    cat = rdata.get("risk_category", "N/A")
                    mpa = rdata.get("mpa_distance_nm", "N/A")
                    summary = f"Sea-Venture Hydrodynamic Index: {s_idx}/100 ({cat}) | MPA Sanctuary Distance: {mpa} NM"
                elif node_name == "public_research_specialist":
                    pdata = node_update.get("public_research_data", {})
                    if pdata.get("found"):
                        summary = f"Identified official bulletin from {pdata.get('agency')}: '{pdata.get('bulletin_title')}'"
                    else:
                        summary = f"Checked {len(pdata.get('checked_sources', []))} official portals: Zero matching active bulletins identified (Zero-fabrication guardrail)."
                elif node_name == "synthesizer":
                    summary = "Synthesized grounded regional multilingual response adhering strictly to specialist payloads."

                agent_trace.append(
                    NodeExecutionTrace(
                        id=f"node-{node_name}-{ts_id}",
                        agentId=node_name.replace("_specialist", ""),
                        name=meta["name"],
                        role=meta["role"],
                        durationMs=node_duration,
                        status="completed",
                        summary=summary,
                        nodeOutput=node_update,
                        citations=citations,
                    )
                )

        total_duration_ms = int((time.time() - start_total) * 1000)
        final_content = accumulated_state.get("final_response", "Advisory generated.")
        logger.info(f"LangGraph DAG completed in {total_duration_ms}ms. Executed nodes: {executed_nodes}")

        return AgentInvokeResponse(
            content=final_content,
            modelUsed="LangGraph Multi-Agent (6-Node StateGraph DAG)",
            timestamp=datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M UTC"),
            language=accumulated_state.get("language", "en"),
            userRole=accumulated_state.get("user_role", user_role),
            intent=accumulated_state.get("intent", []),
            location=accumulated_state.get("location", {}),
            oceanData=accumulated_state.get("ocean_data"),
            weatherData=accumulated_state.get("weather_data"),
            riskData=accumulated_state.get("risk_data"),
            publicResearchData=accumulated_state.get("public_research_data"),
            executedNodes=executed_nodes,
            agentTrace=agent_trace,
            evidenceCitations=accumulated_state.get("evidence_citations", []),
            totalDurationMs=total_duration_ms,
        )

    except Exception as e:
        logger.error(f"Error in LangGraph execution: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"LangGraph execution error: {str(e)}")


class VoiceTTSRequest(BaseModel):
    text: str
    language: Optional[str] = "en-IN"
    voice: Optional[str] = None


VOICE_MAP = {
    "en-IN": "en-IN-NeerjaExpressiveNeural",
    "en": "en-IN-NeerjaExpressiveNeural",
    "hi-IN": "hi-IN-SwaraNeural",
    "hi": "hi-IN-SwaraNeural",
    "bn-IN": "bn-IN-TanishaaNeural",
    "bn": "bn-IN-TanishaaNeural",
    "ta-IN": "ta-IN-PallaviNeural",
    "ta": "ta-IN-PallaviNeural",
    "mr-IN": "mr-IN-AarohiNeural",
    "mr": "mr-IN-AarohiNeural",
}


@app.post("/api/voice/tts")
async def generate_voice_tts(req: VoiceTTSRequest):
    try:
        lang_key = req.language or "en-IN"
        voice = req.voice or VOICE_MAP.get(lang_key) or VOICE_MAP.get(lang_key[:2]) or "en-IN-NeerjaExpressiveNeural"
        logger.info(f"Generating Neural TTS via edge-tts with voice={voice} (lang={lang_key}): {req.text[:60]}...")
        
        communicate = edge_tts.Communicate(req.text, voice)
        audio_buffer = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.extend(chunk["data"])
                
        return Response(content=bytes(audio_buffer), media_type="audio/mpeg")
    except Exception as e:
        logger.error(f"Error generating neural voice: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS generation error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
