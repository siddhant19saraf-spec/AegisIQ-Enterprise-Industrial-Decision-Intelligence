from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.asset import AssetCreate, AssetResponse, AssetUpdate
from app.schemas.common import MessageResponse, PaginatedResponse, PaginationParams
from app.services.asset_service import AssetService

router = APIRouter(prefix="/assets", tags=["assets"])


@router.post("", response_model=AssetResponse, status_code=201)
async def create_asset(schema: AssetCreate, svc: AssetService = Depends()):
    return await svc.create(schema)


@router.get("", response_model=PaginatedResponse[AssetResponse])
async def list_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    type: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    svc: AssetService = Depends(),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    filters = {k: v for k, v in {"status": status, "type": type}.items() if v}
    return await svc.list(params, search=search, filters=filters)


@router.get("/tree", response_model=list[AssetResponse])
async def get_asset_tree(svc: AssetService = Depends()):
    return await svc.get_tree()


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: UUID, svc: AssetService = Depends()):
    result = await svc.get(asset_id)
    if not result:
        raise HTTPException(404, "Asset not found")
    return result


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: UUID, schema: AssetUpdate, svc: AssetService = Depends()):
    result = await svc.update(asset_id, schema)
    if not result:
        raise HTTPException(404, "Asset not found")
    return result


@router.delete("/{asset_id}", response_model=MessageResponse)
async def delete_asset(asset_id: UUID, svc: AssetService = Depends()):
    deleted = await svc.delete(asset_id)
    if not deleted:
        raise HTTPException(404, "Asset not found")
    return MessageResponse(message="Asset deleted")
