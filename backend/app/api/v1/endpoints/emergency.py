from datetime import datetime, timezone
from random import choice, randint, uniform
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.asset import Asset
from app.models.incident import Incident
from app.models.worker import EmergencyAlert, Worker
from app.schemas.emergency import (
    AmbulanceDispatchResponse,
    EmergencyAlertResponse,
    EmergencyDetectionResult,
    SOSRequest,
    SOSResponse,
    WorkerResponse,
)

router = APIRouter(prefix="/emergency", tags=["emergency"])

AMBULANCE_CONTACTS = {
    "Mumbai": {"hospital": "Mumbai Central Hospital", "contact": "102", "ambulances": ["MH-01-AMB-101", "MH-01-AMB-102", "MH-01-AMB-103"]},
    "Jamnagar": {"hospital": "Jamnagar Civil Hospital", "contact": "108", "ambulances": ["GJ-01-AMB-201", "GJ-01-AMB-202"]},
    "Visakhapatnam": {"hospital": "King George Hospital", "contact": "108", "ambulances": ["AP-31-AMB-301", "AP-31-AMB-302", "AP-31-AMB-303"]},
    "Kochi": {"hospital": "Kochi Medical Center", "contact": "108", "ambulances": ["KL-07-AMB-401", "KL-07-AMB-402"]},
    "Panipat": {"hospital": "Panipat District Hospital", "contact": "108", "ambulances": ["HR-01-AMB-501"]},
    "Vadodara": {"hospital": "Baroda Medical College", "contact": "108", "ambulances": ["GJ-06-AMB-601", "GJ-06-AMB-602"]},
    "default": {"hospital": "AIIMS Emergency", "contact": "102", "ambulances": ["AI-AMB-001", "AI-AMB-002"]},
}


def _get_city_from_location(location: str | None) -> str:
    if not location:
        return "default"
    for city in ["Mumbai", "Jamnagar", "Visakhapatnam", "Kochi", "Panipat", "Vadodara"]:
        if city.lower() in location.lower():
            return city
    return "default"


def _auto_detect_emergency(incidents: list, assets: list) -> EmergencyDetectionResult | None:
    for inc in incidents:
        severity = getattr(inc, "severity", None) or inc.get("severity", "")
        title = getattr(inc, "title", None) or inc.get("title", "")
        risk = getattr(inc, "risk_score", None) or inc.get("risk_score", 0)
        status = getattr(inc, "status", None) or inc.get("status", "")

        if severity == "critical" and risk and risk >= 0.8 and status in ("open", "investigating"):
            return EmergencyDetectionResult(
                detected=True,
                alert_type="CRITICAL_INCIDENT",
                severity="critical",
                title=f"EMERGENCY: {title}",
                description=f"Critical incident with {risk*100:.0f}% risk score requires immediate response",
                confidence=round(risk * 100, 1),
                affected_assets=[str(getattr(inc, "asset_id", "") or "")],
                affected_workers=[],
            )

    for asset in assets:
        status = getattr(asset, "status", None) or asset.get("status", "")
        name = getattr(asset, "name", None) or asset.get("name", "")
        if status == "critical":
            return EmergencyDetectionResult(
                detected=True,
                alert_type="ASSET_CRITICAL",
                severity="critical",
                title=f"EMERGENCY: {name} in critical condition",
                description=f"Asset {name} has reached critical status — possible safety hazard",
                confidence=85.0,
                affected_assets=[str(getattr(asset, "id", "") or "")],
                affected_workers=[],
            )

    return None


