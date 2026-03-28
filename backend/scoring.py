from typing import List

SEVERITY_POINTS = {
    "low": 5,
    "medium": 10,
    "high": 20,
    "unclear": 0,
}

RISK_BUCKETS = [
    (0,  15,  "Low"),
    (16, 35,  "Moderate"),
    (36, 999, "High"),
]


def compute_risk_score(flags: List[dict]) -> int:
    if not flags:
        return 0
    return sum(SEVERITY_POINTS.get(f.get("severity", "unclear"), 0) for f in flags)


def get_risk_bucket(score: int) -> str:
    for low, high, label in RISK_BUCKETS:
        if low <= score <= high:
            return label
    return "High"


def build_summary(flags: List[dict], bucket: str) -> str:
    if not flags:
        return "No concerning clauses were detected in this lease."

    high_flags = [f for f in flags if f.get("severity") == "high"]
    med_flags  = [f for f in flags if f.get("severity") == "medium"]

    parts = [f"This lease has a {bucket} risk level ({len(flags)} clause(s) flagged)."]

    if high_flags:
        types = ", ".join(f["clause_type"].replace("_", " ") for f in high_flags[:3])
        parts.append(f"High-risk clauses: {types}.")
    if med_flags:
        types = ", ".join(f["clause_type"].replace("_", " ") for f in med_flags[:2])
        parts.append(f"Medium-risk clauses: {types}.")

    parts.append("Review flagged clauses carefully before signing.")
    return " ".join(parts)
