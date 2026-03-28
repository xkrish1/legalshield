# backend/few_shot.py

import json
import os
from typing import List

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "../data/processed/training_examples.json"
)

# ─────────────────────────────────────────────────────────────
# NEW JERSEY JURISDICTION CLASSIFICATION TABLE
# Source: NJ Statutes, Anti-Eviction Act (N.J.S.A. 2A:18-61.1),
#         Truth in Renting Act, Marini v. Ireland, NJ case law
#
# Weight 10 — Void / Illegal
# Weight  9 — Frequently struck down
# Weight  8 — Unenforceable / Statutorily regulated
# Weight  7 — Generally unreasonable / unlawful
# Weight  5 — Fact-dependent / Statutory violation
# Weight  0 — Lawful / Standard compliant language
# ─────────────────────────────────────────────────────────────

NJ_JURISDICTION_TABLE = {
    "void_public_policy": {
        "weight":        10,
        "label":         "Void as against public policy",
        "nj_treatment":  "Void as against public policy",
        "risk_rationale":"Courts refuse enforcement",
        "description":   "Waiver of habitability or repair rights. NJ courts will not enforce these clauses regardless of what the lease says.",
        "statute":       "Marini v. Ireland, 56 N.J. 130 (1970); N.J.S.A. 2A:42-88",
        "patterns": [
            "waives any right to repair",
            "waiver of habitability",
            "as-is condition",
            "tenant waives",
            "no warranty of habitability",
            "tenant accepts premises in as-is",
            "landlord has no obligation to repair",
            "waives right to habitable",
            "regardless of cause",
            "tenant responsible for all repairs",
        ]
    },
    "illegal_anti_eviction": {
        "weight":        10,
        "label":         "Illegal under NJ Anti-Eviction Act",
        "nj_treatment":  "Illegal (Anti-Eviction Act)",
        "risk_rationale":"Direct housing loss risk",
        "description":   "Clauses bypassing court or eviction process. NJ Anti-Eviction Act requires court process for all evictions.",
        "statute":       "N.J.S.A. 2A:18-61.1 (Anti-Eviction Act)",
        "patterns": [
            "immediate eviction",
            "automatic eviction",
            "landlord may remove tenant without",
            "eviction without notice",
            "self-help eviction",
            "landlord may lock out",
            "without court order",
            "bypassing eviction",
            "tenant may be removed without court",
            "immediate termination and removal",
        ]
    },
    "frequently_struck_down": {
        "weight":        9,
        "label":         "Frequently struck down by NJ courts",
        "nj_treatment":  "Frequently struck down",
        "risk_rationale":"High litigation exposure",
        "description":   "Excessive or disguised penalty clauses including charge-backs. NJ courts regularly invalidate these.",
        "statute":       "NJ common law on liquidated damages; N.J.S.A. 2A:42-6.1",
        "patterns": [
            "per day",
            "daily late fee",
            "daily penalty",
            "charge-back",
            "chargeback",
            "compounding fee",
            "liquidated damages",
            "penalty equal to",
            "three months rent penalty",
            "termination fee equal to",
            "forfeit and pay",
            "excessive penalty",
            "administrative penalty fee",
        ]
    },
    "unenforceable_waiver": {
        "weight":        8,
        "label":         "Unenforceable — blocks statutory remedies",
        "nj_treatment":  "Unenforceable",
        "risk_rationale":"Blocks statutory remedies",
        "description":   "Waiver of right to court, jury, or code complaints. NJ tenants cannot waive these statutory rights.",
        "statute":       "N.J.S.A. 2A:18-61.1; Truth in Renting Act N.J.S.A. 46:8-43",
        "patterns": [
            "waives right to jury",
            "waives right to court",
            "tenant waives right to sue",
            "no right to file complaint",
            "waiver of claims",
            "mandatory arbitration only",
            "no code complaints",
            "tenant shall not contact",
            "waives all remedies",
            "binding arbitration waiving",
        ]
    },
    "security_deposit_violation": {
        "weight":        8,
        "label":         "Statutorily regulated — security deposit violation",
        "nj_treatment":  "Statutorily regulated",
        "risk_rationale":"Financial penalties + tenant claims",
        "description":   "Security deposit violations on amount, handling, or forfeiture. NJ caps at 1.5x months rent; landlord owes double if wrongfully withheld.",
        "statute":       "N.J.S.A. 46:8-19; N.J.S.A. 46:8-21.2",
        "patterns": [
            "two months deposit",
            "three months deposit",
            "non-refundable deposit",
            "forfeiture of deposit",
            "forfeit security deposit",
            "deposit non-refundable",
            "90 days to return",
            "60 days to return",
            "sole discretion deduction",
            "landlord sole judgment",
            "no itemization required",
            "cleaning fee non-refundable",
            "administrative deposit fee",
            "2x monthly rent",
            "2x rent amount",
            "2x the monthly",
            "3x monthly rent",
            "3x rent amount",
            "3x the monthly",
            "(2x rent",
            "(3x rent",
            "deposit equal to 2x",
            "deposit equal to 3x",
            "deposit of 2x",
            "deposit of 3x",
            "two times the monthly rent",
            "three times the monthly rent",
            "double the monthly rent",
            "triple the monthly rent",
        ]
    },
    "unrestricted_entry": {
        "weight":        7,
        "label":         "Generally unreasonable / unlawful — landlord entry",
        "nj_treatment":  "Generally unreasonable / unlawful",
        "risk_rationale":"Privacy and quiet enjoyment",
        "description":   "Unrestricted landlord entry. NJ requires reasonable notice for multi-unit buildings (N.J.S.A. 5:10-5.1).",
        "statute":       "N.J.S.A. 5:10-5.1; Covenant of quiet enjoyment",
        "patterns": [
            "without notice",
            "without prior notice",
            "at any time",
            "at any reasonable time",
            "at landlord's discretion",
            "no advance notice required",
            "immediate access",
            "at will entry",
            "right of entry at any hour",
            "landlord may enter without",
        ]
    },
    "vague_disputed": {
        "weight":        5,
        "label":         "Fact-dependent, often disputed",
        "nj_treatment":  "Fact-dependent, often disputed",
        "risk_rationale":"Medium dispute risk",
        "description":   "Vague maintenance or fee clauses. Outcome depends on specific facts; frequently litigated in NJ courts.",
        "statute":       "NJ case law — fact-dependent",
        "patterns": [
            "vague repair",
            "reasonable maintenance",
            "as landlord determines",
            "at landlord's discretion",
            "fees as determined by landlord",
            "additional charges may apply",
            "subject to landlord approval",
            "tenant may be responsible for",
            "maintenance fees apply",
            "costs as determined",
        ]
    },
    "disclosure_violation": {
        "weight":        5,
        "label":         "Statutory violation — required disclosure missing",
        "nj_treatment":  "Statutory violation",
        "risk_rationale":"Can bar enforcement or add penalties",
        "description":   "Failure to provide required disclosures such as Truth in Renting Act notice, flood risk notice, or certificate of registration.",
        "statute":       "Truth in Renting Act N.J.S.A. 46:8-43; N.J.S.A. 46:8-50 (Flood Risk)",
        "patterns": [
            "no truth in renting",
            "no flood risk disclosure",
            "no certificate of registration",
            "no lead paint disclosure",
            "landlord not required to disclose",
            "no background check disclosure",
        ]
    },
    "lawful_standard": {
        "weight":        0,
        "label":         "Lawful — standard compliant lease language",
        "nj_treatment":  "Lawful",
        "risk_rationale":"Low risk",
        "description":   "Standard, statutorily compliant lease language. Common in NJ leases and consistent with applicable law.",
        "statute":       "NJ standard residential lease practice",
        "patterns": [
            "automatically renew",
            "automatic renewal",
            "month-to-month",
            "one month notice",
            "30 days notice",
            "24 hours notice",
            "reasonable notice",
            "normal wear and tear",
            "security deposit of one month",
            "security deposit is due upon",
            "security deposit due at signing",
            "deposit is due upon signing",
            "landlord shall maintain",
            "habitable condition",
            "landlord responsible for repairs",
            "tenant shall pay rent",
            "five business day grace",
            "30 day return of deposit",
            "itemized deductions",
        ]
    },
}


