"""
backend/nearby_data/generate.py

Generates 7 mock lease PDFs for New Brunswick, NJ demo addresses,
runs them through the full analysis pipeline, and writes index.json.

Run once (or after changing lease text):
  cd /path/to/leaseshield
  source backend/venv/bin/activate
  python backend/nearby_data/generate.py
"""

import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fpdf import FPDF
from pdf_utils import extract_text_from_pdf
from chunking import chunk_lease_text
from rules import detect_candidate_clauses
from llm import analyze_clause, set_lease_rent
from fee_analysis import extract_rent_from_lease, analyze_late_fee
from few_shot import classify_nj_jurisdiction, weight_to_severity
from scoring import compute_risk_score, get_risk_bucket, build_summary
from schemas import ClauseFlag

OUT_DIR = os.path.dirname(__file__)

# ── 7 New Brunswick, NJ properties ───────────────────────────────────────────
# Coordinates verified against OpenStreetMap for New Brunswick NJ streets.
PROPERTIES = [
    {
        "id":        "nb_001",
        "address":   "45 Livingston Ave, Apt 3",
        "zip":       "08901",
        "lat":       40.4908,
        "lng":      -74.4441,
        "avg_rent":  1800,
    },
    {
        "id":        "nb_002",
        "address":   "88 George St, Unit 2B",
        "zip":       "08901",
        "lat":       40.4863,
        "lng":      -74.4492,
        "avg_rent":  1950,
    },
    {
        "id":        "nb_003",
        "address":   "220 Somerset St, Apt 5",
        "zip":       "08901",
        "lat":       40.4882,
        "lng":      -74.4518,
        "avg_rent":  1700,
    },
    {
        "id":        "nb_004",
        "address":   "15 Joyce Kilmer Ave, Unit 1",
        "zip":       "08901",
        "lat":       40.4840,
        "lng":      -74.4458,
        "avg_rent":  1650,
    },
    {
        "id":        "nb_005",
        "address":   "340 Easton Ave, Apt 7C",
        "zip":       "08901",
        "lat":       40.4773,
        "lng":      -74.4389,
        "avg_rent":  2100,
    },
    {
        "id":        "nb_006",
        "address":   "67 French St, Unit 3",
        "zip":       "08901",
        "lat":       40.4848,
        "lng":      -74.4534,
        "avg_rent":  1550,
    },
    {
        "id":        "nb_007",
        "address":   "10 Albany St, Unit 12",
        "zip":       "08901",
        "lat":       40.4874,
        "lng":      -74.4503,
        "avg_rent":  1725,
    },
]

# ── Mock lease text per property ──────────────────────────────────────────────

def lease_nb_001():
    """45 Livingston Ave -- LOW risk. Minimal fair NJ lease, lawful terms only."""
    return """RESIDENTIAL LEASE AGREEMENT
Property: 45 Livingston Ave, Apt 3, New Brunswick, NJ 08901

SECTION 1 --PARTIES
Landlord: Livingston Properties LLC
Tenant: [Tenant Name]

SECTION 2 --TERM AND RENT
This lease is for a term of twelve (12) months. Monthly rent is $1,800.00
paid as follows: $1,800 per month, due on the first of each month.
A five business day grace period applies before any late charges.

SECTION 3 --SECURITY DEPOSIT
A security deposit of one month's rent ($1,800.00) is required at signing.
Security deposit of one month is held per NJ statute. Landlord shall
return the security deposit within 30 day return of deposit after move-out
with itemized deductions. Normal wear and tear shall not be deducted.

SECTION 4 --LATE PAYMENT
A late fee of $36.00 applies if rent is not received by the 5th of the month.
This late fee of $36.00 represents 2% of monthly rent and applies only
after the five business day grace period.

SECTION 5 --GENERAL CONDITIONS
Landlord responsible for repairs to all structural systems, plumbing, heating,
and electrical. Landlord shall maintain the unit in habitable condition.
Either party may terminate with 30 days written notice at the end of term.

Landlord: _________________________ Date: _________
Tenant:  _________________________ Date: _________
"""


