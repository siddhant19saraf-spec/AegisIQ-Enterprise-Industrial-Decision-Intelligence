import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_sos_without_worker_id(client):
    async with client as ac:
        resp = await ac.post("/api/v1/emergency/sos", json={
            "location": "Mumbai Refinery, Mumbai",
            "description": "Test SOS"
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["ambulance_dispatched"] is True
    assert data["alert_id"] is not None


@pytest.mark.asyncio
async def test_sos_with_worker_id(client):
    async with client as ac:
        resp = await ac.post("/api/v1/emergency/sos", json={
            "worker_id": "2811cbda-aff0-4520-b403-e7f652244652",
            "location": "Mumbai Refinery, Mumbai",
            "description": "Worker fell from height"
        })
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert data["success"] is True
    assert data["ambulance_dispatched"] is True


@pytest.mark.asyncio
async def test_auto_detect(client):
    async with client as ac:
        resp = await ac.get("/api/v1/emergency/auto-detect")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_list_workers(client):
    async with client as ac:
        resp = await ac.get("/api/v1/emergency/workers")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0


@pytest.mark.asyncio
async def test_list_alerts(client):
    async with client as ac:
        resp = await ac.get("/api/v1/emergency/alerts")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_dispatch_ambulance(client):
    async with client as ac:
        sos = await ac.post("/api/v1/emergency/sos", json={"location": "Mumbai"})
        alert_id = sos.json()["alert_id"]
        resp = await ac.post(f"/api/v1/emergency/dispatch-ambulance?alert_id={alert_id}&location=Mumbai")
    assert resp.status_code == 200
    data = resp.json()
    assert data["dispatched"] is True
    assert data["eta_minutes"] > 0


@pytest.mark.asyncio
async def test_worker_checkin(client):
    async with client as ac:
        resp = await ac.post("/api/v1/emergency/workers/check-in", json={
            "worker_id": "2811cbda-aff0-4520-b403-e7f652244652",
            "healthy": True,
            "temperature": 36.6,
            "heart_rate": 72,
        })
    assert resp.status_code == 200