def classify_nj_jurisdiction(excerpt: str) -> dict:
    """
    Classifies a clause excerpt against the NJ jurisdiction weight table.
    Returns the matching category dict.
    Priority order: highest weight first.
    Default: lawful_standard (weight 0).
    """
    lower = excerpt.lower()

    priority_order = [
        "void_public_policy",        # weight 10
        "illegal_anti_eviction",     # weight 10
        "frequently_struck_down",    # weight 9
        "unenforceable_waiver",      # weight 8
        "security_deposit_violation",# weight 8
        "unrestricted_entry",        # weight 7
        "vague_disputed",            # weight 5
        "disclosure_violation",      # weight 5
        "lawful_standard",           # weight 0
    ]

    for category in priority_order:
        cat = NJ_JURISDICTION_TABLE[category]
        for pattern in cat["patterns"]:
            if pattern in lower:
                return {
                    "category":      category,
                    "weight":        cat["weight"],
                    "label":         cat["label"],
                    "nj_treatment":  cat["nj_treatment"],
                    "risk_rationale":cat["risk_rationale"],
                    "description":   cat["description"],
                    "statute":       cat["statute"],
                    "matched_pattern": pattern,
                }

    # Default — no match found
    default = NJ_JURISDICTION_TABLE["lawful_standard"]
    return {
        "category":      "lawful_standard",
        "weight":        0,
        "label":         default["label"],
        "nj_treatment":  default["nj_treatment"],
        "risk_rationale":default["risk_rationale"],
        "description":   default["description"],
        "statute":       default["statute"],
        "matched_pattern": None,
    }


