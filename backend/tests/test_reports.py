import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_report(client: AsyncClient):
    response = await client.post("/api/v1/reports", json={
        "name": "Weekly Summary",
        "type": "summary",
        "config": {"period": "weekly"},
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Weekly Summary"


@pytest.mark.asyncio
async def test_list_reports(client: AsyncClient):
    await client.post("/api/v1/reports", json={"name": "R1", "type": "summary"})
    await client.post("/api/v1/reports", json={"name": "R2", "type": "detailed"})
    response = await client.get("/api/v1/reports")
    assert response.status_code == 200
    assert response.json()["total"] >= 2
