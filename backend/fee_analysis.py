"""
backend/fee_analysis.py

Pre-LLM fee analysis module.
Extracts rent amount and fee amount from clause text,
computes proportionality, and returns a fee_context dict
that gets injected into the LLM prompt.

Design principle: do the math in Python so the 3B model
does not have to. Model only explains — never classifies numbers.
"""

import re
from typing import Optional


def extract_dollar_amount(text: str) -> Optional[float]:
    """
    Extracts the first dollar amount from text.
    Handles: $150, $1,500, $1500, 150 dollars, 150.00
    """
    patterns = [
        r"\$\s*([\d,]+(?:\.\d{1,2})?)",
        r"([\d,]+(?:\.\d{1,2})?)\s*dollars",
        r"([\d,]+(?:\.\d{1,2})?)\s*per\s+month",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except ValueError:
                continue
    return None


def extract_late_fee_amount(text: str) -> Optional[float]:
    """
    Extracts the late fee dollar amount specifically.
    Searches after 'late fee' / 'late charge' keywords so it doesn't
    pick up rent amounts that appear earlier in the same chunk.
    """
    patterns = [
        r"late\s+fee\s+of\s+\$\s*([\d,]+(?:\.\d{1,2})?)",
        r"late\s+charge\s+of\s+\$\s*([\d,]+(?:\.\d{1,2})?)",
        r"pay\s+a\s+(?:late\s+)?fee\s+of\s+\$\s*([\d,]+(?:\.\d{1,2})?)",
        r"additional\s+(?:late\s+)?fee\s+of\s+\$\s*([\d,]+(?:\.\d{1,2})?)",
        r"fee\s+of\s+\$\s*([\d,]+(?:\.\d{1,2})?)",
        r"pay\s+\$\s*([\d,]+(?:\.\d{1,2})?)\s+(?:as\s+a\s+)?late",
        r"\$\s*([\d,]+(?:\.\d{1,2})?)\s+(?:late\s+fee|per\s+month\s+late)",
        r"late.*?\$\s*([\d,]+(?:\.\d{1,2})?)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except ValueError:
                continue
    return None


def extract_percentage(text: str) -> Optional[float]:
    """Extracts the first percentage from text."""
    match = re.search(r"([\d.]+)\s*(?:%|percent)", text, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            return None
    return None


def extract_rent_from_lease(full_lease_text: str) -> Optional[float]:
    """
    Attempts to extract the monthly rent amount from the full lease text.
    Only searches first 3000 chars — rent is declared early.
    """
    patterns = [
        r"paid\s+as\s+follows[:\s]+\$\s*([\d,]+(?:\.\d{1,2})?)\s*per\s+month",
        r"monthly\s+rent(?:\s+is|\s*[:=])\s*\$?\s*([\d,]+(?:\.\d{1,2})?)",
        r"rent\s+(?:of|is|shall\s+be)\s*\$?\s*([\d,]+(?:\.\d{1,2})?)\s*per\s+month",
        r"base\s+rent\s*[:=]?\s*\$?\s*([\d,]+(?:\.\d{1,2})?)",
        r"\$\s*([\d,]+(?:\.\d{1,2})?)\s*per\s+month",
        r"([\d,]+(?:\.\d{1,2})?)\s*/\s*month",
    ]
    search_zone = full_lease_text[:3000]
    for pattern in patterns:
        match = re.search(pattern, search_zone, re.IGNORECASE)
        if match:
            try:
                amount = float(match.group(1).replace(",", ""))
                if 200 <= amount <= 50000:
                    return amount
            except ValueError:
                continue
    return None


def analyze_late_fee(clause_text: str, monthly_rent: Optional[float] = None) -> dict:
    """
    Analyzes a late fee clause for proportionality.

    Thresholds:
      - Daily/compounding fee       → HIGH always
      - Fee <= 5% of monthly rent   → LOW
      - Fee > 5% but <= 10%         → MEDIUM
      - Fee > 10%                   → HIGH
      - Amount found, no rent       → MEDIUM (can't compute)
      - No amount found             → MEDIUM (unknown)
    """
    text_lower = clause_text.lower()

    is_daily = any(p in text_lower for p in [
        "per day", "daily", "each day", "per diem",
        "compounding", "compounds daily",
    ])

    if is_daily:
        return {
            "is_daily_fee":    True,
            "fee_amount":      extract_dollar_amount(clause_text),
            "monthly_rent":    monthly_rent,
            "fee_pct_of_rent": None,
            "proportionality": "high",
            "severity_signal": "high",
            "rationale": (
                "Daily or compounding fee — high risk regardless of amount. "
                "NJ courts frequently strike down daily late fees as excessive penalty clauses."
            ),
        }

    fee_amount     = extract_late_fee_amount(clause_text)
    fee_pct_stated = extract_percentage(clause_text)

    if fee_pct_stated is not None:
        pct = fee_pct_stated
        if pct <= 5.0:
            sev, prop = "low",    "low"
            rationale = f"Fee is {pct}% of rent — at or below the 5% threshold. Low risk."
        elif pct <= 10.0:
            sev, prop = "medium", "medium"
            rationale = f"Fee is {pct}% of rent — above 5% threshold but below 10%. Moderate risk."
        else:
            sev, prop = "high",   "high"
            rationale = f"Fee is {pct}% of rent — exceeds 10% threshold. High risk."

        # If we couldn't confirm an actual dollar fee amount, the percentage may
        # be unrelated text (e.g. interest rate, other clause). Cap at medium.
        if fee_amount is None and sev == "high":
            sev  = "medium"
            prop = "medium"
            rationale = (
                f"Percentage ({pct}%) found in clause but no specific fee dollar amount confirmed. "
                "Cannot verify this applies to the late fee — defaulting to medium risk."
            )

        return {
            "is_daily_fee":    False,
            "fee_amount":      None,
            "fee_pct_stated":  pct,
            "monthly_rent":    monthly_rent,
            "fee_pct_of_rent": pct,
            "proportionality": prop,
            "severity_signal": sev,
            "rationale":       rationale,
        }

    if fee_amount is not None and monthly_rent is not None:
        pct = (fee_amount / monthly_rent) * 100
        if pct <= 5.0:
            sev, prop = "low",    "low"
            rationale = (
                f"Late fee of ${fee_amount:.0f} is {pct:.1f}% of monthly rent "
                f"(${monthly_rent:.0f}) — at or below the 5% threshold. Low risk."
            )
        elif pct <= 10.0:
            sev, prop = "medium", "medium"
            rationale = (
                f"Late fee of ${fee_amount:.0f} is {pct:.1f}% of monthly rent "
                f"(${monthly_rent:.0f}) — above 5% threshold. Moderate risk."
            )
        else:
            sev, prop = "high",   "high"
            rationale = (
                f"Late fee of ${fee_amount:.0f} is {pct:.1f}% of monthly rent "
                f"(${monthly_rent:.0f}) — exceeds 10% threshold. High risk."
            )

        return {
            "is_daily_fee":    False,
            "fee_amount":      fee_amount,
            "fee_pct_stated":  None,
            "monthly_rent":    monthly_rent,
            "fee_pct_of_rent": round(pct, 1),
            "proportionality": prop,
            "severity_signal": sev,
            "rationale":       rationale,
        }

    if fee_amount is not None:
        return {
            "is_daily_fee":    False,
            "fee_amount":      fee_amount,
            "fee_pct_stated":  None,
            "monthly_rent":    None,
            "fee_pct_of_rent": None,
            "proportionality": "unknown",
            "severity_signal": "medium",
            "rationale": (
                f"Late fee of ${fee_amount:.0f} found but monthly rent not detected in lease. "
                "Cannot compute proportionality — defaulting to medium risk."
            ),
        }

    return {
        "is_daily_fee":    False,
        "fee_amount":      None,
        "fee_pct_stated":  None,
        "monthly_rent":    None,
        "fee_pct_of_rent": None,
        "proportionality": "unknown",
        "severity_signal": "medium",
        "rationale":       "Late fee clause detected but no specific amount found. Medium risk by default.",
    }
