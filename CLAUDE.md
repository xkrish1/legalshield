# LeaseShield — Claude Context

AI-powered lease risk analyzer. Local-first and private: Ollama runs the LLM on-device, no external API keys required.

## Stack

| Layer | Tech | Port |
|---|---|---|
| Frontend | React + Vite | 5173 |
| Backend | Flask + Python | 5001 |
| AI | Ollama llama3.2:3b | 11434 |
| DB | SQLite (auto-created) | — |

## Running the app

```bash
./start.sh          # starts both frontend and backend
```

Or manually:
```bash
cd backend && source venv/bin/activate && python app.py
cd frontend && npm run dev
```

Frontend proxies `/api/*` → `http://localhost:5001` via Vite config.

## Architecture

### Analysis pipeline (backend)
```
PDF upload
  → pdf_utils.py   (pdfplumber extraction)
  → chunking.py    (regex split into 80–1200 char chunks)
  → rules.py       (regex pattern matching → candidate clause types)
  → llm.py         (Ollama structured JSON output per clause)
  → scoring.py     (severity points → risk score → bucket)
  → schemas.py     (Pydantic validation + deduplication)
  → database.py    (SQLite persist)
```

### 8 clause types detected
`automatic_renewal`, `early_termination`, `late_fees`, `security_deposit`,
`maintenance_repairs`, `landlord_entry`, `subletting`, `guest_restrictions`

### Severity scoring
- `low` = 5 pts, `medium` = 10 pts, `high` = 20 pts, `unclear` = 0
- Buckets: Low (0–15), Moderate (16–35), High (36+)

### LLM integration (`backend/llm.py`)
- Uses `ollama.chat()` with `format=CLAUSE_JSON_SCHEMA` for structured output
- Temperature 0.1 for analysis, 0.3 for letters, 0.4 for simulator
- Graceful mock fallback if Ollama isn't running (uses `few_shot.FALLBACK_EXAMPLES`)
- Few-shot prompting via `build_prompt()` in `few_shot.py`

## Backend API routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Ollama model info |
| POST | `/api/analyze` | Upload PDF → full analysis |
| POST | `/api/letter` | Generate exit letter |
| POST | `/api/simulate` | Landlord response simulator |
| GET | `/api/lawyers?zip=` | Lawyer finder (stub data) |
| GET | `/api/leases/nearby?zip=` | Nearby lease comparison (stub data) |

## Frontend pages & routes

| Route | Page | Description |
|---|---|---|
| `/` | Home | PDF upload dropzone |
| `/results` | Results | Risk gauge + flagged clauses |
| `/letter` | Letter | Exit letter generator |
| `/simulator` | Simulator | Landlord response sim |
| `/map` | MapComparison | Nearby lease map (Leaflet) |

Global state is in `LeaseContext` (analysisResult, isLoading, error, uploadedFileName).

## Database schema (`backend/schema.sql`)

```sql
leases(id, filename, upload_time, raw_text, overall_risk_score, risk_bucket)
clause_flags(id, lease_id, clause_type, severity, excerpt, why_it_matters,
             plain_english, confidence, questions_to_ask)
exit_letters(id, lease_id, generated_letter, created_at)
```

DB file: `backend/leaseshield.db` (auto-created on first run, gitignored).

## Key files

```
backend/
  app.py          — Flask routes
  llm.py          — Ollama integration + mock fallbacks
  few_shot.py     — System prompt, few-shot examples, FALLBACK_EXAMPLES
  rules.py        — Regex clause detection (8 types)
  chunking.py     — Text splitting
  scoring.py      — Risk score computation
  schemas.py      — Pydantic models with validation
  database.py     — SQLite helpers (init_db, save_result)
  pdf_utils.py    — pdfplumber PDF extraction
  schema.sql      — DB schema

frontend/src/
  App.jsx                     — Routes
  context/LeaseContext.jsx    — Global state
  services/api.js             — Fetch wrappers for all endpoints
  pages/                      — Home, Results, Letter, Simulator, MapComparison
  components/
    analysis/   — ClauseCard, ClauseList, SeverityBadge
    risk/       — RiskGauge, RiskBreakdown
    upload/     — DropZone, UploadProgress
    letter/     — LetterPreview, LetterEditor
    simulator/  — LandlordSim, ScenarioSelector
    lawyer/     — LawyerCard, LawyerFinder
    map/        — LeaseMap, ZipSearch
    ui/         — Button, Spinner, Badge, Toast
    layout/     — Navbar, Footer

data/
  labeled/clauses.csv              — Training data labels
  processed/training_examples.json — Few-shot examples (loaded by few_shot.py)
```

## Known issues / things to fix

- **Security**: `app.py:49` uses raw `f.filename` for save path — path traversal risk.
  Fix: `werkzeug.utils.secure_filename` + UUID prefix.
- **Stub data**: `/api/lawyers` and `/api/leases/nearby` return hardcoded fake data.
  The SQLite DB has no lawyer or nearby-lease tables.
- **No streaming**: Analysis can take 10–30s on Ollama. No progress feedback beyond a spinner.

## Environment variables (`.env`)

```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
FLASK_PORT=5001
FLASK_DEBUG=true
```
