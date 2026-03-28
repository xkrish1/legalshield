import re
from typing import List, Dict

CLAUSE_RULES: Dict[str, List[str]] = {
    "automatic_renewal": [
        r"auto(matically)?\s+renew",
        r"automatic\s+renewal",
        r"successive\s+(one.year|1.year|annual)\s+term",
        r"notice\s+of\s+non.renewal",
        r"month.to.month\s+(unless|until|conversion)",
        r"renew\s+unless\s+notice",
    ],
    "early_termination": [
        r"early\s+termination",
        r"terminate\s+(this\s+)?lease\s+prior",
        r"vacate\s+(the\s+)?premises\s+before",
        r"termination\s+fee",
        r"break\s+(the\s+)?lease",
        r"remaining\s+rent\s+due",
        r"lease\s+buyout",
    ],
    "late_fees": [
        r"late\s+(fee|charge|penalty)",
        r"past\s+due",
        r"\$\d+\s+(per\s+day|daily)",
        r"not\s+received\s+by\s+the\s+\d+(st|nd|rd|th)",
        r"grace\s+period",
        r"delinquent\s+rent",
    ],
    "security_deposit": [
        r"security\s+deposit",
        r"deposit\s+(shall|will|must)\s+be\s+returned",
        r"refundable\s+deposit",
        r"deducted?\s+from\s+(the\s+)?deposit",
        r"normal\s+wear\s+and\s+tear",
        r"move.out\s+inspection",
    ],
    "maintenance_repairs": [
        r"tenant\s+shall\s+(be\s+responsible|maintain|repair)",
        r"repairs?\s+(are\s+)?(the\s+)?responsibility\s+of\s+tenant",
        r"as.is\s+condition",
        r"waives?\s+(any\s+)?right\s+to\s+repair",
        r"plumbing|electrical|hvac|appliance",
        r"habitability|habitable",
    ],
    "landlord_entry": [
        r"landlord\s+(may|shall|has\s+the\s+right\s+to)\s+enter",
        r"right\s+of\s+entry",
        r"access\s+to\s+(the\s+)?premises",
        r"without\s+(prior\s+)?notice",
        r"\d+\s+hours?\s+(written\s+)?notice",
        r"reasonable\s+(notice|time|hour)",
    ],
    "subletting": [
        r"sublet|sublease|sub.let|sub.lease",
        r"assign(ment)?\s+(of\s+)?(this\s+)?lease",
        r"transfer\s+(of\s+)?(tenancy|lease|possession)",
        r"prior\s+written\s+consent\s+of\s+landlord",
        r"sole\s+(and\s+absolute\s+)?discretion",
    ],
    "guest_restrictions": [
        r"guest(s)?\s+(may\s+not|shall\s+not|must\s+not)",
        r"overnight\s+guest",
        r"\d+\s+(consecutive\s+)?(nights?|days?)\s+(per|each)",
        r"unauthorized\s+(guest|occupant)",
        r"additional\s+occupant",
        r"guest\s+policy",
    ],
}


def detect_candidate_clauses(chunk: str) -> List[str]:
    if not chunk or not chunk.strip():
        return []

    lower = chunk.lower()
    found = []

    for clause_type, patterns in CLAUSE_RULES.items():
        for pattern in patterns:
            try:
                if re.search(pattern, lower):
                    found.append(clause_type)
                    break
            except re.error as e:
                print(f"[Rules] Bad regex in {clause_type}: {e}")
                continue

    return found
