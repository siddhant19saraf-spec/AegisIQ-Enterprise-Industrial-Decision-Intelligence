import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_risk_overview(client: AsyncClient):
    """Risk overview returns summary aggregates."""
    # Create assets with different statuses
    await client.post("/api/v1/assets", json={"name": "Healthy Pump", "type": "pump", "status": "operational"})
    await client.post("/api/v1/assets", json={"name": "Critical Turbine", "type": "turbine", "status": "critical"})
    await client.post("/api/v1/assets", json={"name": "Offline Compressor", "type": "compressor", "status": "offline"})

    response = await client.get("/api/v1/risk/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_assets"] >= 3
    assert "average_risk" in data
    assert "average_health" in data
    assert "at_risk_count" in data
    assert "risk_level_distribution" in data
    assert "health_distribution" in data


@pytest.mark.asyncio
async def test_risk_all_assets(client: AsyncClient):
    """List all assets with full risk predictions."""
    await client.post("/api/v1/assets", json={"name": "Pump A", "type": "pump", "status": "operational", "location": "Building 1"})
    await client.post("/api/v1/assets", json={"name": "Turbine B", "type": "turbine", "status": "maintenance", "location": "Building 2"})

    response = await client.get("/api/v1/risk/assets")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["assets"]) >= 2
    assert data["overview"] is not None

    asset = data["assets"][0]
    assert "asset_id" in asset
    assert "asset_name" in asset
    assert "risk_score" in asset
    assert "risk_level" in asset
    assert "failure_probability" in asset
    assert "incident_probability" in asset
    assert "maintenance_priority" in asset
    assert "compliance_risk" in asset
    assert "overall_health" in asset
    assert "confidence" in asset
    assert "contributing_factors" in asset
    assert "positive_factors" in asset
    assert "negative_factors" in asset
    assert "supporting_evidence" in asset
    assert "suggested_actions" in asset


@pytest.mark.asyncio
async def test_risk_single_asset(client: AsyncClient):
    """Get risk prediction for a single asset."""
    created = await client.post("/api/v1/assets", json={"name": "Sensor X1", "type": "sensor", "status": "operational"})
    asset_id = created.json()["id"]

    response = await client.get(f"/api/v1/risk/assets/{asset_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["asset_id"] == asset_id
    assert data["asset_name"] == "Sensor X1"
    assert data["risk_level"] == "low"


@pytest.mark.asyncio
async def test_risk_single_asset_not_found(client: AsyncClient):
    """Risk prediction for non-existent asset returns 404."""
    response = await client.get("/api/v1/risk/assets/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
    assert response.json()["detail"] == "Asset not found"


@pytest.mark.asyncio
async def test_risk_with_incidents(client: AsyncClient):
    """Assets with active critical incidents have higher risk."""
    # Create asset
    created = await client.post("/api/v1/assets", json={"name": "Troubled Engine", "type": "generator", "status": "critical"})
    asset_id = created.json()["id"]

    # Create a critical incident on it
    await client.post("/api/v1/incidents", json={
        "title": "Overheating",
        "severity": "critical",
        "status": "open",
        "asset_id": asset_id,
    })

    response = await client.get(f"/api/v1/risk/assets/{asset_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] in ("critical", "high")
    assert data["risk_score"] > 30


@pytest.mark.asyncio
async def test_risk_scores_in_range(client: AsyncClient):
    """All score fields should be within 0-100 range."""
    await client.post("/api/v1/assets", json={"name": "Valve Z1", "type": "valve", "status": "maintenance"})
    await client.post("/api/v1/assets", json={"name": "Controller C1", "type": "controller", "status": "operational"})

    response = await client.get("/api/v1/risk/assets")
    assert response.status_code == 200
    data = response.json()

    for asset in data["assets"]:
        for field in ("risk_score", "failure_probability", "incident_probability",
                       "maintenance_priority", "compliance_risk", "overall_health", "confidence"):
            assert 0 <= asset[field] <= 100, f"{field} out of range: {asset[field]}"


@pytest.mark.asyncio
async def test_risk_level_mapping(client: AsyncClient):
    """Risk levels should be one of the valid values."""
    await client.post("/api/v1/assets", json={"name": "Transformer T1", "type": "transformer", "status": "operational"})

    response = await client.get("/api/v1/risk/assets")
    data = response.json()

    valid_levels = {"critical", "high", "medium", "low"}
    for asset in data["assets"]:
        assert asset["risk_level"] in valid_levels


@pytest.mark.asyncio
async def test_risk_contributing_factors_structure(client: AsyncClient):
    """Each contributing factor should have required fields."""
    await client.post("/api/v1/assets", json={"name": "Motor M1", "type": "motor", "status": "warning"})

    response = await client.get("/api/v1/risk/assets")
    data = response.json()

    for asset in data["assets"]:
        for factor in asset["contributing_factors"]:
            assert "name" in factor
            assert "impact" in factor
            assert -1.0 <= factor["impact"] <= 1.0
            assert "description" in factor
            assert factor["type"] in ("positive", "negative", "neutral")


@pytest.mark.asyncio
async def test_risk_suggested_actions_non_empty(client: AsyncClient):
    """Suggested actions should not be empty."""
    await client.post("/api/v1/assets", json={"name": "Critical Pump", "type": "pump", "status": "critical"})

    response = await client.get("/api/v1/risk/assets")
    data = response.json()

    for asset in data["assets"]:
        assert len(asset["suggested_actions"]) > 0


@pytest.mark.asyncio
async def test_risk_confidence_increases_with_data(client: AsyncClient):
    """Confidence should be higher for assets with incident data."""
    # Asset with no incidents
    resp_a = await client.post("/api/v1/assets", json={"name": "Base Asset", "type": "sensor", "status": "operational"})
    id_a = resp_a.json()["id"]

    # Asset with incidents + updates
    resp_b = await client.post("/api/v1/assets", json={"name": "Data Rich Asset", "type": "sensor", "status": "operational"})
    id_b = resp_b.json()["id"]

    # Create incident + update for asset B
    inc_resp = await client.post("/api/v1/incidents", json={
        "title": "Minor alert",
        "severity": "low",
        "status": "resolved",
        "asset_id": id_b,
    })
    inc_id = inc_resp.json()["id"]
    await client.post(f"/api/v1/incidents/{inc_id}/updates", json={"message": "Investigated and resolved"})

    resp_a_detail = await client.get(f"/api/v1/risk/assets/{id_a}")
    resp_b_detail = await client.get(f"/api/v1/risk/assets/{id_b}")

    assert resp_b_detail.json()["confidence"] >= resp_a_detail.json()["confidence"]