def lease_nb_002():
    """88 George St --MODERATE risk. Some unfavorable terms."""
    return """RESIDENTIAL LEASE AGREEMENT
Property: 88 George St, Unit 2B, New Brunswick, NJ 08901

SECTION 1 --PARTIES
Landlord: George Street Realty Inc.
Tenant: [Tenant Name]

SECTION 2 --TERM AND RENT
This lease is for a term of twelve (12) months. Monthly rent shall be
$1,950.00 paid as follows: $1,950 per month due on the first.

SECTION 3 --SECURITY DEPOSIT
Tenant shall pay a security deposit equal to one and a half (1.5) months
rent ($2,925.00) upon signing. Deductions shall be at Landlord's sole
discretion for any damage beyond normal wear and tear. Landlord shall
return within 30 days of termination with itemized deductions.

SECTION 4 --LATE FEES
Rent not received by the 5th shall be subject to a late fee of 8% of
the monthly rent amount. This fee shall be applied automatically.

SECTION 5 --MAINTENANCE AND REPAIRS
Landlord shall maintain structural systems. Additional maintenance fees
may apply as landlord determines for repairs caused by tenant use.
Tenant is responsible for all appliance maintenance.

SECTION 6 --LANDLORD ENTRY
Upon reasonable notice, the Landlord may enter the House for inspection
or repairs. 24 hours notice is standard but Landlord reserves the right
to enter at any reasonable time for urgent maintenance matters.

SECTION 7 --AUTOMATIC RENEWAL
This lease shall automatically renew for successive one-year terms unless
Tenant provides 60 days written notice prior to the lease end date.
Failure to provide timely notice shall bind Tenant to an additional term.

SECTION 8 --SUBLETTING
Subletting is not permitted under any circumstances without Landlord's
prior written consent. Violation constitutes grounds for eviction.

SECTION 9 --GUESTS
Guests may stay no more than 7 consecutive days or 10 days per month.
Guests staying longer shall be considered unauthorized occupants.

Landlord: _________________________ Date: _________
Tenant:  _________________________ Date: _________
"""


def lease_nb_003():
    """220 Somerset St --HIGH risk. Multiple serious violations."""
    return """RESIDENTIAL LEASE AGREEMENT
Property: 220 Somerset St, Apt 5, New Brunswick, NJ 08901

SECTION 1 --PARTIES
Landlord: Somerset Holdings Group
Tenant: [Tenant Name]

SECTION 2 --TERM AND RENT
Monthly rent shall be $1,700.00 per month paid as follows: $1,700 per month.

SECTION 3 --SECURITY DEPOSIT
Tenant shall pay a security deposit equal to 2x monthly rent ($3,400.00)
upon signing. The deposit is due upon signing and is non-refundable in the
event of early termination. Landlord shall have sole discretion in determining
deductions. No itemization required if damage exceeds deposit amount.

SECTION 4 --LATE FEES
Any rent not received by the 1st of the month shall be subject to a late fee
of $200.00 plus a daily penalty of $25 per day until paid in full. These
fees shall compound daily. Landlord may charge-back any collection costs.

SECTION 5 --MAINTENANCE AND REPAIRS
Tenant accepts premises in as-is condition. Tenant waives any right to repair
or habitability claims. Tenant is responsible for all repairs regardless of
cause. Landlord has no obligation to repair any systems during the lease term.

SECTION 6 --LANDLORD ENTRY
Landlord may enter the premises at any time without prior notice to Tenant
for inspections, repairs, or any other purpose at Landlord's discretion.

SECTION 7 --AUTOMATIC RENEWAL
This lease shall automatically renew annually. Tenant must provide 90 days
written notice to avoid renewal. No notice from Landlord is required.

SECTION 8 --SUBLETTING
Subletting, assignment, or any transfer of occupancy rights is strictly
prohibited. Violation results in immediate termination and removal.

SECTION 9 --EARLY TERMINATION
If Tenant terminates before the end of the lease term, Tenant shall forfeit
the full security deposit and pay two months rent as a liquidated penalty.

Landlord: _________________________ Date: _________
Tenant:  _________________________ Date: _________
"""


