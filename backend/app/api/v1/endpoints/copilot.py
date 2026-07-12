from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.copilot import (
    CopilotRequest,
    CopilotResponse,
    FeedbackRequest,
)
from app.xai import CopilotEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.post("/chat", response_model=CopilotResponse)
async def chat(
    req: CopilotRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Process a copilot chat message and return a complete response."""
    engine = CopilotEngine(db)
    response = await engine.process(
        message=req.message,
        conversation_id=req.conversation_id,
        context=req.context,
    )
    return response


@router.post("/chat/stream")
async def chat_stream(
    req: CopilotRequest,
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Stream copilot response tokens for real-time UI updates."""
    engine = CopilotEngine(db)
    response = await engine.process(
        message=req.message,
        conversation_id=req.conversation_id,
        context=req.context,
    )

    async def event_stream():
        # Send thinking steps as events
        for step in response.thinking:
            yield f"event: thinking\ndata: {json.dumps({'phase': step.phase, 'detail': step.detail})}\n\n"
            await asyncio.sleep(0.1)

        # Stream the response content token by token
        words = response.response.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"event: token\ndata: {json.dumps({'token': chunk})}\n\n"
            await asyncio.sleep(0.02)

        # Send citations
        citations_data = [
            {"source": c.source, "title": c.title, "snippet": c.snippet, "relevance": c.relevance}
            for c in response.citations
        ]
        yield f"event: citations\ndata: {json.dumps({'citations': citations_data})}\n\n"

        # Send final metadata
        yield f"event: done\ndata: {json.dumps({
            'conversation_id': response.conversation_id,
            'confidence': response.confidence,
            'suggested_prompts': response.suggested_prompts,
        })}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest) -> dict:
    """Record user feedback on a copilot response."""
    CopilotEngine.record_feedback(
        conv_id=req.conversation_id,
        message_index=req.message_index,
        feedback=req.feedback,
    )
    return {"status": "ok"}


@router.get("/conversations")
async def list_conversations() -> list[dict]:
    """List all copilot conversations."""
    return CopilotEngine.get_conversations()


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str) -> dict:
    """Get a specific copilot conversation."""
    conv = CopilotEngine.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.get("/suggestions")
async def get_suggestions() -> list[str]:
    """Get suggested prompt ideas."""
    from app.xai.engine import SUGGESTED_PROMPTS
    return SUGGESTED_PROMPTS


@router.post("/suggestions")
async def get_context_suggestions(
    req: CopilotRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get context-aware suggestions based on current state."""
    engine = CopilotEngine(db)
    enterprise_data = await engine._query_enterprise_data(req.message, "general")
    prompts = engine._get_suggested_prompts("general", enterprise_data)
    return {"suggestions": prompts}
