from fastapi import APIRouter, Depends, Query

from app.schemas.audit_log import AuditLogResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.services.audit_log_service import AuditLogService

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("", response_model=PaginatedResponse[AuditLogResponse])
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: str | None = Query(None),
    resource: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    svc: AuditLogService = Depends(),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    filters = {k: v for k, v in {"action": action, "resource": resource}.items() if v}
    return await svc.list(params, filters=filters)