def lease_nb_004():
    """15 Joyce Kilmer Ave --LOW risk. Clean standard lease."""
    return """RESIDENTIAL LEASE AGREEMENT
Property: 15 Joyce Kilmer Ave, Unit 1, New Brunswick, NJ 08901

SECTION 1 --PARTIES
Landlord: Joyce Properties LLC
Tenant: [Tenant Name]

SECTION 2 --TERM AND RENT
This lease is for twelve (12) months. Monthly rent is $1,650.00 paid as
follows: $1,650 per month due on the first day of each month.

SECTION 3 --SECURITY DEPOSIT
A security deposit of one month's rent ($1,650.00) is due upon signing.
Security deposit is due at signing. Landlord shall return the security
deposit within 30 days of vacating with itemized deductions. Normal wear
and tear shall not be deducted.

SECTION 4 --LATE FEES
A late fee of $40.00 shall apply if rent is not received by the 5th of
the month. Tenant has a five business day grace period.

SECTION 5 --MAINTENANCE AND REPAIRS
Landlord is responsible for all structural repairs and maintaining the
premises in habitable condition. Landlord responsible for repairs to
heating, plumbing, and electrical systems. Tenant shall report issues
promptly in writing.

SECTION 6 --LANDLORD ENTRY
Landlord shall provide at least 24 hours notice before entering the
premises. Entry shall occur only during reasonable hours except in
genuine emergencies. Tenant's right to quiet enjoyment is respected.

SECTION 7 --RENEWAL
Tenant must provide 30 days notice of intent not to renew. If no notice
is provided, the lease converts to month-to-month automatically.

SECTION 8 --SUBLETTING
Subletting requires written Landlord approval, which shall not be
unreasonably withheld. Tenant remains liable under original lease terms.

Landlord: _________________________ Date: _________
Tenant:  _________________________ Date: _________
"""


def lease_nb_005():
    """340 Easton Ave --HIGH risk. Severe violations throughout."""
    return """RESIDENTIAL LEASE AGREEMENT
Property: 340 Easton Ave, Apt 7C, New Brunswick, NJ 08901

SECTION 1 --PARTIES
Landlord: Easton Avenue LLC
Tenant: [Tenant Name]

SECTION 2 --TERM AND RENT
Monthly rent is $2,100.00 paid as follows: $2,100 per month due on the 1st.
Annual rent total $25,200.

SECTION 3 --SECURITY DEPOSIT
Tenant shall pay a security deposit equal to 3x monthly rent ($6,300.00)
upon signing. Security deposit is non-refundable for any lease termination
prior to expiration. Deductions are at Landlord's sole judgment with no
itemization required.

SECTION 4 --LATE FEES
A daily late fee of $50 per day applies immediately upon the 2nd of the
month if rent has not been received. This fee compounds daily with no
grace period. Additional chargeback fees apply for processing.

SECTION 5 --MAINTENANCE AND REPAIRS
Tenant accepts premises in as-is condition and waives right to habitable
conditions claims. Tenant is responsible for all repairs regardless of
cause. Landlord has no obligation to repair during lease term.

SECTION 6 --LANDLORD ENTRY
Landlord may enter the premises without notice to Tenant at any time.
Landlord may enter without prior notice for inspections at will.

SECTION 7 --AUTOMATIC RENEWAL
This lease automatically renews for one year terms. Tenant must provide
90 days advance written notice before lease expiration to avoid renewal.

SECTION 8 --SUBLETTING
Subletting is prohibited. Any unauthorized occupant shall result in
immediate termination and removal without court order.

SECTION 9 --GUESTS
No guests may stay overnight more than 2 consecutive nights or more
than 4 nights total per month. Violations result in lease termination.

Landlord: _________________________ Date: _________
Tenant:  _________________________ Date: _________
"""


