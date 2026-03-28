"""
tests/answer_key.py

Ground truth for the 15 sample contracts.
Derived from PDF text extraction + NJ landlord-tenant law.

Format per contract:
  clause_type -> "low" | "medium" | "high" | None
  None = clause genuinely absent from the lease (correct TN if not detected)

Severity definitions:
  "low"    = clause present, lawful and compliant
  "medium" = clause present, problematic but not clearly illegal
  "high"   = clause present, conflicts with NJ law / courts frequently refuse
  None     = clause not present in this lease
"""

CLAUSE_TYPES = [
    "automatic_renewal",
    "early_termination",
    "late_fees",
    "security_deposit",
    "maintenance_repairs",
    "landlord_entry",
    "subletting",
    "guest_restrictions",
]

# Ground truth: what each contract actually contains and correct severity
ANSWER_KEY = {

    # ── FAIR LEASES ────────────────────────────────────────────────────────

    "lease_01_fair.pdf": {
        # 45 Livingston Ave. Flat fee, lawful grace period, landlord maintains.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "low",    # flat fee, 5-day grace period
        "security_deposit":    "low",    # 1x rent — under NJ 1.5x cap
        "maintenance_repairs": "low",    # landlord responsible
        "landlord_entry":      None,
        "subletting":          "low",    # consent required, not unreasonably withheld
        "guest_restrictions":  None,
    },

    "lease_03_fair.pdf": {
        # 210 Somerset St. Landlord maintains, standard deposit, fair late fee.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "low",
        "security_deposit":    "low",    # 1x rent
        "maintenance_repairs": "low",    # landlord maintains structural
        "landlord_entry":      None,
        "subletting":          "low",
        "guest_restrictions":  None,
    },

    "lease_07_fair.pdf": {
        # 301 Easton Ave. Standard NJ-compliant lease.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "low",    # lawful flat fee
        "security_deposit":    "low",    # 1x rent
        "maintenance_repairs": "low",
        "landlord_entry":      None,
        "subletting":          "low",
        "guest_restrictions":  None,
    },

    "lease_09_fair.pdf": {
        # 525 College Ave. 24-hour entry notice, 1x deposit, landlord repairs.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "low",
        "security_deposit":    "low",    # 1x rent
        "maintenance_repairs": "low",
        "landlord_entry":      "low",    # 24-hour advance notice = lawful
        "subletting":          "low",
        "guest_restrictions":  None,
    },

    "lease_11_fair.pdf": {
        # 200 Hamilton St. Lawful across the board.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "low",
        "security_deposit":    "low",    # 1x rent
        "maintenance_repairs": "low",
        "landlord_entry":      None,
        "subletting":          "low",
        "guest_restrictions":  None,
    },

    "lease_14_fair.pdf": {
        # 128 Lee Ave. Landlord expressly maintains habitability.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "low",
        "security_deposit":    "low",    # 1x rent
        "maintenance_repairs": "low",    # landlord expressly maintains warranty
        "landlord_entry":      None,
        "subletting":          "low",
        "guest_restrictions":  None,
    },

    # ── UNFAIR LEASES ──────────────────────────────────────────────────────

    "lease_02_unfair.pdf": {
        # 88 French St. Tenant responsible for all repairs; 3x deposit (illegal).
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "medium", # above-average fee, short grace
        "security_deposit":    "high",   # 3x monthly rent — exceeds NJ 1.5x cap
        "maintenance_repairs": "high",   # tenant responsible for all repairs
        "landlord_entry":      None,
        "subletting":          "high",   # prohibited outright
        "guest_restrictions":  None,
    },

    "lease_04_unfair.pdf": {
        # 88 French St (04). Daily late fee; no subletting; entry clause present.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "high",   # daily compounding fee
        "security_deposit":    "medium", # 1.5x — at NJ cap, borderline
        "maintenance_repairs": None,
        "landlord_entry":      "low",    # entry clause exists but gives notice
        "subletting":          "high",   # no assignment or sublease at all
        "guest_restrictions":  None,
    },

    "lease_06_unfair.pdf": {
        # 72 Albany St. 2x deposit (illegal); fee issues.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "medium", # fee exists, terms concerning
        "security_deposit":    "high",   # 2x monthly rent — exceeds NJ 1.5x cap
        "maintenance_repairs": "low",    # landlord maintains in this one
        "landlord_entry":      None,
        "subletting":          None,
        "guest_restrictions":  None,
    },

    "lease_08_unfair.pdf": {
        # 14 Throop Ave. 2x deposit; daily late fee.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "high",   # daily compounding fee
        "security_deposit":    "high",   # 2x rent — exceeds NJ cap
        "maintenance_repairs": "low",    # landlord maintains here
        "landlord_entry":      None,
        "subletting":          "low",    # standard consent clause
        "guest_restrictions":  None,
    },

    "lease_10_unfair.pdf": {
        # 99 Joyce Kilmer. No-notice entry; daily fee; 2x deposit.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "high",   # daily fee
        "security_deposit":    "high",   # 2x rent — exceeds NJ cap
        "maintenance_repairs": None,
        "landlord_entry":      "high",   # no prior notice required
        "subletting":          "high",   # prohibited
        "guest_restrictions":  None,
    },

    "lease_13_unfair.pdf": {
        # 47 Sicard St. Tenant responsible for all repairs; daily fee; 2x deposit.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "high",   # daily compounding fee
        "security_deposit":    "high",   # 2x rent — exceeds NJ cap
        "maintenance_repairs": "high",   # tenant responsible for all repairs
        "landlord_entry":      None,
        "subletting":          None,
        "guest_restrictions":  None,
    },

    # ── MIXED LEASES ───────────────────────────────────────────────────────

    "lease_05_mixed.pdf": {
        # 156 Remsen Ave. Good on fees/deposit; bad on repairs (habitability waiver).
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "low",
        "security_deposit":    "low",    # 1.5x — at NJ cap (compliant)
        "maintenance_repairs": "high",   # waiver of habitability — void under Marini
        "landlord_entry":      None,
        "subletting":          "low",
        "guest_restrictions":  None,
    },

    "lease_12_mixed.pdf": {
        # 18 Morris St. Good on fees/deposit; bad on repairs; entry has 24h notice.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "low",
        "security_deposit":    "low",    # 1.5x — compliant
        "maintenance_repairs": "high",   # habitability waiver
        "landlord_entry":      "low",    # 24-hour advance notice = lawful
        "subletting":          "low",
        "guest_restrictions":  None,
    },

    "lease_15_mixed.pdf": {
        # 260 Hamilton St (the real lease). Low fee (0.9%), no subletting, reasonable entry.
        "automatic_renewal":   None,
        "early_termination":   None,
        "late_fees":           "low",    # $50 on $5,540 = 0.9%
        "security_deposit":    "low",    # 1x rent
        "maintenance_repairs": None,
        "landlord_entry":      "low",    # reasonable notice = lawful
        "subletting":          "high",   # no subletting allowed
        "guest_restrictions":  None,
    },
}
