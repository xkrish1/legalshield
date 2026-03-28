CREATE TABLE IF NOT EXISTS leases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    raw_text TEXT,
    overall_risk_score INTEGER,
    risk_bucket TEXT
);

CREATE TABLE IF NOT EXISTS clause_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lease_id INTEGER REFERENCES leases(id),
    clause_type TEXT NOT NULL,
    severity TEXT CHECK(severity IN ('low','medium','high','unclear')),
    excerpt TEXT,
    why_it_matters TEXT,
    plain_english TEXT,
    confidence REAL,
    questions_to_ask TEXT
);

CREATE TABLE IF NOT EXISTS exit_letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lease_id INTEGER,
    generated_letter TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