def lease_nb_006():
    """67 French St -- MODERATE risk. High late fee pct but otherwise standard."""
    return """RESIDENTIAL LEASE AGREEMENT
Property: 67 French St, Unit 3, New Brunswick, NJ 08901

SECTION 1 --PARTIES
Landlord: French Street Properties
Tenant: [Tenant Name]

SECTION 2 --TERM AND RENT
This lease is for twelve (12) months. Monthly rent is $1,550.00 paid as
follows: $1,550 per month due on the first.

SECTION 3 --SECURITY DEPOSIT
Tenant shall pay a security deposit of one month's rent ($1,550.00).
Security deposit is due upon signing. Landlord shall return the security
deposit within 30 day return of deposit with itemized deductions.
Normal wear and tear shall not be deducted.

SECTION 4 --LATE FEES
Rent not received by the 5th incurs a late fee of 8% of monthly rent.
This late fee percentage is charged once per month only.

SECTION 5 --MAINTENANCE AND REPAIRS
Landlord shall maintain the premises in habitable condition. Landlord
responsible for repairs to structural systems, plumbing, and heating.
Tenant shall report maintenance issues promptly in writing.

SECTION 6 --LANDLORD ENTRY
Upon reasonable notice, the Landlord may enter the House for repairs
or inspections. Landlord shall provide 24 hours notice. Tenant's right
to quiet enjoyment is respected.

SECTION 7 --RENEWAL
Either party must provide 30 days written notice prior to lease end
if they do not wish to renew. Otherwise the lease continues month-to-month.

SECTION 8 --SUBLETTING
Subletting is not permitted without prior written consent of Landlord.

Landlord: _________________________ Date: _________
Tenant:  _________________________ Date: _________
"""


def lease_nb_007():
    """10 Albany St -- MODERATE risk. Above-threshold late fee, standard otherwise."""
    return """RESIDENTIAL LEASE AGREEMENT
Property: 10 Albany St, Unit 12, New Brunswick, NJ 08901

SECTION 1 --PARTIES
Landlord: Albany Street Realty
Tenant: [Tenant Name]

SECTION 2 --TERM AND RENT
Monthly rent is $1,725.00 paid as follows: $1,725 per month due on the 1st.

SECTION 3 --SECURITY DEPOSIT
Tenant shall pay a security deposit of one month rent ($1,725.00) upon signing.
Security deposit is due upon signing. Landlord shall return the security
deposit within 30 day return of deposit with itemized deductions.
Normal wear and tear shall not be deducted.

SECTION 4 --LATE FEES
A late fee of 6% of monthly rent applies if rent is not received by the 5th.
This late fee of 6% is applied once and does not compound.

SECTION 5 --MAINTENANCE AND REPAIRS
Landlord shall maintain the premises in habitable condition. Landlord
responsible for all structural repairs. Tenant shall notify Landlord
promptly of any needed repairs. Landlord shall maintain habitable condition.

SECTION 6 --LANDLORD ENTRY
Landlord may enter the premises upon 24 hours notice to Tenant. The
landlord shall provide reasonable notice before inspections or repairs.

SECTION 7 --RENEWAL
Tenant must provide 30 days notice prior to lease end to avoid automatic
month-to-month continuation at the then-current rent.

SECTION 8 --SUBLETTING
No subletting without written consent of Landlord. Unauthorized subletting
is not permitted under any circumstances.

SECTION 9 --GUESTS
Guests may not stay more than 5 consecutive days or more than 10 days
per month without prior written approval from the Landlord.

Landlord: _________________________ Date: _________
Tenant:  _________________________ Date: _________
"""


