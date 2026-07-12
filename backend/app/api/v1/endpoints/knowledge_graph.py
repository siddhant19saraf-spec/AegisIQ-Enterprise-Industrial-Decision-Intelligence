from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.graph import GraphService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/graph", tags=["knowledge-graph"])


@router.get("/full")
async def get_full_graph(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get the complete enterprise knowledge graph."""
    svc = GraphService(db)
    kg = await svc.build_full_graph()
    return kg.to_dict()


@router.get("/impact/{asset_id}")
async def get_impact_analysis(
    asset_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get impact analysis for a specific asset."""
    svc = GraphService(db)
    return await svc.get_impact_analysis(asset_id)


@router.get("/search")
async def search_relationships(
    q: str = Query(..., description="Search query"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Search for nodes and relationships."""
    svc = GraphService(db)
    results = await svc.search_relationships(q)
    return {"results": results, "count": len(results)}


@router.get("/stats")
async def get_graph_stats(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get graph statistics."""
    svc = GraphService(db)
    kg = await svc.build_full_graph()
    return kg.to_dict()["stats"]