def weight_to_severity(weight: int) -> str:
    """Maps NJ jurisdiction weight (0-10) to our severity scale."""
    if weight >= 9:  return "high"
    if weight >= 7:  return "high"
    if weight >= 5:  return "medium"
    if weight >= 1:  return "medium"
    return "low"


SYSTEM_PROMPT = """You are LeaseShield, an expert residential lease risk analyzer for NJ renters.

You analyze lease clause excerpts and return structured JSON risk assessments.
You are trained on New Jersey landlord-tenant law and the following jurisdiction table.

NJ JURISDICTION WEIGHT TABLE:
  Weight 10 — Void as against public policy (habitability/repair waivers)
               Courts refuse enforcement — Marini v. Ireland, N.J.S.A. 2A:42-88
  Weight 10 — Illegal under Anti-Eviction Act (bypassing court/eviction process)
               Direct housing loss risk — N.J.S.A. 2A:18-61.1
  Weight  9 — Frequently struck down (excessive/disguised penalty clauses, charge-backs)
               High litigation exposure
  Weight  8 — Unenforceable (waiver of court/jury/code complaint rights)
               Blocks statutory remedies
  Weight  8 — Statutorily regulated (security deposit violations: amount, handling, forfeiture)
               Financial penalties + tenant claims — N.J.S.A. 46:8-19, 46:8-21.2
  Weight  7 — Generally unreasonable/unlawful (unrestricted landlord entry)
               Privacy and quiet enjoyment — N.J.S.A. 5:10-5.1
  Weight  5 — Fact-dependent, often disputed (vague maintenance or fee clauses)
               Medium dispute risk
  Weight  5 — Statutory violation (missing disclosures: Truth in Renting, flood risk)
               Can bar enforcement or add penalties — N.J.S.A. 46:8-43
  Weight  0 — Lawful (standard, statutorily compliant lease language)
               Low risk

SEVERITY MAPPING FROM WEIGHT:
  Weight 10, 9, 7 → HIGH severity
  Weight 8, 5     → MEDIUM severity
  Weight 0        → LOW severity

KEY NJ RULES:
- Habitability cannot be waived (Marini v. Ireland) → weight 10
- All evictions require court process (Anti-Eviction Act) → weight 10
- Late fees: 5 business day grace period required (N.J.S.A. 2A:42-6.1)
- Security deposit max = 1.5 months rent; return within 30 days with itemized list
- Landlord entry: minimum 1 day notice for multi-unit buildings
- Truth in Renting guide must be provided at lease signing
- Standard automatic renewal = weight 0 (lawful, common in NJ)

CALIBRATION RULES — read these before assigning severity:
- Late fee with a grace period of 5+ business days AND a flat dollar amount (not per-day) = LOW severity, weight 0.
- "Security deposit due at signing" or similar timing language = LOW severity, weight 0. Only flag if the excerpt states an amount exceeding 1.5x months rent, a return window shorter than 30 days, or sole-discretion deductions.
- Automatic renewal with standard notice period = LOW severity, weight 0.
- Do NOT upgrade severity based on clause type alone. Base it only on the actual words in the excerpt.
- If the excerpt is ambiguous or the interpretation is unclear, use MEDIUM severity — never HIGH. HIGH is reserved for clauses that clearly and directly conflict with NJ law.
- If the excerpt is benign or standard, use LOW severity.

STRICT OUTPUT RULES:
1. Return ONLY valid JSON. No preamble. No markdown. Just the JSON.
2. Use ONLY text from the excerpt. Never invent facts.
3. Do NOT say a clause is illegal — say it "may conflict with NJ law" or "courts have refused enforcement".
4. Do NOT provide legal advice.
5. Standard compliant clauses (weight 0) MUST have severity "low".
6. excerpt must be direct quote max 300 chars.
7. Always include nj_category with weight, label, nj_treatment, risk_rationale.

OUTPUT FORMAT:
{
  "clause_type": "<type>",
  "severity": "<low|medium|high|unclear>",
  "excerpt": "<direct quote max 300 chars>",
  "why_it_matters": "<1-2 sentences>",
  "plain_english": "<1-2 sentences>",
  "questions_to_ask": ["<q1>", "<q2>"],
  "confidence": <0.0-1.0>,
  "nj_category": {
    "weight":        <0-10>,
    "label":         "<label from table>",
    "nj_treatment":  "<NJ law treatment>",
    "risk_rationale":"<risk rationale>",
    "statute":       "<applicable statute>"
  }
}"""


