import pytest
from orca_simulation import AnalysisAgent, EcosystemEnvironment, SensorAgent

def test_sensor_agent_collection():
    env = EcosystemEnvironment("Test Ecosystem")
    sensor = SensorAgent("Test Sensor")
    telemetry = sensor.collect_data(env)
    
    assert "temperature" in telemetry
    assert "pH" in telemetry
    assert "dissolved_oxygen" in telemetry

def test_analysis_agent_normal():
    analyzer = AnalysisAgent("Test Analyzer")
    telemetry = {"temperature": 21.0, "pH": 8.1, "dissolved_oxygen": 6.5}
    anomalies = analyzer.analyze(telemetry)
    assert len(anomalies) == 0

def test_analysis_agent_anomalies():
    analyzer = AnalysisAgent("Test Analyzer")
    # Warm temperature, acidic, low oxygen
    telemetry = {"temperature": 29.5, "pH": 7.6, "dissolved_oxygen": 3.5}
    anomalies = analyzer.analyze(telemetry)
    
    assert len(anomalies) == 3
    assert any("Heatwave" in anomaly for anomaly in anomalies)
    assert any("Acidification" in anomaly for anomaly in anomalies)
    assert any("Hypoxia" in anomaly for anomaly in anomalies)
