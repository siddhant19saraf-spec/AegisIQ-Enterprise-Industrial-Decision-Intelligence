from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.asset import Asset
from app.models.incident import Incident

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/decisions", tags=["decisions"])


@router.get("/recommendations")
async def get_recommendations(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Generate explainable recommendations based on enterprise data."""
    recommendations = []

    # Fetch all assets with their incident counts
    result = await db.execute(
        select(
            Asset.id,
            Asset.name,
            Asset.type,
            Asset.status,
            Asset.location,
            func.count(Incident.id).label("incident_count"),
        )
        .outerjoin(Incident, Incident.asset_id == Asset.id)
        .group_by(Asset.id)
        .order_by(func.count(Incident.id).desc())
    )
    assets = result.all()

    for asset in assets:
        rec = await _evaluate_asset(asset)
        if rec:
            recommendations.append(rec)

    # Sort by risk level
    risk_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    recommendations.sort(key=lambda r: risk_order.get(r["risk_level"], 99))

    return {
        "recommendations": recommendations,
        "total": len(recommendations),
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@router.get("/recommendations/{asset_id}")
async def get_asset_recommendations(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get recommendations for a specific asset."""
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        return {"error": "Asset not found", "recommendations": []}

    recommendations = []
    rec = await _evaluate_asset((
        asset.id, asset.name, asset.type, asset.status,
        asset.location, 0
    ))
    if rec:
        recommendations.append(rec)

    return {"recommendations": recommendations, "total": len(recommendations)}


async def _evaluate_asset(asset_row: tuple) -> dict[str, Any] | None:
    """Evaluate a single asset and generate recommendations."""
    asset_id, name, asset_type, status, location, incident_count = asset_row

    if status not in ("critical", "offline", "maintenance", "warning") and incident_count == 0:
        return None

    summary_parts = []
    explanation_parts = []
    evidence = []
    actions = []
    risk_score = 0.0
    risk_level = "low"

    if status == "critical":
        risk_score = 0.9
        risk_level = "critical"
        summary_parts.append(f"**{name}** is in critical condition")
        explanation_parts.append(
            "The asset is currently reporting a critical status. "
            "Immediate intervention is required to prevent operational impact."
        )
        evidence.append(f"Asset status: {status}")
        evidence.append(f"Asset type: {asset_type}")
        evidence.append(f"Location: {location or 'N/A'}")
        actions.append("Initiate emergency inspection immediately")
        actions.append("Check for safety hazards before approaching")
        actions.append("Document all findings in the incident system")

    elif status == "offline":
        risk_score = 0.7
        risk_level = "high"
        summary_parts.append(f"**{name}** is offline")
        explanation_parts.append(
            "The asset has been disconnected from the monitoring system. "
            "This may indicate a power failure, network issue, or planned shutdown."
        )
        evidence.append(f"Asset status: {status}")
        evidence.append(f"Asset type: {asset_type}")
        actions.append("Verify power supply and network connectivity")
        actions.append("Check for scheduled maintenance windows")
        actions.append("Dispatch technician for on-site inspection")

    elif status == "maintenance":
        risk_score = 0.5
        risk_level = "medium"
        summary_parts.append(f"**{name}** is under maintenance")
        explanation_parts.append(
            "Routine maintenance is in progress. Operations may be affected "
            "depending on the maintenance scope and duration."
        )
        evidence.append(f"Asset status: {status}")
        evidence.append(f"Asset type: {asset_type}")
        actions.append("Monitor maintenance progress")
        actions.append("Verify maintenance completion checklist")
        actions.append("Schedule validation testing after maintenance")

    elif incident_count > 0:
        risk_score = min(0.3 + (incident_count * 0.1), 0.8)
        risk_level = "high" if risk_score >= 0.7 else "medium" if risk_score >= 0.4 else "low"
        summary_parts.append(f"**{name}** has {incident_count} associated incidents")
        explanation_parts.append(
            f"The asset has been involved in {incident_count} incident(s). "
            f"Multiple incidents may indicate underlying issues requiring investigation."
        )
        evidence.append(f"Associated incidents: {incident_count}")
        evidence.append(f"Current status: {status}")
        actions.append("Investigate root cause of recurring incidents")
        actions.append("Review maintenance history for patterns")
        actions.append("Consider proactive replacement if failure rate is high")

    if status == "warning":
        risk_score = max(risk_score, 0.4)
        risk_level = "medium" if risk_level == "low" else risk_level
        summary_parts.append(f"**{name}** is in warning state")
        explanation_parts.append(
            "The asset is exhibiting warning signals that may precede a failure. "
            "Preventive action is recommended."
        )
        evidence.append(f"Asset status: {status}")
        if "Preventive" not in str(actions):
            actions.append("Perform diagnostic checks on warning indicators")

    if not summary_parts:
        return None

    return {
        "asset_id": str(asset_id),
        "asset_name": name,
        "asset_type": asset_type,
        "summary": " — ".join(summary_parts),
        "explanation": " ".join(explanation_parts),
        "evidence": evidence,
        "recommended_actions": actions,
        "risk_score": round(risk_score, 2),
        "risk_level": risk_level,
        "confidence": round(min(0.5 + risk_score * 0.5, 0.95), 2),
    }
