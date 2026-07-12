"""
Document processing for Enterprise RAG.

Parses uploaded files (PDF, DOCX, MD, TXT), extracts text, chunks documents.
No external parsing libraries required — uses built-in Python modules where possible.
"""

from __future__ import annotations

import hashlib
import io
import logging
import re
import xml.etree.ElementTree as ET
import zipfile
from typing import Any

logger = logging.getLogger(__name__)

CHUNK_SIZE = 512
CHUNK_OVERLAP = 64


def parse_document(content: bytes, filename: str) -> str:
    """Parse an uploaded document and return its text content."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "pdf":
        return _parse_pdf(content)
    elif ext == "docx":
        return _parse_docx(content)
    elif ext in ("md", "markdown"):
        return _parse_markdown(content)
    elif ext == "txt":
        return _parse_txt(content)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")


def _parse_pdf(content: bytes) -> str:
    """Extract text from PDF using basic stream parsing."""
    text_parts: list[str] = []
    content_str = content.decode("latin-1")

    # Extract text between parentheses in PDF streams (common pattern)
    for match in re.finditer(r"\(([^)]*)\)", content_str):
        t = match.group(1)
        # Filter out binary/non-printable garbage
        if t and sum(1 for c in t if 32 <= ord(c) < 127) > len(t) * 0.7:
            text_parts.append(t)

    # Also try to extract between BT...ET (text blocks)
    for block in re.finditer(r"BT(.*?)ET", content_str, re.DOTALL):
        for match in re.finditer(r"\(([^)]*)\)", block.group(1)):
            t = match.group(1)
            if t and sum(1 for c in t if 32 <= ord(c) < 127) > len(t) * 0.7:
                text_parts.append(t)

    text = "\n".join(text_parts)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
    text = re.sub(r"\s+", " ", text).strip()

    if len(text) < 20:
        logger.warning("PDF text extraction yielded very little content (%d chars)", len(text))

    return text


def _parse_docx(content: bytes) -> str:
    """Extract text from DOCX using zipfile + XML parsing (no python-docx needed)."""
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            if "word/document.xml" not in z.namelist():
                raise ValueError("Not a valid DOCX file (missing word/document.xml)")

            xml_content = z.read("word/document.xml")
            root = ET.fromstring(xml_content)

            paragraphs: list[str] = []
            for p in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                texts: list[str] = []
                for t in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"):
                    if t.text:
                        texts.append(t.text)
                if texts:
                    paragraphs.append("".join(texts))

            return "\n".join(paragraphs)
    except zipfile.BadZipFile:
        raise ValueError("Invalid or corrupted DOCX file")
    except ET.ParseError:
        raise ValueError("Failed to parse DOCX XML content")


def _parse_markdown(content: bytes) -> str:
    """Extract text from Markdown."""
    text = content.decode("utf-8", errors="replace")
    # Strip markdown formatting for cleaner text
    text = re.sub(r"#{1,6}\s+", "", text)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"\*(.*?)\*", r"\1", text)
    text = re.sub(r"`{1,3}[^`]*`{1,3}", "", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[-*+]\s+", "", text)
    text = re.sub(r"^\d+\.\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"```[\s\S]*?```", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _parse_txt(content: bytes) -> str:
    """Extract text from plain text file."""
    return content.decode("utf-8", errors="replace").strip()


def chunk_document(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[dict[str, Any]]:
    """Split document text into overlapping chunks."""
    if not text.strip():
        return []

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text.strip())

    words = text.split()
    chunks: list[dict[str, Any]] = []

    if len(words) <= chunk_size:
        chunks.append({
            "index": 0,
            "content": " ".join(words),
            "word_count": len(words),
        })
        return chunks

    stride = chunk_size - overlap
    for i in range(0, len(words), stride):
        chunk_words = words[i:i + chunk_size]
        if len(chunk_words) < overlap and chunks:
            break
        chunks.append({
            "index": len(chunks),
            "content": " ".join(chunk_words),
            "word_count": len(chunk_words),
        })

    return chunks


def generate_content_hash(content: bytes) -> str:
    """Generate a SHA-256 hash of document content for dedup."""
    return hashlib.sha256(content).hexdigest()


def get_file_type(filename: str) -> str:
    """Detect file type from filename."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext
