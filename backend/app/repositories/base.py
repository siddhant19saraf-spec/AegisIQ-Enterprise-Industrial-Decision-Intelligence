from typing import Any, Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base as DBBase

ModelType = TypeVar("ModelType", bound=DBBase)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def create(self, schema: CreateSchemaType) -> ModelType:
        instance = self.model(**schema.model_dump())
        self.db.add(instance)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def get(self, id: Any) -> ModelType | None:
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        sort_by: str | None = None,
        sort_order: str = "desc",
        filters: dict | None = None,
        search: str | None = None,
        search_fields: list[str] | None = None,
    ) -> tuple[list[ModelType], int]:
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)

        if filters:
            for field, value in filters.items():
                if value is not None and hasattr(self.model, field):
                    query = query.where(getattr(self.model, field) == value)
                    count_query = count_query.where(getattr(self.model, field) == value)

        if search and search_fields:
            conditions = []
            for field in search_fields:
                if hasattr(self.model, field):
                    col = getattr(self.model, field)
                    conditions.append(col.ilike(f"%{search}%"))
            if conditions:
                query = query.where(or_(*conditions))
                count_query = count_query.where(or_(*conditions))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        if hasattr(self.model, sort_by or "created_at"):
            sort_col = getattr(self.model, sort_by or "created_at")
            query = query.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def update(self, id: Any, schema: UpdateSchemaType) -> ModelType | None:
        instance = await self.get(id)
        if not instance:
            return None
        for key, value in schema.model_dump(exclude_unset=True).items():
            setattr(instance, key, value)
        await self.db.flush()
        await self.db.refresh(instance)
        return instance

    async def delete(self, id: Any) -> bool:
        instance = await self.get(id)
        if not instance:
            return False
        await self.db.delete(instance)
        await self.db.flush()
        return True
