"""Pydantic schemas for the Enterprise RAG module."""

from __future__ import annotations

from pydantic import BaseModel, Field


class RAGDocumentResponse(BaseModel):
    id: str
    filename: str
    title: str
    source: str
    category: str
    file_type: str
    file_size: int
    chunk_count: int
    metadata: dict = {}
    created_at: str | None = None


class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)
    category: str | None = None
    min_confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class Citation(BaseModel):
    source: str
    title: str
    document_id: str
    chunk_index: int
    content: str
    relevance: float
    chunk_id: str = ""


class RAGQueryResponse(BaseModel):
    answer: str
    citations: list[Citation]
    confidence: float
    total_chunks_retrieved: int = 0


class RAGUploadResponse(BaseModel):
    id: str
    filename: str
    title: str
    file_type: str
    file_size: int
    chunk_count: int
    message: str
