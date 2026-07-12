"""API endpoints for the Enterprise Digital Twin."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.digital_twin import (
    DigitalTwinOverview,
    DigitalTwinTopology,
    FacilitySummary,
)
from app.services.digital_twin_service import DigitalTwinService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/digital-twin", tags=["digital-twin"])


@router.get("/facilities", response_model=list[FacilitySummary])
async def list_facilities(
    db: AsyncSession = Depends(get_db),
) -> list[FacilitySummary]:
    """List all facilities with aggregate health and risk."""
    svc = DigitalTwinService(db)
    return await svc.get_facilities()


@router.get("/facilities/{facility_id}", response_model=DigitalTwinTopology)
async def get_facility(
    facility_id: str,
    db: AsyncSession = Depends(get_db),
) -> DigitalTwinTopology:
    """Asset topology for a specific facility."""
    svc = DigitalTwinService(db)
    result = await svc.get_facility_detail(facility_id)
    if not result:
        raise HTTPException(status_code=404, detail="Facility not found")
    return result


@router.get("/assets", response_model=DigitalTwinTopology)
async def get_digital_twin_assets(
    db: AsyncSession = Depends(get_db),
) -> DigitalTwinTopology:
    """Full asset topology across all facilities."""
    svc = DigitalTwinService(db)
    return await svc.get_asset_topology()


@router.get("/overview", response_model=DigitalTwinOverview)
async def get_digital_twin_overview(
    db: AsyncSession = Depends(get_db),
) -> DigitalTwinOverview:
    """Aggregate digital twin overview."""
    svc = DigitalTwinService(db)
    return await svc.get_overview()
