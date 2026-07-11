from uuid import UUID

from fastapi import APIRouter, Depends

from app.services.risk_service import RiskService

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/assets/{asset_id}")
async def get_asset_risk(asset_id: UUID, svc: RiskService = Depends()):
    score = await svc.calculate_asset_risk(asset_id)
    return {"asset_id": str(asset_id), "risk_score": score}
