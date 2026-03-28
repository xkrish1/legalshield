from pydantic import BaseModel, field_validator
from typing import List, Literal, Optional


class ClauseFlag(BaseModel):
    clause_type: str
    severity: Literal["low", "medium", "high", "unclear"]
    excerpt: str
    why_it_matters: str
    plain_english: str
    questions_to_ask: List[str]
    confidence: float

    @field_validator("excerpt")
    @classmethod
    def truncate_excerpt(cls, v):
        return v[:400] if v else ""

    @field_validator("confidence")
    @classmethod
    def clamp_confidence(cls, v):
        return max(0.0, min(1.0, float(v)))

    @field_validator("questions_to_ask")
    @classmethod
    def ensure_questions(cls, v):
        if not v:
            return ["Please review this clause with a legal professional."]
        return v[:3]


class LeaseAnalysisResponse(BaseModel):
    overall_risk_score: int
    risk_bucket: Literal["Low", "Moderate", "High"]
    summary: str
    flags: List[ClauseFlag]
    disclaimer: str = (
        "This tool provides informational insights only "
        "and is not legal advice. Consult a qualified attorney "
        "for legal guidance."
    )

    @field_validator("flags")
    @classmethod
    def deduplicate_flags(cls, v):
        seen = {}
        for flag in v:
            ct = flag.clause_type
            if ct not in seen:
                seen[ct] = flag
            else:
                order = {"high": 3, "medium": 2, "low": 1, "unclear": 0}
                if order.get(flag.severity, 0) > order.get(seen[ct].severity, 0):
                    seen[ct] = flag
        return list(seen.values())


class ExitLetterRequest(BaseModel):
    tenant_name: str
    landlord_name: str
    property_address: str
    move_out_date: str
    reason: Optional[str] = "personal reasons"
    lease_end_date: Optional[str] = ""


class SimulatorRequest(BaseModel):
    scenario: str
    lease_flags: Optional[List[str]] = []
