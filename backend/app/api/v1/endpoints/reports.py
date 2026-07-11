from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.common import MessageResponse, PaginatedResponse, PaginationParams
from app.schemas.report import ReportCreate, ReportResponse, ReportUpdate
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportResponse, status_code=201)
async def create_report(schema: ReportCreate, svc: ReportService = Depends()):
    return await svc.create(schema)


@router.get("", response_model=PaginatedResponse[ReportResponse])
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    svc: ReportService = Depends(),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    return await svc.list(params, search=search)


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: UUID, svc: ReportService = Depends()):
    result = await svc.get(report_id)
    if not result:
        raise HTTPException(404, "Report not found")
    return result


@router.patch("/{report_id}", response_model=ReportResponse)
async def update_report(report_id: UUID, schema: ReportUpdate, svc: ReportService = Depends()):
    result = await svc.update(report_id, schema)
    if not result:
        raise HTTPException(404, "Report not found")
    return result


@router.delete("/{report_id}", response_model=MessageResponse)
async def delete_report(report_id: UUID, svc: ReportService = Depends()):
    deleted = await svc.delete(report_id)
    if not deleted:
        raise HTTPException(404, "Report not found")
    return MessageResponse(message="Report deleted")
