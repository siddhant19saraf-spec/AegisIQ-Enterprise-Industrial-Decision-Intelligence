import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_notification(client: AsyncClient):
    response = await client.post("/api/v1/notifications", json={
        "type": "warning",
        "title": "High temperature",
        "body": "Temp exceeds threshold",
    })
    assert response.status_code == 201
    assert response.json()["title"] == "High temperature"


@pytest.mark.asyncio
async def test_list_notifications(client: AsyncClient):
    await client.post("/api/v1/notifications", json={"type": "info", "title": "N1"})
    await client.post("/api/v1/notifications", json={"type": "alert", "title": "N2"})
    response = await client.get("/api/v1/notifications")
    assert response.status_code == 200
    assert response.json()["total"] >= 2