@router.post("/sos", response_model=SOSResponse)
async def sos_alert(body: SOSRequest, db: AsyncSession = Depends(get_db)):
    worker_name = "Unknown Worker"
    worker = None
    if body.worker_id:
        result = await db.execute(select(Worker).where(Worker.id == UUID(body.worker_id)))
        worker = result.scalar_one_or_none()
        if worker:
            worker_name = worker.name

    city = _get_city_from_location(body.location)
    info = AMBULANCE_CONTACTS.get(city, AMBULANCE_CONTACTS["default"])
    eta = randint(5, 15)

    alert = EmergencyAlert(
        type="SOS",
        severity="critical",
        title=f"SOS Alert: {worker_name}",
        description=body.description or f"Emergency SOS triggered at {body.location or 'unknown location'}",
        location=body.location,
        facility=info["hospital"],
        latitude=body.latitude,
        longitude=body.longitude,
        status="active",
        worker_id=body.worker_id,
        source="sos_button",
        auto_detected=False,
        ambulance_dispatched=True,
        ambulance_eta_minutes=eta,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    hindi_msg = f"🚨 आपातकालीन सूचना: {worker_name} को तत्काल सहायता की आवश्यकता है। एम्बुलेंस {eta} मिनट में पहुंचेगी। हॉस्पिटल: {info['hospital']} — संपर्क: {info['contact']}"
    eng_msg = f"🚨 EMERGENCY: {worker_name} needs immediate assistance. Ambulance dispatched — ETA {eta} min. Hospital: {info['hospital']} — Contact: {info['contact']}"

    return SOSResponse(
        success=True,
        message=eng_msg,
        alert_id=str(alert.id),
        ambulance_dispatched=True,
        ambulance_eta=eta,
        emergency_message=f"{eng_msg}\n\n{hindi_msg}",
    )


@router.get("/auto-detect", response_model=EmergencyDetectionResult | None)
async def auto_detect(db: AsyncSession = Depends(get_db)):
    inc_result = await db.execute(
        select(Incident).where(Incident.status.in_(["open", "investigating"])).order_by(Incident.risk_score.desc()).limit(10)
    )
    incidents = inc_result.scalars().all()

    asset_result = await db.execute(select(Asset).where(Asset.status == "critical").limit(10))
    assets = asset_result.scalars().all()

    result = _auto_detect_emergency(incidents, assets)
    if result is None:
        return EmergencyDetectionResult(detected=False)

    return result


@router.post("/dispatch-ambulance", response_model=AmbulanceDispatchResponse)
async def dispatch_ambulance(alert_id: str, location: str | None = None, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmergencyAlert).where(EmergencyAlert.id == UUID(alert_id)))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    city = _get_city_from_location(location or alert.location)
    info = AMBULANCE_CONTACTS.get(city, AMBULANCE_CONTACTS["default"])
    eta = randint(5, 18)
    ambulance_id = choice(info["ambulances"])

    alert.ambulance_dispatched = True
    alert.ambulance_eta_minutes = eta
    await db.commit()

    return AmbulanceDispatchResponse(
        alert_id=alert_id,
        dispatched=True,
        eta_minutes=eta,
        hospital=info["hospital"],
        ambulance_id=ambulance_id,
        contact_number=info["contact"],
    )


@router.get("/alerts", response_model=list[EmergencyAlertResponse])
async def list_alerts(status: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(EmergencyAlert).order_by(EmergencyAlert.created_at.desc())
    if status:
        query = query.where(EmergencyAlert.status == status)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return [
        EmergencyAlertResponse(
            id=str(a.id),
            type=a.type,
            severity=a.severity,
            title=a.title,
            description=a.description,
            location=a.location,
            facility=a.facility,
            latitude=a.latitude,
            longitude=a.longitude,
            status=a.status,
            worker_id=a.worker_id,
            source=a.source,
            auto_detected=a.auto_detected,
            ambulance_dispatched=a.ambulance_dispatched,
            ambulance_eta_minutes=a.ambulance_eta_minutes,
            created_at=str(a.created_at),
        )
        for a in alerts
    ]


@router.post("/workers/check-in")
async def worker_check_in(body: dict, db: AsyncSession = Depends(get_db)):
    worker_id = body.get("worker_id")
    healthy = body.get("healthy", True)
    temperature = body.get("temperature")
    heart_rate = body.get("heart_rate")

    if worker_id:
        result = await db.execute(select(Worker).where(Worker.id == UUID(worker_id)))
        worker = result.scalar_one_or_none()
        if worker:
            worker.is_on_duty = healthy
            await db.commit()

    return {
        "success": True,
        "message": "Check-in recorded",
        "health_status": "healthy" if healthy else "needs_attention",
        "temperature": temperature,
        "heart_rate": heart_rate,
        "recommendation": "Worker is fit for duty" if healthy else "Worker needs medical evaluation",
    }


@router.get("/workers", response_model=list[WorkerResponse])
async def list_workers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Worker).order_by(Worker.name))
    workers = result.scalars().all()
    return [
        WorkerResponse(
            id=str(w.id),
            name=w.name,
            phone=w.phone,
            email=w.email,
            role=w.role,
            location=w.location,
            facility=w.facility,
            emergency_contact=w.emergency_contact,
            medical_conditions=w.medical_conditions,
            blood_group=w.blood_group,
            is_on_duty=w.is_on_duty,
            latitude=w.latitude,
            longitude=w.longitude,
        )
        for w in workers
    ]
