from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.asset import Asset
from app.schemas.risk_engine import (
    AssetRiskPrediction,
    RiskAssetListResponse,
    RiskOverview,
)
from app.services.risk_engine import RiskEngine, compute_risk_overview

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/assets", response_model=RiskAssetListResponse)
async def get_all_asset_risks(
    db: AsyncSession = Depends(get_db),
) -> RiskAssetListResponse:
    """Predictive risk assessment across all assets."""
    result = await db.execute(select(Asset))
    assets = result.scalars().all()

    engine = RiskEngine(db)
    predictions = [await engine.evaluate_asset(a) for a in assets]
    predictions.sort(key=lambda p: p.risk_score, reverse=True)

    overview = await compute_risk_overview(db)

    return RiskAssetListResponse(
        assets=predictions,
        total=len(predictions),
        overview=overview,
    )


@router.get("/assets/{asset_id}", response_model=AssetRiskPrediction)
async def get_asset_risk(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> AssetRiskPrediction:
    """Full predictive risk for a specific asset."""
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    engine = RiskEngine(db)
    return await engine.evaluate_asset(asset)


@router.get("/overview", response_model=RiskOverview)
async def get_risk_overview(
    db: AsyncSession = Depends(get_db),
) -> RiskOverview:
    """Aggregate risk overview across all assets."""
    return await compute_risk_overview(db)
