from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.asset import Asset
from app.models.incident import Incident

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/risk/predictive", tags=["risk"])


@router.get("/")
async def get_predictive_risk(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Predictive risk assessment across all assets."""
    result = await db.execute(select(Asset))
    assets = result.scalars().all()

    result = await db.execute(
        select(Incident).where(Incident.status.in_(["open", "investigating"]))
    )
    active_incidents = result.scalars().all()

    asset_risks = []
    for asset in assets:
        asset_incidents = [i for i in active_incidents if i.asset_id == asset.id]
        base_risk = {"critical": 0.9, "offline": 0.7, "maintenance": 0.5, "warning": 0.3, "operational": 0.1}.get(
            asset.status, 0.1
        )
        incident_factor = min(len(asset_incidents) * 0.15, 0.6)
        risk_score = min(base_risk + incident_factor, 1.0)

        if risk_score >= 0.7:
            trend = "increasing"
        elif risk_score >= 0.4:
            trend = "stable"
        else:
            trend = "decreasing"

        asset_risks.append({
            "asset_id": str(asset.id),
            "asset_name": asset.name,
            "asset_type": asset.type,
            "asset_status": asset.status,
            "risk_score": round(risk_score, 2),
            "risk_level": "critical" if risk_score >= 0.7 else "high" if risk_score >= 0.4 else "medium" if risk_score >= 0.2 else "low",
            "incident_count": len(asset_incidents),
            "trend": trend,
        })

    asset_risks.sort(key=lambda r: r["risk_score"], reverse=True)

    total_risk = sum(r["risk_score"] for r in asset_risks)
    avg_risk = total_risk / len(asset_risks) if asset_risks else 0

    return {
        "asset_risks": asset_risks,
        "summary": {
            "total_assets": len(asset_risks),
            "average_risk": round(avg_risk, 2),
            "critical_count": sum(1 for r in asset_risks if r["risk_level"] == "critical"),
            "high_count": sum(1 for r in asset_risks if r["risk_level"] == "high"),
            "medium_count": sum(1 for r in asset_risks if r["risk_level"] == "medium"),
            "low_count": sum(1 for r in asset_risks if r["risk_level"] == "low"),
            "increasing_trend": sum(1 for r in asset_risks if r["trend"] == "increasing"),
            "decreasing_trend": sum(1 for r in asset_risks if r["trend"] == "decreasing"),
        },
    }


@router.get("/{asset_id}")
async def get_asset_predictive_risk(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Predictive risk for a specific asset."""
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        return {"error": "Asset not found"}

    result = await db.execute(
        select(Incident).where(
            Incident.asset_id == asset_id,
            Incident.status.in_(["open", "investigating"]),
        )
    )
    incidents = result.scalars().all()

    base_risk = {"critical": 0.9, "offline": 0.7, "maintenance": 0.5, "warning": 0.3, "operational": 0.1}.get(
        asset.status, 0.1
    )
    incident_factor = min(len(incidents) * 0.15, 0.6)
    risk_score = min(base_risk + incident_factor, 1.0)

    return {
        "asset_id": str(asset.id),
        "asset_name": asset.name,
        "asset_type": asset.type,
        "asset_status": asset.status,
        "risk_score": round(risk_score, 2),
        "risk_level": "critical" if risk_score >= 0.7 else "high" if risk_score >= 0.4 else "medium" if risk_score >= 0.2 else "low",
        "incident_count": len(incidents),
        "factors": {
            "base_risk": base_risk,
            "incident_factor": incident_factor,
        },
    }
