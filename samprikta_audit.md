# Samprikta -- Agent Development Audit
**Role:** Agent Systems Lead  
**Dossier Focus:** Weather Agent · Ocean Agent · Risk/Geofence Agent · Multilingual NLP Synthesis  
**Today:** 30 August 2026 (End of Week 1, 27 Aug - 2 Sep)

---

## What the Dossier Expects Her to Do (All 5 Weeks)

### Week 1 -- Agent Skeleton & Orchestration Proof
- [ ] Set up the LangGraph project skeleton
- [ ] Define the agent state schema (alongside Dhrubojyoti)
- [ ] Build a "hello world" two-agent chain -- Planner calling one dummy Specialist -- to prove the orchestration pattern works before real data
- **Expected commit:** `agents/` LangGraph skeleton + working dummy two-agent chain + first prompt templates

### Week 2 -- Weather Agent & Ocean Agent (Real Data)
- [ ] Build the **Weather Agent** -- calls Tiyasha's alert data tools, reasons over hazard conditions, returns structured findings
- [ ] Build the **Ocean Agent** -- calls Tiyasha's SST/chlorophyll tools, identifies favourable fishing zones
- **Expected commit:** `agents/weather_agent.py`, `agents/ocean_agent.py`, tested against Tiyasha's real functions

### Week 3 -- Risk/Geofence Agent & Multilingual NLP
- [ ] Build the **Risk/Geofence Agent** using Tiyasha's geofence tools plus weather and ocean context
- [ ] Add language detection (at minimum: Hindi + Bengali + English)
- [ ] Get the Synthesizer Agent responding in the detected language
- **Expected commit:** `agents/risk_agent.py`, multilingual handling in synthesizer, tests in 2+ languages

### Week 4 -- Evaluation, Explainability & Tests
- [ ] Run the full evaluation query set through the agents and tune prompts based on failures
- [ ] Add explainability to the Synthesizer's output -- which specific data justified which specific claim
- [ ] Write basic automated tests for the agent pipeline
- **Expected commit:** `tests/test_agents.py`, prompt refinements, explainability output

### Week 5 -- Final Test Pass & Documentation
- [ ] Final test pass on all 8 sample queries and edge cases
- [ ] Freeze prompt changes ahead of the demo
- [ ] Document known limitations honestly for Q&A prep
- **Expected commit:** final test pass, `docs/known-limitations.md`

---

## What She Has Actually Done (Committed to GitHub)

### ✅ `hello_orca.py`
```python
def main():
    print("Hello ORCA - Marine Ecosystem Reasoning with Collaborative Agents!")
```
A hello world print script. Proves she's set up and pushing to GitHub. No LangGraph involved.

### ✅ `orca_simulation.py` -- Marine Ecosystem Simulation (176 lines)
A standalone OOP Python simulation with three agent classes:
- `SensorAgent` -- collects telemetry (temperature, pH, dissolved oxygen) from a simulated `EcosystemEnvironment`
- `AnalysisAgent` -- checks for heatwave / acidification / hypoxia anomalies
- `ActionAgent` -- recommends mitigation strategies for detected anomalies
- `EcosystemEnvironment` -- random-walk simulation with hardcoded shock events at tick 3 (heatwave) and tick 6 (acidification)

**Assessment:** Good demonstration of agent collaboration logic and correct domain reasoning. However this is a *standalone simulation*, not LangGraph. It uses no real data sources, no shared state schema, and cannot be wired into the ORCA backend.

### ✅ `test_orca.py` -- Pytest Unit Tests (29 lines)
Three tests covering:
- Sensor data collection keys
- Analyser returns 0 anomalies on healthy telemetry
- Analyser correctly flags all 3 anomalies on critical telemetry

**Assessment:** Well-written and correct. Tests pass against `orca_simulation.py`.

### ✅ `requirements.txt`
Contents unknown (not checked), but presumably covers simulation dependencies.

### ✅ `hello.py`
```python
def hello_github():
    print("Hello from TIYASHA-BAIDYA!")
```
This is actually **Tiyasha's** script pushed under Samprikta's commit -- probably a shared test to confirm GitHub access. No action needed.

---

## Honest Gap Analysis

| Dossier Deliverable | Status | Notes |
|---|---|---|
| LangGraph project skeleton | ❌ Not started | All code is plain Python OOP -- no LangGraph import anywhere |
| Agent state schema defined | ❌ Not started | No `TypedDict` / Pydantic schema for shared agent state |
| Planner -> Specialist two-agent chain | ❌ Not started | `orca_simulation.py` is a sequential loop, not a graph |
| First prompt templates | ❌ Not started | No LLM calls, no prompt strings |
| Weather Agent (real data) | ❌ Not started | Week 2 task, but groundwork (LangGraph) missing |
| Ocean Agent (real data) | ❌ Not started | Week 2 task |
| Risk/Geofence Agent | ❌ Not started | Week 3 task |
| Language detection + multilingual synthesis | ❌ Not started | Week 3 task |
| Evaluation pass + explainability | ❌ Not started | Week 4 task |
| `tests/test_agents.py` (LangGraph pipeline tests) | ❌ Not started | `test_orca.py` tests the sim, not the agent graph |
| Standalone simulation prototype | ✅ Done | `orca_simulation.py` -- good domain logic, wrong framework |
| Unit tests for simulation | ✅ Done | `test_orca.py` -- correct and clean |
| GitHub presence confirmed | ✅ Done | Multiple commits on the shared repo |

---

## What She Needs to Do This Week (by 2 Sep)

These are the **Week 1 dossier commits** she still owes, ranked by blocking risk:

### 🔴 P1 -- LangGraph skeleton (blocks everything else)
Install LangGraph and create the skeleton structure:
```
agents/
+-- __init__.py
+-- state.py          <- TypedDict for shared state schema
+-- planner_agent.py  <- stub (just routes to dummy specialist)
+-- dummy_specialist.py
+-- graph.py          <- StateGraph wiring planner -> specialist
```
Without this, neither Dhrubojyoti's Planner nor the Week 2 data integrations have a graph to plug into.

### 🔴 P2 -- Shared state schema
Define the `AgentState` TypedDict that every agent reads and writes. Dhrubojyoti needs to review and agree on this by the end of Week 1. Fields should cover at minimum:
- `query: str`
- `language: str`
- `location: dict` (lat/lon)
- `weather_findings: dict`
- `ocean_findings: dict`
- `risk_findings: dict`
- `final_answer: str`
- `evidence: list[str]`

### 🟡 P3 -- Prompt templates
Even as `.txt` or Python strings in a `prompts/` folder, the first prompt drafts for the Planner and a dummy specialist help the team agree on output format before real data arrives.

---

## What She Can Carry Forward as a Foundation

Her `orca_simulation.py` is **not wasted** -- the domain logic (what constitutes a heatwave, what actions follow acidification) can directly inform:
- The `AnalysisAgent`'s reasoning prompt for the **Ocean Agent**
- The `ActionAgent`'s output schema for the **Risk Agent**

She should treat it as a reference, not production code.

---

## Summary for Dhrubojyoti

Samprikta has confirmed domain understanding and GitHub workflow, and written clean tests -- but the **entire LangGraph layer is missing**. The dossier's Week 1 integration checkpoint ("confirm Tiyasha's data formats match what Samprikta's agent schema expects") cannot happen without a state schema. This is the single most urgent gap.

**Recommendation:** Pair call between Samprikta and Dhrubojyoti this weekend to co-write `agents/state.py` and `agents/graph.py` together, so Week 2 can start on solid ground.
