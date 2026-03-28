import json
import os
from typing import List

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "../data/processed/training_examples.json"
)

SYSTEM_PROMPT = """You are LeaseShield, a lease analysis assistant for renters.

Analyze the provided lease excerpt and return ONLY a valid JSON object.
No preamble. No explanation. No markdown. Just the JSON.

RULES:
- Use ONLY text from the excerpt. Do not invent facts.
- Do NOT say a clause is illegal or enforceable.
- Do NOT give legal advice.
- If unclear, set severity to "unclear" and confidence below 0.5.
- excerpt field must be a direct quote (max 300 chars).
- questions_to_ask must be 2-3 practical questions for the landlord.

REQUIRED OUTPUT FORMAT:
{
  "clause_type": "<automatic_renewal|early_termination|late_fees|security_deposit|maintenance_repairs|landlord_entry|subletting|guest_restrictions>",
  "severity": "<low|medium|high|unclear>",
  "excerpt": "<direct quote max 300 chars>",
  "why_it_matters": "<1-2 sentences on risk>",
  "plain_english": "<1-2 sentences plain language>",
  "questions_to_ask": ["<question 1>", "<question 2>"],
  "confidence": <0.0 to 1.0>
}"""

FALLBACK_EXAMPLES = {
    "automatic_renewal": {
        "excerpt": "This lease shall automatically renew for successive one-year terms unless Tenant provides written notice of non-renewal at least sixty (60) days prior.",
        "severity": "high",
        "why_it_matters": "Missing the 60-day window locks you into another full year.",
        "plain_english": "Your lease renews itself every year. Miss the deadline by one day and you owe another year of rent.",
        "questions_to_ask": ["What is the exact date I must submit notice by?", "Does notice need to be certified mail?"],
        "confidence": 0.95,
    },
    "late_fees": {
        "excerpt": "A late charge of $150 per day shall be assessed for each day rent remains unpaid after the 3rd.",
        "severity": "high",
        "why_it_matters": "Daily fees compound rapidly — one week late equals over $1,000.",
        "plain_english": "If rent is late past the 3rd, you owe $150 for every single day it stays unpaid.",
        "questions_to_ask": ["Is a daily late fee enforceable here?", "Is there a maximum cap on total fees?"],
        "confidence": 0.97,
    },
    "landlord_entry": {
        "excerpt": "Landlord may enter the premises at any time without prior notice to Tenant.",
        "severity": "high",
        "why_it_matters": "No-notice entry eliminates your privacy rights.",
        "plain_english": "Your landlord can walk in at any time without telling you first.",
        "questions_to_ask": ["Will you agree to 24 hours notice in writing?", "What qualifies as an emergency?"],
        "confidence": 0.96,
    },
    "early_termination": {
        "excerpt": "Tenant shall be liable for all remaining rent plus a termination fee equal to three months rent and forfeit the security deposit.",
        "severity": "high",
        "why_it_matters": "Three penalties stack: remaining rent, a 3-month fee, and full deposit loss.",
        "plain_english": "Breaking this lease costs remaining rent PLUS 3 months penalty PLUS your deposit.",
        "questions_to_ask": ["Is the landlord required to re-rent the unit?", "Are there hardship exemptions?"],
        "confidence": 0.98,
    },
    "security_deposit": {
        "excerpt": "Deposit will be returned within 60 days less deductions as determined solely by Landlord.",
        "severity": "medium",
        "why_it_matters": "Sole discretion gives landlord unchecked power over deductions.",
        "plain_english": "The landlord alone decides what to deduct from your deposit with no objective standard.",
        "questions_to_ask": ["Will you provide itemized deductions with receipts?", "Can we do a move-in walkthrough?"],
        "confidence": 0.88,
    },
    "maintenance_repairs": {
        "excerpt": "Tenant shall be responsible for all repairs including plumbing, electrical, and HVAC regardless of cause.",
        "severity": "high",
        "why_it_matters": "Full repair liability exposes you to thousands in costs normally borne by landlords.",
        "plain_english": "You pay for everything that breaks — including heating, plumbing, and appliances.",
        "questions_to_ask": ["Does local law permit waiving landlord repair obligations?", "Can we limit this to minor repairs?"],
        "confidence": 0.94,
    },
    "subletting": {
        "excerpt": "Tenant may not sublet without prior written consent which may be withheld at Landlord's sole discretion.",
        "severity": "medium",
        "why_it_matters": "Landlord can refuse subletting for any reason, trapping you in the lease.",
        "plain_english": "You cannot sublet your apartment and the landlord can say no for any reason.",
        "questions_to_ask": ["Under what circumstances would you approve a sublease?", "Can consent not be unreasonably withheld?"],
        "confidence": 0.87,
    },
    "guest_restrictions": {
        "excerpt": "No guest may stay more than three consecutive nights. Violation constitutes grounds for immediate eviction.",
        "severity": "medium",
        "why_it_matters": "Tying a short guest limit to immediate eviction is unusually aggressive.",
        "plain_english": "Guests can only stay 3 nights in a row. Exceed that and your landlord can evict you.",
        "questions_to_ask": ["Does this apply to family or caregivers?", "How will this be enforced?"],
        "confidence": 0.89,
    },
}


def build_prompt(chunk: str, clause_type: str) -> List[dict]:
    messages = []
    example = _get_example(clause_type)

    if example:
        messages.append({
            "role": "user",
            "content": f'Clause type hint: {clause_type}\n\nExcerpt:\n"{example["excerpt"]}"',
        })
        messages.append({
            "role": "assistant",
            "content": json.dumps({
                "clause_type": clause_type,
                "severity": example["severity"],
                "excerpt": example["excerpt"][:300],
                "why_it_matters": example["why_it_matters"],
                "plain_english": example["plain_english"],
                "questions_to_ask": example["questions_to_ask"],
                "confidence": example["confidence"],
            }),
        })

    messages.append({
        "role": "user",
        "content": f'Clause type hint: {clause_type}\n\nExcerpt:\n"{chunk[:800]}"',
    })
    return messages


def _get_example(clause_type: str) -> dict:
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
