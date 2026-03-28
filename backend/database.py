import sqlite3
import json
import os

DB_PATH     = os.path.join(os.path.dirname(__file__), "leaseshield.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    if not os.path.exists(SCHEMA_PATH):
        return
    conn = get_db()
    with open(SCHEMA_PATH) as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()


def save_result(filename: str, raw_text: str, result: dict) -> int:
    try:
        conn = get_db()
        cur = conn.execute(
            "INSERT INTO leases (filename, raw_text, overall_risk_score, risk_bucket) VALUES (?,?,?,?)",
            (
                filename,
                raw_text[:5000],
                result.get("overall_risk_score", 0),
                result.get("risk_bucket", "Unknown"),
            ),
        )
        lease_id = cur.lastrowid
        for flag in result.get("flags", []):
            conn.execute(
                """INSERT INTO clause_flags
                   (lease_id, clause_type, severity, excerpt,
                    why_it_matters, plain_english, confidence, questions_to_ask)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (
                    lease_id,
                    flag.get("clause_type", ""),
                    flag.get("severity", "unclear"),
                    flag.get("excerpt", "")[:400],
                    flag.get("why_it_matters", ""),
                    flag.get("plain_english", ""),
                    flag.get("confidence", 0.0),
                    json.dumps(flag.get("questions_to_ask", [])),
                ),
            )
        conn.commit()
        conn.close()
        return lease_id
    except Exception as e:
        print(f"[DB] Save failed (non-fatal): {e}")
        return -1
