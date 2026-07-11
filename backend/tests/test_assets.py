import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_asset(client: AsyncClient):
    response = await client.post("/api/v1/assets", json={
        "name": "Turbine #7",
        "type": "turbine",
        "status": "operational",
        "location": "Building A",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Turbine #7"
    assert data["status"] == "operational"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_assets(client: AsyncClient):
    await client.post("/api/v1/assets", json={"name": "A1", "type": "pump"})
    await client.post("/api/v1/assets", json={"name": "A2", "type": "valve"})
    response = await client.get("/api/v1/assets")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_get_asset(client: AsyncClient):
    created = await client.post("/api/v1/assets", json={"name": "Test", "type": "sensor"})
    cid = created.json()["id"]
    response = await client.get(f"/api/v1/assets/{cid}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test"


@pytest.mark.asyncio
async def test_update_asset(client: AsyncClient):
    created = await client.post("/api/v1/assets", json={"name": "Old", "type": "compressor"})
    cid = created.json()["id"]
    response = await client.patch(f"/api/v1/assets/{cid}", json={"name": "New"})
    assert response.status_code == 200
    assert response.json()["name"] == "New"


@pytest.mark.asyncio
async def test_delete_asset(client: AsyncClient):
    created = await client.post("/api/v1/assets", json={"name": "Gone", "type": "pump"})
    cid = created.json()["id"]
    response = await client.delete(f"/api/v1/assets/{cid}")
    assert response.status_code == 200
    get_resp = await client.get(f"/api/v1/assets/{cid}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_filter_assets_by_status(client: AsyncClient):
    await client.post("/api/v1/assets", json={"name": "A", "type": "pump", "status": "critical"})
    await client.post("/api/v1/assets", json={"name": "B", "type": "pump", "status": "operational"})
    response = await client.get("/api/v1/assets?status=critical")
    assert response.status_code == 200
    items = response.json()["items"]
    assert all(i["status"] == "critical" for i in items)


@pytest.mark.asyncio
async def test_search_assets(client: AsyncClient):
    await client.post("/api/v1/assets", json={"name": "Compressor X200", "type": "compressor"})
    await client.post("/api/v1/assets", json={"name": "Pump Y100", "type": "pump"})
    response = await client.get("/api/v1/assets?search=Compressor")
    assert response.status_code == 200
    items = response.json()["items"]
    assert any("Compressor" in i["name"] for i in items)