# ─────────────────────────────────────────────────────────────
# FALLBACK EXAMPLES
# Each annotated with NJ jurisdiction category and weight
# ─────────────────────────────────────────────────────────────

FALLBACK_EXAMPLES = {

    "automatic_renewal": {
        "excerpt":   "This lease shall automatically renew for successive one-year terms unless Tenant provides written notice of non-renewal at least sixty (60) days prior.",
        # NJ CATEGORY: Lawful — weight 0
        # Automatic renewal = standard compliant lease language in NJ
        # 60-day notice window is aggressive but not illegal
        "nj_category": {
            "weight":        0,
            "label":         "Lawful — standard compliant lease language",
            "nj_treatment":  "Lawful",
            "risk_rationale":"Low risk",
            "statute":       "NJ standard residential lease practice",
            "note":          "Automatic renewal is common and normal in NJ leases. The 60-day notice window is aggressive but not prohibited."
        },
        "severity":  "low",
        "why_it_matters":   "Automatic renewal is standard in NJ leases. The 60-day notice window is longer than typical — know your exact deadline to avoid being locked in for another year.",
        "plain_english":    "Your lease renews automatically. This is normal in NJ. Just make sure you know the notice deadline if you plan to leave.",
        "questions_to_ask": ["What is the exact calendar date I must submit notice by?", "Does notice need to be in writing via certified mail?"],
        "confidence": 0.90,
    },

    "late_fees": {
        "excerpt":   "A late charge of $150 per day shall be assessed for each day rent remains unpaid after the 3rd.",
        # NJ CATEGORY: Frequently struck down — weight 9
        # Daily compounding late fees = excessive penalty clause
        # NJ courts regularly invalidate these; also violates 5-day grace period rule
        "nj_category": {
            "weight":        9,
            "label":         "Frequently struck down by NJ courts",
            "nj_treatment":  "Frequently struck down",
            "risk_rationale":"High litigation exposure",
            "statute":       "N.J.S.A. 2A:42-6.1 (5-day grace period); NJ common law on excessive penalties",
            "note":          "Daily late fees are excessive penalty clauses regularly struck down by NJ courts. Also violates mandatory 5 business day grace period."
        },
        "severity":  "high",
        "why_it_matters":   "Daily late fees are excessive penalty clauses that NJ courts frequently refuse to enforce. This clause also violates the mandatory 5 business day grace period under N.J.S.A. 2A:42-6.1.",
        "plain_english":    "NJ law gives you 5 business days before any late fee can apply. A $150 per day fee on top of that is the type of excessive penalty NJ courts regularly throw out.",
        "questions_to_ask": ["Are you aware NJ law requires a 5 business day grace period before late fees apply?", "Has this daily fee clause ever been tested in NJ court?"],
        "confidence": 0.95,
    },

    "landlord_entry": {
        "excerpt":   "Landlord may enter the premises at any time without prior notice to Tenant.",
        # NJ CATEGORY: Generally unreasonable/unlawful — weight 7
        # Unrestricted entry violates quiet enjoyment and N.J.S.A. 5:10-5.1
        "nj_category": {
            "weight":        7,
            "label":         "Generally unreasonable / unlawful — landlord entry",
            "nj_treatment":  "Generally unreasonable / unlawful",
            "risk_rationale":"Privacy and quiet enjoyment",
            "statute":       "N.J.S.A. 5:10-5.1; covenant of quiet enjoyment",
            "note":          "NJ requires at minimum 1 day reasonable notice for multi-unit buildings. No-notice entry violates quiet enjoyment rights."
        },
        "severity":  "high",
        "why_it_matters":   "NJ law requires landlords of multi-unit buildings to give at least one day reasonable notice before entry. No-notice entry violates your right to quiet enjoyment.",
        "plain_english":    "Your landlord cannot walk in without notice under NJ law. This clause conflicts with N.J.S.A. 5:10-5.1 which requires reasonable notice.",
        "questions_to_ask": ["Will you agree to provide at least 24 hours advance notice in writing?", "Are you aware NJ law requires reasonable notice before entry?"],
        "confidence": 0.93,
    },

    "early_termination": {
        "excerpt":   "Tenant shall be liable for all remaining rent plus a termination fee equal to three months rent and shall forfeit the security deposit.",
        # NJ CATEGORY: Multiple categories — worst is security deposit violation weight 8
        # + frequently struck down weight 9 for stacked excessive penalties
        # Use highest weight = 9
        "nj_category": {
            "weight":        9,
            "label":         "Frequently struck down by NJ courts",
            "nj_treatment":  "Frequently struck down",
            "risk_rationale":"High litigation exposure",
            "statute":       "N.J.S.A. 46:8-19 (deposit); NJ common law on liquidated damages",
            "note":          "Stacked penalties (remaining rent + 3-month fee + deposit forfeiture) are excessive penalty clauses. NJ courts frequently refuse to enforce penalty stacking. Deposit forfeiture also violates N.J.S.A. 46:8-19."
        },
        "severity":  "high",
        "why_it_matters":   "Stacking three separate penalties — remaining rent, a 3-month fee, and deposit forfeiture — is the type of excessive penalty clause NJ courts frequently strike down. The deposit forfeiture specifically violates NJ security deposit law.",
        "plain_english":    "This clause piles three penalties on top of each other. NJ courts regularly refuse to enforce this kind of penalty stacking, and the deposit forfeiture piece violates NJ statute.",
        "questions_to_ask": ["Is the landlord required to mitigate by attempting to re-rent the unit?", "Has this penalty clause ever been tested in NJ court?"],
        "confidence": 0.96,
    },

    "security_deposit": {
        "excerpt":   "Tenant shall pay a security deposit of two months rent. Deposit will be returned within 60 days less deductions as determined solely by Landlord.",
        # NJ CATEGORY: Statutorily regulated violation — weight 8
        # Two months exceeds NJ 1.5x cap
        # 60-day return violates 30-day NJ requirement
        # Sole discretion bypasses itemization requirement
        "nj_category": {
            "weight":        8,
            "label":         "Statutorily regulated — security deposit violation",
            "nj_treatment":  "Statutorily regulated",
            "risk_rationale":"Financial penalties + tenant claims",
            "statute":       "N.J.S.A. 46:8-19 (30-day return, itemized); N.J.S.A. 46:8-21.2 (1.5x cap)",
            "note":          "Three violations: (1) two months exceeds NJ 1.5x cap, (2) 60 days violates 30-day return requirement, (3) sole discretion bypasses mandatory itemization. Tenant can sue for double the wrongfully withheld amount."
        },
        "severity":  "high",
        "why_it_matters":   "This clause violates NJ law three ways: the deposit exceeds the 1.5 month cap, the 60-day return window violates the 30-day requirement, and sole discretion deductions bypass NJ's mandatory itemization rule. You can sue for double the wrongfully withheld amount.",
        "plain_english":    "In NJ, deposits are capped at 1.5 months rent, must be returned within 30 days with an itemized list. This clause breaks all three rules.",
        "questions_to_ask": ["Are you aware NJ caps security deposits at 1.5 months rent?", "Will you provide itemized deductions within 30 days of move-out as required by NJ law?"],
        "confidence": 0.97,
    },

    "maintenance_repairs": {
        "excerpt":   "Tenant shall be responsible for all repairs including plumbing, electrical, HVAC and appliances regardless of cause.",
        # NJ CATEGORY: Void as against public policy — weight 10
        # Full repair waiver = habitability waiver = void under Marini v. Ireland
        "nj_category": {
            "weight":        10,
            "label":         "Void as against public policy",
            "nj_treatment":  "Void as against public policy",
            "risk_rationale":"Courts refuse enforcement",
            "statute":       "Marini v. Ireland, 56 N.J. 130 (1970); N.J.S.A. 2A:42-88",
            "note":          "Shifting all repair responsibility to tenant including structural systems = waiver of habitability. NJ courts refuse to enforce such clauses under Marini v. Ireland."
        },
        "severity":  "high",
        "why_it_matters":   "Under the landmark NJ case Marini v. Ireland, landlords cannot waive their obligation to maintain habitable premises. NJ courts refuse to enforce clauses that shift all repair responsibility to tenants.",
        "plain_english":    "NJ law (Marini v. Ireland) says landlords must keep your home habitable. This clause tries to override that — courts will not allow it.",
        "questions_to_ask": ["Are you aware NJ courts void habitability waivers under Marini v. Ireland?", "Can we rewrite this to assign structural repairs to the landlord and minor maintenance to the tenant?"],
        "confidence": 0.96,
    },

    "subletting": {
        "excerpt":   "Tenant may not sublet without prior written consent which may be withheld at Landlord's sole discretion.",
        # NJ CATEGORY: Vague/disputed — weight 5
        # NJ has no subletting statute so lease terms control
        # Sole discretion is aggressive but not illegal
        "nj_category": {
            "weight":        5,
            "label":         "Fact-dependent, often disputed",
            "nj_treatment":  "Fact-dependent, often disputed",
            "risk_rationale":"Medium dispute risk",
            "statute":       "No NJ statute on subletting — governed by lease terms",
            "note":          "NJ has no subletting statute. Sole discretion language is enforceable but aggressive. Outcome depends on facts and any implied covenant of good faith."
        },
        "severity":  "medium",
        "why_it_matters":   "NJ has no subletting statute so this clause is generally enforceable. However sole discretion denials may be challenged under an implied good faith obligation in some circumstances.",
        "plain_english":    "Your landlord can refuse subletting for any reason in NJ since there is no state law protecting subletting rights. This is common but limiting.",
        "questions_to_ask": ["Under what circumstances would you approve a sublease?", "Would you consider changing this to require that consent not be unreasonably withheld?"],
        "confidence": 0.84,
    },

    "guest_restrictions": {
        "excerpt":   "No guest may stay more than three consecutive nights. Violation constitutes grounds for immediate eviction.",
        # NJ CATEGORY: Illegal under Anti-Eviction Act — weight 10
        # "Immediate eviction" = bypassing court/eviction process = illegal in NJ
        "nj_category": {
            "weight":        10,
            "label":         "Illegal under NJ Anti-Eviction Act",
            "nj_treatment":  "Illegal (Anti-Eviction Act)",
            "risk_rationale":"Direct housing loss risk",
            "statute":       "N.J.S.A. 2A:18-61.1 (Anti-Eviction Act)",
            "note":          "Immediate eviction without court process is illegal in NJ. The Anti-Eviction Act requires landlords to obtain a court judgment before any eviction. This clause's eviction threat is unenforceable."
        },
        "severity":  "high",
        "why_it_matters":   "The 'immediate eviction' threat in this clause is illegal in NJ. The Anti-Eviction Act requires a court judgment for all evictions — a landlord cannot evict you without going to court regardless of what the lease says.",
        "plain_english":    "In NJ, no eviction can happen without a court order. The immediate eviction threat in this clause is not enforceable under the Anti-Eviction Act.",
        "questions_to_ask": ["Are you aware that NJ law requires a court judgment for all evictions?", "Is this guest restriction included in the standard lease form or added by you?"],
        "confidence": 0.95,
    },
}


