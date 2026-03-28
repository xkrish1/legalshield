import re
from typing import List

MIN_CHUNK_LENGTH = 80
MAX_CHUNK_LENGTH = 1200


def chunk_lease_text(text: str) -> List[str]:
    if not text or not text.strip():
        return []

    patterns = [
        r"(?=\n\s*\d{1,2}\.\s+[A-Z])",
        r"(?=\n[A-Z][A-Z\s\-]{4,}\n)",
        r"(?=\n[A-Z][A-Z\s\-]{4,}:)",
        r"\n\s*\n",
    ]

    combined_pattern = "|".join(patterns)
    raw_chunks = re.split(combined_pattern, text)

    chunks = []
    for chunk in raw_chunks:
        cleaned = " ".join(chunk.split())
        if len(cleaned) < MIN_CHUNK_LENGTH:
            continue
        if len(cleaned) > MAX_CHUNK_LENGTH:
            sub_chunks = _force_split(cleaned, MAX_CHUNK_LENGTH)
            chunks.extend(sub_chunks)
        else:
            chunks.append(cleaned)

    return chunks


def _force_split(text: str, max_len: int) -> List[str]:
    parts = []
    while len(text) > max_len:
        split_at = text.rfind(". ", 0, max_len)
        if split_at == -1:
            split_at = max_len
        parts.append(text[:split_at + 1].strip())
        text = text[split_at + 1:].strip()
    if text:
        parts.append(text)
    return parts
