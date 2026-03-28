import json
import os
import re
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

try:
    import ollama as ollama_client
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

from few_shot import SYSTEM_PROMPT, build_prompt, FALLBACK_EXAMPLES

MODEL    = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

CLAUSE_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "clause_type":    {"type": "string"},
        "severity":       {"type": "string", "enum": ["low", "medium", "high", "unclear"]},
        "excerpt":        {"type": "string"},
        "why_it_matters": {"type": "string"},
        "plain_english":  {"type": "string"},
        "questions_to_ask": {"type": "array", "items": {"type": "string"}},
        "confidence":     {"type": "number"},
    },
    "required": ["clause_type","severity","excerpt","why_it_matters","plain_english","questions_to_ask","confidence"],
}


def analyze_clause(chunk: str, clause_type: str) -> Optional[dict]:
    if not chunk or not clause_type:
        return None
    if not OLLAMA_AVAILABLE:
        return _mock_response(clause_type)

    messages = build_prompt(chunk, clause_type)
    try:
        response = ollama_client.chat(
            model=MODEL,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, *messages],
            format=CLAUSE_JSON_SCHEMA,
            options={"temperature": 0.1, "num_predict": 512},
        )
        raw = response["message"]["content"]
        return _parse_and_fix(raw, clause_type, chunk)
    except Exception as e:
        err = str(e).lower()
        if "connection" in err or "refused" in err:
            print(f"[LLM] Ollama not running — using mock for {clause_type}")
        else:
            print(f"[LLM] Error for {clause_type}: {e}")
        return _mock_response(clause_type)


def generate_exit_letter(tenant_name, landlord_name, property_address, move_out_date, reason="personal reasons") -> str:
    if not OLLAMA_AVAILABLE:
        return _letter_template(tenant_name, landlord_name, property_address, move_out_date, reason)

    prompt = f"""Write a formal tenant notice-to-vacate letter:
- Tenant: {tenant_name}
- Landlord: {landlord_name}
- Address: {property_address}
- Move-out date: {move_out_date}
- Reason: {reason}

Write only the letter. Professional, concise, ready to send."""

    try:
        response = ollama_client.chat(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.3, "num_predict": 600},
        )
        letter = response["message"]["content"].strip()
        return letter if len(letter) > 100 else _letter_template(tenant_name, landlord_name, property_address, move_out_date, reason)
    except Exception as e:
        print(f"[LLM] Letter failed: {e}")
        return _letter_template(tenant_name, landlord_name, property_address, move_out_date, reason)


def simulate_landlord_response(scenario: str, flags: list = None) -> str:
    if not flags:
        flags = []
    if not OLLAMA_AVAILABLE:
        return _landlord_stub(scenario)

    flag_context = f"\nKnown lease clauses: {', '.join(flags)}" if flags else ""
    prompt = f"""You are a landlord responding to a tenant.
Tenant scenario: {scenario}{flag_context}
Write a realistic landlord response (2-4 sentences). Firm but professional."""

    try:
        response = ollama_client.chat(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.4, "num_predict": 200},
        )
        return response["message"]["content"].strip()
    except Exception as e:
        print(f"[LLM] Simulation failed: {e}")
        return _landlord_stub(scenario)


def _parse_and_fix(raw: str, clause_type: str, original_chunk: str) -> Optional[dict]:
    raw = re.sub(r"```json|```", "", raw).strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
            except Exception:
                return _mock_response(clause_type)
        else:
            return _mock_response(clause_type)

    data["clause_type"] = clause_type
    try:
        data["confidence"] = max(0.0, min(1.0, float(data.get("confidence", 0.7))))
    except (TypeError, ValueError):
        data["confidence"] = 0.7

    if not data.get("excerpt") or len(data["excerpt"]) < 10:
        data["excerpt"] = original_chunk[:200]
    for field in ["why_it_matters", "plain_english"]:
        if not data.get(field):
            data[field] = "Review this clause carefully before signing."
    if not data.get("questions_to_ask"):
        data["questions_to_ask"] = ["Please review this clause with a professional."]

    return data


def _mock_response(clause_type: str) -> dict:
    ex = FALLBACK_EXAMPLES.get(clause_type)
    if ex:
        return {"clause_type": clause_type, "severity": ex["severity"],
                "excerpt": ex["excerpt"][:300], "why_it_matters": ex["why_it_matters"],
                "plain_english": ex["plain_english"], "questions_to_ask": ex["questions_to_ask"],
                "confidence": ex["confidence"]}
    return {"clause_type": clause_type, "severity": "unclear",
            "excerpt": "See clause in document.", "why_it_matters": "This clause may affect your rights.",
            "plain_english": "Review this section carefully.",
            "questions_to_ask": ["Consult a legal professional about this clause."], "confidence": 0.3}


def _letter_template(tenant_name, landlord_name, property_address, move_out_date, reason) -> str:
    from datetime import date
    today = date.today().strftime("%B %d, %Y")
    return f"""{today}

{landlord_name}
Re: {property_address}

Dear {landlord_name},

I am writing to formally notify you of my intent to vacate the above-referenced
property on {move_out_date}. I am providing this notice in accordance with the
terms of my lease agreement.

My reason for vacating is {reason}.

I request that you conduct a move-out inspection and return my security deposit,
less any legitimate deductions, within the timeframe required by applicable law.
Please provide an itemized list of any deductions.

Please confirm receipt of this notice at your earliest convenience.

Sincerely,

{tenant_name}"""


def _landlord_stub(scenario: str) -> str:
    stubs = {
        "early termination": "Per your lease, early termination requires written notice and payment of the applicable fee. Please review your lease for full terms.",
        "late fee": "Your lease is clear on late payment penalties. Please contact me if you are experiencing financial hardship.",
        "repairs": "Submit maintenance requests in writing. I will schedule an inspection within 3 business days.",
        "entry": "I will provide proper notice before any future entry. I apologize for any inconvenience.",
        "sublet": "Subletting requires my prior written approval. Please submit a formal request with the proposed subtenant's information.",
    }
    for key, response in stubs.items():
        if key in scenario.lower():
            return response
    return "Thank you for reaching out. I will review your request and respond within 3 business days per our lease agreement."