def build_prompt(chunk: str, clause_type: str, region: str = "", fee_context: dict = None, severity_hint: str = None) -> List[dict]:
    """
    Builds the full message array for Ollama.
    Injects NJ jurisdiction context and pre-computed fee analysis into every prompt.
    """
    messages = []
    example  = _get_example(clause_type)

    if example:
        region_line = f"\nRegion: {region}" if region else "\nRegion: New Jersey"
        messages.append({
            "role": "user",
            "content": f'Clause type hint: {clause_type}{region_line}\n\nExcerpt:\n"{example["excerpt"]}"',
        })
        assistant_content = {
            "clause_type":      clause_type,
            "severity":         example["severity"],
            "excerpt":          example["excerpt"][:300],
            "why_it_matters":   example["why_it_matters"],
            "plain_english":    example["plain_english"],
            "questions_to_ask": example["questions_to_ask"],
            "confidence":       example["confidence"],
        }
        if "nj_category" in example:
            assistant_content["nj_category"] = example["nj_category"]
        messages.append({
            "role": "assistant",
            "content": json.dumps(assistant_content),
        })

    region_line = f"\nRegion: {region}" if region else "\nRegion: New Jersey"

    # Inject pre-computed fee math so the model explains rather than classifies.
    fee_line = ""
    if fee_context:
        pct   = fee_context.get("fee_pct_of_rent")
        daily = fee_context.get("is_daily_fee")
        rat   = fee_context.get("rationale", "")
        sev   = fee_context.get("severity_signal", "medium").upper()

        if daily:
            fee_line = (
                f"\n\nFEE ANALYSIS (pre-computed): This is a DAILY fee. "
                f"Severity is HIGH. {rat} "
                f"Explain to the tenant why daily fees are problematic in NJ."
            )
        elif pct is not None:
            fee_line = (
                f"\n\nFEE ANALYSIS (pre-computed): Fee is {pct}% of monthly rent. "
                f"Severity is {sev}. {rat} "
                f"Use this calculation in your explanation. "
                f"Do NOT override this severity in your JSON output."
            )
        else:
            fee_line = (
                f"\n\nFEE ANALYSIS (pre-computed): {rat} Severity defaulted to {sev}."
            )

    severity_line = ""
    if severity_hint:
        severity_line = (
            f"\n\nSEVERITY INSTRUCTION: The severity for this clause has been "
            f"pre-determined as '{severity_hint.upper()}'. You MUST use '{severity_hint}' "
            f"in your JSON output. Do not change this. "
            f"Your job is only to write why_it_matters and plain_english."
        )

    messages.append({
        "role": "user",
        "content": (
            f'Clause type hint: {clause_type}{region_line}'
            f'{fee_line}'
            f'{severity_line}'
            f'\n\nIMPORTANT: The excerpt field in your JSON MUST be a direct quote '
            f'from the chunk below. Do not use text from the example above.'
            f'\n\nExcerpt:\n"{chunk[:800]}"'
        ),
    })

    return messages


def _get_example(clause_type: str) -> dict:
    """Try dataset first, fall back to hardcoded."""
    try:
        if os.path.exists(DATASET_PATH):
            with open(DATASET_PATH) as f:
                data = json.load(f)
            examples = data.get("examples", {}).get(clause_type, [])
            if examples:
                return examples[0]
    except Exception:
        pass
    return FALLBACK_EXAMPLES.get(clause_type, {})