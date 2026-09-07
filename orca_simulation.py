"""
ORCA: Marine EcOsystem Reasoning with Collaborative Agents.

This module implements a basic multi-agent simulation skeleton for monitoring
and managing a marine ecosystem. It features collaborating agents (Sensor, Analysis,
and Action agents) that interact with a simulated ocean environment.
"""

import time
import random
from typing import Dict, Any, List

class Agent:
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role

    def log(self, message: str):
        print(f"[{self.role.upper()} - {self.name}]: {message}")


class SensorAgent(Agent):
    """
    Collects environmental data from the ecosystem.
    """
    def __init__(self, name: str):
        super().__init__(name, "Sensor")

    def collect_data(self, environment: 'EcosystemEnvironment') -> Dict[str, float]:
        self.log("Retrieving environmental telemetry from active probes...")
        telemetry = environment.get_telemetry()
        self.log(f"Telemetry collected: {telemetry}")
        return telemetry


class AnalysisAgent(Agent):
    """
    Analyzes environmental metrics to identify anomalies or ecological threats.
    """
    def __init__(self, name: str):
        super().__init__(name, "Analysis")

    def analyze(self, telemetry: Dict[str, float]) -> List[str]:
        self.log("Analyzing telemetry for ecological anomalies...")
        anomalies = []
        
        # Check Temperature
        temp = telemetry.get("temperature", 20.0)
        if temp > 28.0:
            anomalies.append("Extreme Heatwave (Potential Coral Bleaching Alert)")
        elif temp < 10.0:
            anomalies.append("Abnormally Low Temperature")

        # Check pH (Ocean Acidification)
        ph = telemetry.get("pH", 8.1)
        if ph < 7.8:
            anomalies.append("Ocean Acidification (Threat to calcifying organisms)")
        
        # Check Dissolved Oxygen (Hypoxia)
        do = telemetry.get("dissolved_oxygen", 6.0)
        if do < 4.0:
            anomalies.append("Hypoxia / Low Oxygen Level (Dead zone risk)")

        if anomalies:
            self.log(f"ALERT: Detected {len(anomalies)} critical anomaly/anomalies: {anomalies}")
        else:
            self.log("Telemetry normal. No immediate environmental threats detected.")
            
        return anomalies


class ActionAgent(Agent):
    """
    Recommends or triggers ecological conservation responses.
    """
    def __init__(self, name: str):
        super().__init__(name, "Action")

    def recommend_actions(self, anomalies: List[str]) -> List[str]:
        if not anomalies:
            self.log("No anomalies detected. Action: Maintain baseline monitoring.")
            return ["Baseline Monitoring"]

        self.log("Formulating mitigation strategies for detected anomalies...")
        actions = []
        for anomaly in anomalies:
            if "Bleaching" in anomaly or "Heatwave" in anomaly:
                actions.append("Deploy marine shade cloths & initiate local thermal stress alerts.")
            if "Acidification" in anomaly:
                actions.append("Deploy localized alkaline dispersal & restrict kelp harvesting (natural buffer).")
            if "Hypoxia" in anomaly:
                actions.append("Restrict agricultural runoff influx & activate artificial aeration systems.")

        for act in actions:
            self.log(f"RECOMMENDED MITIGATION: {act}")
        return actions


class EcosystemEnvironment:
    """
    Simulates the state of a marine ecosystem over time.
    """
    def __init__(self, name: str):
        self.name = name
        # Base healthy stats
        self.state = {
            "temperature": 21.0,
            "pH": 8.1,
            "dissolved_oxygen": 6.5
        }
        self.tick_count = 0

    def tick(self):
        """
        Advance the environment simulation by one time step, introducing random variations
        and occasionally an environmental shock.
        """
        self.tick_count += 1
        # Random walking variation
        self.state["temperature"] += random.uniform(-0.5, 0.5)
        self.state["pH"] += random.uniform(-0.05, 0.05)
        self.state["dissolved_oxygen"] += random.uniform(-0.2, 0.2)

        # Trigger simulated events at specific cycles
        if self.tick_count == 3:
            # Heatwave shock
            self.state["temperature"] = 29.5
            print(f"\n~~~ EVENT: A warm ocean current shifts into {self.name} ~~~")
        elif self.tick_count == 6:
            # Acidification shock
            self.state["pH"] = 7.6
            print(f"\n~~~ EVENT: Upwelling of deep, highly acidic waters into {self.name} ~~~")

    def get_telemetry(self) -> Dict[str, float]:
        # Return a copy with values rounded
        return {k: round(v, 2) for k, v in self.state.items()}


def run_simulation(steps: int = 8):
    print("=" * 70)
    print("ORCA: Marine Ecosystem Reasoning with Collaborative Agents Simulation")
    print("=" * 70)

    # Initialize Environment
    env = EcosystemEnvironment("Great Barrier Reef Sector A")

    # Initialize Collaborative Agents
    sensor = SensorAgent("Echo-1")
    analyzer = AnalysisAgent("Apex-Logic")
    action_planner = ActionAgent("Poseidon-Guard")

    for step in range(1, steps + 1):
        print(f"\n--- Simulation Step {step} ---")
        
        # Advance environment
        env.tick()
        
        # 1. Sensor Agent collects data
        telemetry = sensor.collect_data(env)
        
        # 2. Analysis Agent processes telemetry
        anomalies = analyzer.analyze(telemetry)
        
        # 3. Action Agent plans and recommends mitigations
        action_planner.recommend_actions(anomalies)
        
        time.sleep(1)

    print("\n" + "=" * 70)
    print("Simulation Completed successfully.")
    print("=" * 70)


if __name__ == "__main__":
    run_simulation()
