from datetime import datetime

from pydantic import BaseModel, Field


class CopilotMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str
    timestamp: datetime | None = None


class CopilotConversation(BaseModel):
    id: str
    title: str
    messages: list[CopilotMessage] = []
    created_at: datetime
    updated_at: datetime


class CopilotRequest(BaseModel):
    conversation_id: str | None = None
    message: str
    context: dict | None = None


class Citation(BaseModel):
    source: str
    title: str
    snippet: str
    relevance: float = Field(..., ge=0, le=1)


class ThinkingStep(BaseModel):
    phase: str
    detail: str
    duration_ms: int | None = None


class CopilotResponse(BaseModel):
    conversation_id: str
    response: str
    citations: list[Citation] = []
    thinking: list[ThinkingStep] = []
    confidence: float = Field(..., ge=0, le=1)
    suggested_prompts: list[str] = []


class FeedbackRequest(BaseModel):
    conversation_id: str
    message_index: int
    feedback: str = Field(..., pattern="^(up|down)$")


class DocumentChunk(BaseModel):
    id: str
    content: str
    source: str
    title: str
    metadata: dict = {}


class DocumentCreate(BaseModel):
    title: str
    content: str
    source: str
    category: str = "general"
    metadata: dict = {}


class DocumentResponse(BaseModel):
    id: str
    title: str
    source: str
    category: str
    created_at: datetime
