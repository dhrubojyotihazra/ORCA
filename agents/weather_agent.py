"""
ORCA Weather Specialist Agent Module.
Integrates live INCOIS ASCAT wind, Open-Meteo wave forecasts,
and evaluates marine weather hazard conditions.
"""

from typing import Dict, Any
from agents.state import AgentState
from agents.specialists import weather_specialist_node

# Canonical node reference for LangGraph DAG
weather_node = weather_specialist_node
