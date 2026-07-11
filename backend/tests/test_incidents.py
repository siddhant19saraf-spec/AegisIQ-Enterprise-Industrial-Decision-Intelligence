import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_incident(client: AsyncClient):
    response = await client.post("/api/v1/incidents", json={
        "title": "Overheating detected",
        "severity": "high",
        "status": "open",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Overheating detected"
    assert data["severity"] == "high"


@pytest.mark.asyncio
async def test_list_incidents(client: AsyncClient):
    await client.post("/api/v1/incidents", json={"title": "Incident 1", "severity": "low"})
    await client.post("/api/v1/incidents", json={"title": "Incident 2", "severity": "critical"})
    response = await client.get("/api/v1/incidents")
    assert response.status_code == 200
    assert response.json()["total"] >= 2


@pytest.mark.asyncio
async def test_update_incident_status(client: AsyncClient):
    created = await client.post("/api/v1/incidents", json={"title": "Fix me", "severity": "medium"})
    cid = created.json()["id"]
    response = await client.patch(f"/api/v1/incidents/{cid}", json={"status": "resolved"})
    assert response.status_code == 200
    assert response.json()["status"] == "resolved"


@pytest.mark.asyncio
async def test_filter_incidents_by_severity(client: AsyncClient):
    await client.post("/api/v1/incidents", json={"title": "Critical one", "severity": "critical"})
    await client.post("/api/v1/incidents", json={"title": "Low one", "severity": "low"})
    response = await client.get("/api/v1/incidents?severity=critical")
    assert response.status_code == 200
    items = response.json()["items"]
    assert all(i["severity"] == "critical" for i in items)


@pytest.mark.asyncio
async def test_incident_updates(client: AsyncClient):
    created = await client.post("/api/v1/incidents", json={"title": "With updates", "severity": "high"})
    cid = created.json()["id"]
    update = await client.post(f"/api/v1/incidents/{cid}/updates", json={"message": "Investigating", "update_type": "update"})
    assert update.status_code == 201
    assert update.json()["message"] == "Investigating"