LEASE_TEXTS = {
    "nb_001": lease_nb_001,
    "nb_002": lease_nb_002,
    "nb_003": lease_nb_003,
    "nb_004": lease_nb_004,
    "nb_005": lease_nb_005,
    "nb_006": lease_nb_006,
    "nb_007": lease_nb_007,
}


# ── PDF generation ────────────────────────────────────────────────────────────

def make_pdf(prop_id, text, address):
    from fpdf.enums import XPos, YPos
    pdf = FPDF(format="A4")
    pdf.set_margins(25, 25, 25)
    pdf.set_auto_page_break(auto=True, margin=25)
    pdf.add_page()

    w = pdf.epw  # effective content width

    pdf.set_font("Helvetica", "B", 13)
    pdf.multi_cell(w, 10, "RESIDENTIAL LEASE AGREEMENT", align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(w, 6, address, align="C")
    pdf.ln(6)

    for line in text.split("\n"):
        line = line.strip()
        if not line:
            pdf.ln(3)
            continue
        if line.startswith("SECTION") or (line.isupper() and len(line) > 4):
            pdf.set_font("Helvetica", "B", 10)
        else:
            pdf.set_font("Helvetica", "", 9)
        pdf.multi_cell(w, 5, line)

    path = os.path.join(OUT_DIR, f"{prop_id}.pdf")
    pdf.output(path)
    return path


# ── Analysis pipeline ─────────────────────────────────────────────────────────

def analyze_pdf(pdf_path):
    raw_text = extract_text_from_pdf(pdf_path)
    if not raw_text:
        return None

    monthly_rent = extract_rent_from_lease(raw_text)
    set_lease_rent(monthly_rent)

    chunks    = chunk_lease_text(raw_text)
    raw_flags = []
    seen      = set()

    for chunk in chunks:
        for ct in detect_candidate_clauses(chunk):
            if ct in seen:
                continue
            nj_class        = classify_nj_jurisdiction(chunk)
            python_severity = weight_to_severity(nj_class["weight"])

            fee_context = None
            if ct == "late_fees":
                fee_context     = analyze_late_fee(chunk, monthly_rent)
                python_severity = fee_context["severity_signal"]

            result = analyze_clause(chunk, ct, fee_context=fee_context,
                                    severity_hint=python_severity)
            if result:
                result["severity"]    = python_severity
                result["nj_category"] = nj_class
                raw_flags.append(result)
                seen.add(ct)

    score  = compute_risk_score(raw_flags)
    bucket = get_risk_bucket(score)

    validated = []
    for rf in raw_flags:
        try:
            validated.append(ClauseFlag(**rf).model_dump())
        except Exception:
            pass

    return {
        "overall_risk_score": score,
        "risk_bucket":        bucket,
        "flags":              validated,
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    index = []

    for prop in PROPERTIES:
        pid  = prop["id"]
        text = LEASE_TEXTS[pid]()
        print(f"  Generating PDF: {pid} --{prop['address']}")
        pdf_path = make_pdf(pid, text, prop["address"])

        print(f"  Analyzing:      {pid}...", end=" ", flush=True)
        result = analyze_pdf(pdf_path)
        if not result:
            print("FAILED --no text extracted")
            continue

        bucket = result["risk_bucket"]
        score  = result["overall_risk_score"]
        nflags = len(result["flags"])
        print(f"{bucket} (score={score}, {nflags} flags)")

        entry = {**prop,
                 "risk_bucket":        bucket,
                 "overall_risk_score": score,
                 "flags":              result["flags"]}
        index.append(entry)

    out_path = os.path.join(OUT_DIR, "index.json")
    with open(out_path, "w") as f:
        json.dump(index, f, indent=2)

    print(f"\nWrote {len(index)} entries → {out_path}")


if __name__ == "__main__":
    print("Generating New Brunswick demo leases...\n")
    main()
