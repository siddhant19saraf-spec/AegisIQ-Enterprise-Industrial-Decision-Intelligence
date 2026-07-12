import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_digital_twin_overview(client: AsyncClient):
    """Overview returns aggregate digital twin data."""
    await client.post("/api/v1/assets", json={"name": "Pump", "type": "pump", "status": "operational", "location": "Building A"})
    await client.post("/api/v1/assets", json={"name": "Turbine", "type": "turbine", "status": "critical", "location": "Building B"})
    await client.post("/api/v1/assets", json={"name": "Sensor", "type": "sensor", "status": "operational", "location": "Building A"})

    response = await client.get("/api/v1/digital-twin/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_assets"] >= 3
    assert data["total_facilities"] >= 1
    assert data["total_nodes"] >= 3
    assert "average_health" in data
    assert "facilities" in data


@pytest.mark.asyncio
async def test_digital_twin_facilities(client: AsyncClient):
    """Facilities list groups assets by location."""
    await client.post("/api/v1/assets", json={"name": "A1", "type": "pump", "status": "operational", "location": "Zone-1"})
    await client.post("/api/v1/assets", json={"name": "A2", "type": "valve", "status": "critical", "location": "Zone-1"})
    await client.post("/api/v1/assets", json={"name": "B1", "type": "motor", "status": "operational", "location": "Zone-2"})

    response = await client.get("/api/v1/digital-twin/facilities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

    zone1 = next(f for f in data if f["name"] == "Zone-1")
    assert zone1["asset_count"] >= 2
    assert zone1["critical_count"] >= 1
    assert "health_score" in zone1
    assert "risk_score" in zone1
    assert "active_incident_count" in zone1


@pytest.mark.asyncio
async def test_digital_twin_facility_detail(client: AsyncClient):
    """Facility detail returns topology (nodes + edges)."""
    parent_resp = await client.post("/api/v1/assets", json={"name": "Parent", "type": "controller", "status": "operational", "location": "Factory-1"})
    parent_id = parent_resp.json()["id"]

    # Create child linked to parent
    await client.post("/api/v1/assets", json={"name": "Child", "type": "sensor", "status": "operational", "location": "Factory-1", "parent_id": parent_id})

    response = await client.get("/api/v1/digital-twin/facilities/factory-1")
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) >= 2
    assert len(data["edges"]) >= 1


@pytest.mark.asyncio
async def test_digital_twin_facility_not_found(client: AsyncClient):
    """Non-existent facility returns 404."""
    response = await client.get("/api/v1/digital-twin/facilities/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_digital_twin_assets(client: AsyncClient):
    """Asset topology returns all nodes with risk/health data."""
    await client.post("/api/v1/assets", json={"name": "Pump-A", "type": "pump", "status": "operational"})
    await client.post("/api/v1/assets", json={"name": "Pump-B", "type": "pump", "status": "critical"})

    response = await client.get("/api/v1/digital-twin/assets")
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) >= 2

    for node in data["nodes"]:
        assert "id" in node
        assert "label" in node
        assert "health_score" in node
        assert "risk_score" in node
        assert "risk_level" in node
        assert "active_incidents" in node


@pytest.mark.asyncio
async def test_digital_twin_node_properties(client: AsyncClient):
    """DT nodes include proper health, risk, and status fields."""
    await client.post("/api/v1/assets", json={"name": "Critical Motor", "type": "motor", "status": "critical"})
    await client.post("/api/v1/assets", json={"name": "Healthy Pump", "type": "pump", "status": "operational"})

    response = await client.get("/api/v1/digital-twin/assets")
    data = response.json()

    for node in data["nodes"]:
        assert 0 <= node["health_score"] <= 100
        assert 0 <= node["risk_score"] <= 100
        assert node["risk_level"] in ("critical", "high", "medium", "low")
        assert isinstance(node["active_incidents"], int)
        assert isinstance(node["children_count"], int)
        assert isinstance(node["incident_severities"], list)
        assert isinstance(node["maintenance_due"], bool)
