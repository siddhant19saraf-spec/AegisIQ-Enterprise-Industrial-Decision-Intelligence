from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.common import MessageResponse, PaginatedResponse, PaginationParams
from app.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate, IncidentUpdateCreate, IncidentUpdateResponse
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("", response_model=IncidentResponse, status_code=201)
async def create_incident(schema: IncidentCreate, svc: IncidentService = Depends()):
    return await svc.create(schema)


@router.get("", response_model=PaginatedResponse[IncidentResponse])
async def list_incidents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    severity: str | None = Query(None),
    asset_id: UUID | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    svc: IncidentService = Depends(),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    filters = {k: v for k, v in {"status": status, "severity": severity, "asset_id": asset_id}.items() if v}
    return await svc.list(params, search=search, filters=filters)


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: UUID, svc: IncidentService = Depends()):
    result = await svc.get(incident_id)
    if not result:
        raise HTTPException(404, "Incident not found")
    return result


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(incident_id: UUID, schema: IncidentUpdate, svc: IncidentService = Depends()):
    result = await svc.update(incident_id, schema)
    if not result:
        raise HTTPException(404, "Incident not found")
    return result


@router.delete("/{incident_id}", response_model=MessageResponse)
async def delete_incident(incident_id: UUID, svc: IncidentService = Depends()):
    deleted = await svc.delete(incident_id)
    if not deleted:
        raise HTTPException(404, "Incident not found")
    return MessageResponse(message="Incident deleted")


@router.post("/{incident_id}/updates", response_model=IncidentUpdateResponse, status_code=201)
async def add_incident_update(incident_id: UUID, schema: IncidentUpdateCreate, svc: IncidentService = Depends()):
    return await svc.add_update(incident_id, schema)
