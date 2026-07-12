from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.asset import Asset
from app.models.incident import Incident

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
async def analytics_summary(db: AsyncSession = Depends(get_db)):
    # Asset stats
    asset_total = (await db.execute(select(func.count(Asset.id)))).scalar() or 0
    asset_by_status = {}
    for status, count in (await db.execute(
        select(Asset.status, func.count(Asset.id)).group_by(Asset.status)
    )).all():
        asset_by_status[status] = count

    asset_by_type = {}
    for typ, count in (await db.execute(
        select(Asset.type, func.count(Asset.id)).group_by(Asset.type)
    )).all():
        asset_by_type[typ] = count

    asset_by_location = {}
    for loc, count in (await db.execute(
        select(Asset.location, func.count(Asset.id)).group_by(Asset.location)
    )).all():
        asset_by_location[loc or "Unknown"] = count

    # Incident stats
    inc_total = (await db.execute(select(func.count(Incident.id)))).scalar() or 0
    inc_by_severity = {}
    for sev, count in (await db.execute(
        select(Incident.severity, func.count(Incident.id)).group_by(Incident.severity)
    )).all():
        inc_by_severity[sev] = count

    inc_by_status = {}
    for status, count in (await db.execute(
        select(Incident.status, func.count(Incident.id)).group_by(Incident.status)
    )).all():
        inc_by_status[status] = count

    # Risk distribution
    risk_ranges = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for risk_score in (await db.execute(select(Incident.risk_score))).scalars().all():
        if risk_score is not None:
            if risk_score >= 0.7:
                risk_ranges["critical"] += 1
            elif risk_score >= 0.4:
                risk_ranges["high"] += 1
            elif risk_score >= 0.2:
                risk_ranges["medium"] += 1
            else:
                risk_ranges["low"] += 1

    avg_risk = (await db.execute(select(func.avg(Incident.risk_score)))).scalar() or 0

    return {
        "assets": {"total": asset_total, "by_status": asset_by_status, "by_type": asset_by_type, "by_location": asset_by_location},
        "incidents": {"total": inc_total, "by_severity": inc_by_severity, "by_status": inc_by_status},
        "risk_distribution": risk_ranges,
        "avg_risk_score": round(avg_risk, 2),
    }
