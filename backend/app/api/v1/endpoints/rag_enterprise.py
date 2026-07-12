"""
Enterprise RAG API endpoints.

POST   /api/v1/rag/upload          — Upload and ingest a document
POST   /api/v1/rag/query            — Query the knowledge base
GET    /api/v1/rag/documents        — List ingested documents
DELETE /api/v1/rag/documents/{id}   — Delete a document and its chunks
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.rag.documents import (
    chunk_document,
    generate_content_hash,
    get_file_type,
    parse_document,
)
from app.rag.models import RAGDocument
from app.rag.query import query_knowledge_base
from app.rag.schemas import (
    RAGDocumentResponse,
    RAGQueryRequest,
    RAGQueryResponse,
    RAGUploadResponse,
)
from app.rag.vector_store import ChunkData, generate_embedding, vector_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["rag"])

SUPPORTED_TYPES = {"pdf", "docx", "md", "markdown", "txt"}


@router.post("/upload", response_model=RAGUploadResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    category: str = Form("general"),
    source: str = Form("upload"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Upload and ingest a document into the RAG knowledge base."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_type = get_file_type(file.filename)
    if file_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{file_type}'. Supported: {', '.join(sorted(SUPPORTED_TYPES))}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    file_size = len(content)
    content_hash = generate_content_hash(content)

    # Check for duplicate
    result = await db.execute(
        select(RAGDocument).where(RAGDocument.content_hash == content_hash)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Document already exists with id {existing.id} (same content)",
        )

    # Parse document
    try:
        text = parse_document(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the document")

    # Chunk document
    chunks = chunk_document(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="Document text is too short to chunk")

    doc_title = title or file.filename.rsplit(".", 1)[0]

    # Store in PostgreSQL
    doc = RAGDocument(
        filename=file.filename,
        title=doc_title,
        source=source,
        category=category,
        file_type=file_type,
        file_size=file_size,
        chunk_count=len(chunks),
        content_hash=content_hash,
        doc_metadata={"title": doc_title, "source": source, "category": category},
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Generate embeddings and store in vector store
    for chunk in chunks:
        chunk_id = f"{doc.id}_{chunk['index']}"
        chunk_content = chunk["content"]
        embedding = generate_embedding(chunk_content)
        vector_store.upsert(ChunkData(
            chunk_id=chunk_id,
            document_id=doc.id,
            content=chunk_content,
            chunk_index=chunk["index"],
            embedding=embedding,
            metadata={
                "title": doc_title,
                "source": source,
                "category": category,
                "filename": file.filename,
            },
        ))

    logger.info("Ingested document '%s' (%d chunks)", doc_title, len(chunks))

    return RAGUploadResponse(
        id=doc.id,
        filename=file.filename,
        title=doc_title,
        file_type=file_type,
        file_size=file_size,
        chunk_count=len(chunks),
        message=f"Successfully ingested '{doc_title}' with {len(chunks)} chunks",
    )


@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(req: RAGQueryRequest) -> Any:
    """Query the enterprise knowledge base with semantic search."""
    if vector_store.count() == 0:
        return RAGQueryResponse(
            answer="The knowledge base is empty. Upload documents first using POST /api/v1/rag/upload.",
            citations=[],
            confidence=0.0,
            total_chunks_retrieved=0,
        )

    response = query_knowledge_base(
        query=req.query,
        top_k=req.top_k,
        category=req.category,
        min_confidence=req.min_confidence,
    )
    return response


@router.get("/documents", response_model=list[RAGDocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """List all ingested documents."""
    result = await db.execute(
        select(RAGDocument).order_by(RAGDocument.created_at.desc())
    )
    docs = result.scalars().all()
    return [doc.to_dict() for doc in docs]


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a document and its vector chunks."""
    result = await db.execute(
        select(RAGDocument).where(RAGDocument.id == doc_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from vector store
    deleted_chunks = vector_store.delete_document(doc_id)

    # Delete from PostgreSQL
    await db.delete(doc)
    await db.commit()

    logger.info("Deleted document '%s' (%s) and %d chunks", doc.title, doc_id, deleted_chunks)

    return {
        "status": "ok",
        "message": f"Deleted '{doc.title}' and {deleted_chunks} chunks",
        "document_id": doc_id,
        "chunks_removed": deleted_chunks,
    }
