from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.common import MessageResponse, PaginatedResponse, PaginationParams
from app.schemas.notification import NotificationCreate, NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("", response_model=NotificationResponse, status_code=201)
async def create_notification(schema: NotificationCreate, svc: NotificationService = Depends()):
    return await svc.create(schema)


@router.get("", response_model=PaginatedResponse[NotificationResponse])
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: UUID | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    svc: NotificationService = Depends(),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    return await svc.list(params, user_id=user_id)


@router.get("/unread-count", response_model=dict)
async def get_unread_count(user_id: UUID, svc: NotificationService = Depends()):
    count = await svc.get_unread_count(user_id)
    return {"count": count}


@router.patch("/{notification_id}/read", response_model=MessageResponse)
async def mark_read(notification_id: UUID, svc: NotificationService = Depends()):
    await svc.mark_read(notification_id)
    return MessageResponse(message="Marked as read")


@router.patch("/read-all", response_model=MessageResponse)
async def mark_all_read(user_id: UUID, svc: NotificationService = Depends()):
    await svc.mark_all_read(user_id)
    return MessageResponse(message="All marked as read")
