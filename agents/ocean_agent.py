"""
ORCA Ocean Analytics Specialist Agent Module.
Integrates live INCOIS ARGO SST, MOSDAC Oceansat-3 satellite telemetry,
and computes Species Habitat Suitability Index (HSI) for marine pelagics.
"""

from typing import Dict, Any
from agents.state import AgentState
from agents.specialists import ocean_specialist_node

# Canonical node reference for LangGraph DAG
ocean_node = ocean_specialist_node
