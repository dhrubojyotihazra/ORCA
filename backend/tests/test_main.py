import os
import sys
import pytest

# Ensure root and backend are in sys.path
TEST_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(TEST_DIR, ".."))
ROOT_DIR = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "online"]
    assert "version" in data or "service" in data

from unittest.mock import patch
from app.models.user import AuthTokenResponse

def test_auth_signup_and_me():
    mock_token = AuthTokenResponse(
        access_token="mock-jwt-token-00000000-0000-0000-0000-000000000001",
        token_type="bearer",
        expires_in=3600,
        user_id="00000000-0000-0000-0000-000000000001",
        email="testfisher@orca.ocean"
    )
    with patch("app.services.auth_service.AuthService.signup", return_value=mock_token):
        signup_res = client.post("/api/v1/auth/signup", json={
            "email": "testfisher@orca.ocean",
            "password": "securepassword123",
            "display_name": "Test Captain"
        })
        assert signup_res.status_code == 201
        auth_data = signup_res.json()
        assert "access_token" in auth_data
        token = auth_data["access_token"]

        # Test /me endpoint with Bearer token
        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200

def test_onboarding_and_profile():
    onboarding_payload = {
        "display_name": "Ramesh Kumar",
        "language": "hi",
        "latitude": 20.9,
        "longitude": 70.37,
        "location_name": "Veraval Port",
        "vessel_type": "medium"
    }
    res = client.post("/api/v1/user/onboarding", json=onboarding_payload)
    assert res.status_code == 201
    profile = res.json()
    assert profile["display_name"] == "Ramesh Kumar"
    assert profile["language"] == "hi"

    # Fetch profile
    get_res = client.get("/api/v1/user/profile")
    assert get_res.status_code == 200

def test_chat_flow():
    # 1. Create conversation
    conv_res = client.post("/api/v1/chat/conversations", json={
        "title": "Weather Check",
        "first_message": "Is it safe to fish?"
    })
    assert conv_res.status_code == 201
    conv = conv_res.json()
    conv_id = conv["id"]

    # 2. List conversations
    list_res = client.get("/api/v1/chat/conversations")
    assert list_res.status_code == 200
    assert len(list_res.json()) > 0

    # 3. Send message (non-streaming JSON)
    msg_res = client.post(f"/api/v1/chat/conversations/{conv_id}/messages", json={
        "content": "What is the sea temperature near Veraval?"
    })
    assert msg_res.status_code == 200
    msg = msg_res.json()
    assert msg["role"] == "assistant"
    assert "content" in msg

def test_alerts_and_geofence():
    # Alerts near Veraval
    alerts_res = client.get("/api/v1/alerts?lat=20.9&lon=70.37")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert isinstance(alerts, list)

    # Geofence check inside IMBL bounds
    geo_res = client.post("/api/v1/alerts/geofence-check", json={
        "latitude": 9.5,
        "longitude": 79.5
    })
    assert geo_res.status_code == 200
    geo_data = geo_res.json()
    assert geo_data["in_restricted_zone"] is True
    assert len(geo_data["violations"]) > 0
