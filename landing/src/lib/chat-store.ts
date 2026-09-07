export type ThemeMode = "light" | "dark";

export interface ChatArtifact {
  id: string;
  title: string;
  type: "code" | "data" | "chart" | "markdown";
  language?: string;
  content: string;
  subtitle?: string;
}

export interface AgentTraceStep {
  id: string;
  agentId: "planner" | "ocean_specialist" | "weather_specialist" | "risk_specialist" | "synthesizer";
  name: string;
  role: string;
  durationMs: number;
  status: "completed" | "warning" | "error";
  summary: string;
  telemetry?: Record<string, any>;
  citations?: string[];
  isLive?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
  artifact?: ChatArtifact;
  agentTrace?: AgentTraceStep[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  model: string;
  category?: string;
  statusDotColor?: string;
  messages: ChatMessage[];
}

export const INITIAL_CHATS: ChatSession[] = [
  {
    id: "1",
    title: "Zone 4 PFZ & Tuna Chlorophyll",
    createdAt: "Just now",
    model: "ORCA Multi-Agent (LangGraph)",
    statusDotColor: "bg-teal-400",
    messages: [
      {
        id: "msg-1-1",
        role: "user",
        content: "Where is the nearest Potential Fishing Zone (PFZ) today from Paradip Harbour?",
        timestamp: "6:14 PM",
      },
      {
        id: "msg-1-2",
        role: "assistant",
        content: `### 🐟 ORCA Potential Fishing Zone (PFZ) Advisory · Zone 4
**Corridor Anchor**: Paradip Harbour ($20.26^\\circ\\text{N}, 86.67^\\circ\\text{E}$) · Bay of Bengal  
**Target Sector**: 14.2 Nautical Miles Southeast (Bearing $135^\\circ$ SE)

Here is the operational directed acyclic graph (DAG) executed on **LangGraph**:

\`\`\`mermaid
graph TD
    User(["User Voice / Text Query"]) --> Whisper["Groq Whisper LPU ASR (300ms)"]
    Whisper --> Planner["Planner Agent: Intent & Corridor Routing"]
    Planner --> Ocean["Ocean Specialist: MOSDAC SST & Chlorophyll-a"]
    Planner --> Weather["Weather Specialist: INCOIS OSF Wave & Wind"]
    Planner --> Risk["Risk Specialist: Sea-Venture Index & IMBL/MPA"]
    Ocean --> Synthesizer["Synthesizer Agent: Strict Grounding"]
    Weather --> Synthesizer
    Risk --> Synthesizer
    Synthesizer --> Output(["Verified Regional Marine Advisory"])
\`\`\`

#### 1. Species-Specific Habitat Suitability Index (HSI)
| Target Marine Species | Suitability Index (HSI) | Optimal Temperature | Observed Chlorophyll | Local Catch Probability |
| :--- | :---: | :--- | :--- | :--- |
| **Indian Mackerel** | **0.82 / 1.0** | $26.0 - 28.5^\\circ\\text{C}$ | $1.82\\,\\mu\\text{g/L}$ | **High** (Active thermal front) |
| **Yellowfin Tuna** | **0.65 / 1.0** | $27.0 - 29.0^\\circ\\text{C}$ | $0.25\\,\\mu\\text{g/L}$ | **Moderate** (Shelf break convergence) |
| **Hilsa / Coastal Pelagics** | **0.88 / 1.0** | $28.0 - 30.0^\\circ\\text{C}$ | $2.10\\,\\mu\\text{g/L}$ | **Very High** (Estuarine plume) |

#### 2. Satellite Earth Observation Verification
- **Oceansat-3 Scatterometer Pass**: 04:30 UTC
- **Sea Surface Temperature (SST)**: $29.4^\\circ\\text{C}$ (Anomalous front $+0.8^\\circ\\text{C}$)
- **Chlorophyll-a Gradient**: Active bloom identified at $19.4^\\circ\\text{N}, 86.2^\\circ\\text{E}$

---
**Source:** MOSDAC Oceansat-3 & INCOIS PFZ Mission Bulletin #0906 | **Grounded Advisory Verified**`,
        timestamp: "6:14 PM",
        modelUsed: "ORCA Multi-Agent (LangGraph · 5 Agents)",
        agentTrace: [
          {
            id: "trace-demo-1",
            agentId: "planner",
            name: "Planner Agent",
            role: "Spatial Slicing & Intent Decomposition",
            durationMs: 24,
            status: "completed",
            summary: "Extracted anchor: Paradip Harbour (20.26°N, 86.67°E). Classified intent: PFZ Exploration & Species HSI.",
            telemetry: { port: "Paradip Harbour", coordinates: "20.26°N, 86.67°E", intent: ["pfz", "ocean_telemetry"] },
            citations: ["Spatial Geocoder", "Port Registry"],
          },
          {
            id: "trace-demo-2",
            agentId: "ocean_specialist",
            name: "Ocean Specialist",
            role: "MOSDAC SST & Chlorophyll-a Analysis",
            durationMs: 142,
            status: "completed",
            summary: "Extracted SST 29.4°C (+0.8°C thermal anomaly) and Chlorophyll-a 1.82 µg/L. Computed HSI for Indian Mackerel (0.82) and Tuna (0.65).",
            telemetry: { sst: "29.4°C", sstAnomaly: "+0.8°C", chlorophyll: "1.82 µg/L", thermalFront: true },
            citations: ["ISRO MOSDAC Oceansat-3 (Pass 0430 UTC)", "MODIS-Aqua Ocean Color"],
            isLive: true,
          },
          {
            id: "trace-demo-3",
            agentId: "weather_specialist",
            name: "Weather Specialist",
            role: "INCOIS High-Resolution Wave & Wind State",
            durationMs: 98,
            status: "completed",
            summary: "Hs: 2.1m (Moderate to Rough), Wind: 18.5 kts ENE, Squall probability: 12.0%. Cyclone Watch: Amber Advisory.",
            telemetry: { hs: "2.1 m", wind: "18.5 kts ENE", period: "8.4 s", squall: "12%" },
            citations: ["INCOIS High-Resolution Wave Forecast System (OSF Bulletin)"],
            isLive: true,
          },
          {
            id: "trace-demo-4",
            agentId: "risk_specialist",
            name: "Risk Specialist",
            role: "Sea-Venture Hydrodynamic & Sanctuary Geofence",
            durationMs: 45,
            status: "completed",
            summary: "Sea-Venture Index: 29.35/100 (Elevated vigilance for craft <8m). Gahirmatha MPA: 9.2 NM NE (<12 NM buffer active).",
            telemetry: { safetyIndex: "29.35 / 100", mpaDistance: "9.2 NM (Buffer Alert)", imblDistance: "18.4 NM" },
            citations: ["Sea-Venture Hydrodynamic Matrix", "PostGIS Turtle Buffer Layer"],
          },
          {
            id: "trace-demo-5",
            agentId: "synthesizer",
            name: "Synthesizer Agent",
            role: "Strict Anti-Hallucination Grounding",
            durationMs: 165,
            status: "completed",
            summary: "Grounding verified against numerical telemetry. Generated species HSI matrix, directional vectors, and Mermaid collaboration DAG.",
            citations: ["Grounded Advisory Engine (Zero-Hallucination Certified)"],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Sea-Venture Hydrodynamic Safety Index",
    createdAt: "2 hours ago",
    model: "ORCA Multi-Agent (LangGraph)",
    statusDotColor: "bg-teal-400",
    messages: [
      {
        id: "msg-2-1",
        role: "user",
        content: "Is it safe to venture into the sea tomorrow morning for a small motorized fishing boat (<8m)?",
        timestamp: "4:20 PM",
      },
      {
        id: "msg-2-2",
        role: "assistant",
        content: `### 🌊 Hydrodynamic Safety Advisory & Sea-Venture Index
**Corridor**: Paradip Harbour to Haldia Port (Zone 4)  
**Vessel Classification**: Small Artisanal Motorized Craft ($<8\\text{m}$)  
**Forecast Period**: Tomorrow 04:00 – 12:00 UTC

#### Sea-Venture Safety Index Formulation (SIH26176):
$$\\text{Safety Index} = 100 - \\left(w_1 \\cdot H_s + w_2 \\cdot W + w_3 \\cdot L\\right) - \\text{Penalty}_{\\text{vessel}}$$

Where calibrated weights for craft $<8\\text{m}$:
- $H_s = 2.1\\,\\text{m}$ (Significant Wave Height, weight $w_1 = 18.5$)
- $W = 18.5\\,\\text{knots}$ (Sustained Wind Speed, weight $w_2 = 1.2$)
- $L = 12.0\\%$ (Squall / Lightning Probability, weight $w_3 = 0.8$)
- **Calculated Index**: $\\mathbf{29.35 / 100}$ (Condition: **Hazardous**)

| Environmental Parameter | INCOIS Observed Value | Threshold for $<8\\text{m}$ Craft | Advisory Status |
| :--- | :--- | :--- | :--- |
| **Wave Height ($H_s$)** | $2.1\\,\\text{m}$ (Rough Sea State 3) | Maximum $1.5\\,\\text{m}$ | ⚠️ **Exceeded** |
| **Peak Wave Period** | $8.4\\,\\text{s}$ | $>6.0\\,\\text{s}$ | Acceptable |
| **Wind Gusts** | $26.0\\,\\text{knots}$ | Maximum $20.0\\,\\text{knots}$ | ⚠️ **Exceeded** |

**Official Recommendation**: Small motorized craft ($<8\\text{m}$) are strictly advised to **delay departure** until the sea state calms after 12:00 UTC.

---
**Source:** INCOIS High-Resolution Wave Forecast System (OSF Bulletin #20260906-04) | **Grounded Advisory Verified**`,
        timestamp: "4:22 PM",
        modelUsed: "ORCA Multi-Agent (LangGraph)",
      },
    ],
  },
  {
    id: "3",
    title: "INCOIS High Wave & Cyclone Warning",
    createdAt: "Yesterday",
    model: "ORCA Multi-Agent (LangGraph)",
    statusDotColor: "bg-amber-400",
    messages: [
      {
        id: "msg-3-1",
        role: "user",
        content: "Are there any lightning or cyclone alerts near Dhamra Port and Digha Coast?",
        timestamp: "Yesterday",
      },
      {
        id: "msg-3-2",
        role: "assistant",
        content: `### ⚠️ Synoptic Weather Alert: Condition Amber
**Area of Vigilance**: North Bay of Bengal (Dhamra Port, Chandipur, and Digha Coast)  
**Warning Issued**: 2026-09-06 12:00 UTC by IMD & INCOIS

#### Real-time Synoptic Vector Artifact:`,
        timestamp: "Yesterday",
        modelUsed: "ORCA Multi-Agent (LangGraph)",
        artifact: {
          id: "art-cyclone-vector",
          title: "Dhamra_Digha_Synoptic_Vector.json",
          type: "data",
          language: "json",
          subtitle: "Zone 4 Coastal Hazard Matrix",
          content: `{
  "corridor": "Dhamra Port to Digha Coast",
  "zone": "Marine Zone 4",
  "synoptic_forecast": {
    "wind_speed_knots": 22.4,
    "gust_knots": 31.0,
    "wave_height_meters": 2.6,
    "barometric_pressure_hpa": 1002.4,
    "lightning_strike_index": "High (Level 3)"
  },
  "safety_status": {
    "condition": "Condition Amber (Advisory)",
    "action_required": "Small craft remain in harbor",
    "monitored_stations": ["Dhamra", "Chandipur", "Digha"]
  }
}`,
        },
      },
    ],
  },
  {
    id: "4",
    title: "IMBL & Gahirmatha Sanctuary Geofencing",
    createdAt: "2 days ago",
    model: "ORCA Multi-Agent (LangGraph)",
    statusDotColor: "bg-cyan-400",
    messages: [
      {
        id: "msg-4-1",
        role: "user",
        content: "Which fishing zones should be avoided due to international maritime boundaries or sanctuary restrictions?",
        timestamp: "2 days ago",
      },
      {
        id: "msg-4-2",
        role: "assistant",
        content: `### 🛡️ Maritime Geofencing & Protected Areas Report
**Vessel Navigation System · PostGIS Geofence Engine**

The following maritime zones are currently active with operational restrictions:

#### 1. Gahirmatha Marine Sanctuary (MPA)
- **Status**: **Strict No-Take & Restricted Navigation Zone**
- **Distance from Paradip**: $9.2\\,\\text{NM}$ North-East
- **Restriction**: Marine Protected Area for Olive Ridley Sea Turtle conservation. All motorized trawling prohibited within the $12\\,\\text{NM}$ buffer zone.
- **Geofence Action**: ⚠️ Proximity alert triggered if course heading enters $20.7^\\circ\\text{N}, 87.0^\\circ\\text{E}$.

#### 2. International Maritime Boundary Line (IMBL)
- **Status**: **Sovereign Border Guard Zone**
- **Distance from Current Position**: $18.4\\,\\text{NM}$ East
- **Warning Threshold**: Automated audible beacon fires at $5.0\\,\\text{NM}$ from boundary.

---
**Source:** PostGIS Marine Geofence Engine & Indian Coast Guard Advisory | **Verified Boundary Layer**`,
        timestamp: "2 days ago",
        modelUsed: "ORCA Multi-Agent (LangGraph)",
      },
    ],
  },
];
