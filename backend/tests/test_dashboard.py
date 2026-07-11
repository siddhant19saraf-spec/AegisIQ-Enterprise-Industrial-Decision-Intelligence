import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_summary(client: AsyncClient):
    await client.post("/api/v1/assets", json={"name": "D1", "type": "pump"})
    await client.post("/api/v1/incidents", json={"title": "I1", "severity": "high"})
    response = await client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_assets" in data
    assert "active_incidents" in data
    assert "uptime_rate" in data
