import os
import json
import math
import random
import traceback
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

load_dotenv()

from database import init_db, save_result
from pdf_utils import extract_text_from_pdf
from chunking import chunk_lease_text
from rules import detect_candidate_clauses
from llm import analyze_clause, generate_exit_letter, simulate_landlord_response, set_lease_rent
from fee_analysis import extract_rent_from_lease, analyze_late_fee
from few_shot import classify_nj_jurisdiction, weight_to_severity
from scoring import compute_risk_score, get_risk_bucket, build_summary
from schemas import ClauseFlag

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
MAX_FILE_SIZE_MB = 20


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": os.getenv("OLLAMA_MODEL", "llama3.2:3b")})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400
    if not f.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 415

    f.seek(0, 2)
    size_mb = f.tell() / (1024 * 1024)
    f.seek(0)
    if size_mb > MAX_FILE_SIZE_MB:
        return jsonify({"error": f"File too large ({size_mb:.1f}MB). Max {MAX_FILE_SIZE_MB}MB"}), 413

    safe_name = f"{uuid.uuid4().hex}_{secure_filename(f.filename)}"
    save_path = os.path.join(UPLOAD_FOLDER, safe_name)
    try:
        f.save(save_path)
    except Exception as e:
        return jsonify({"error": f"Could not save file: {str(e)}"}), 500

    try:
        raw_text = extract_text_from_pdf(save_path)
        if not raw_text or len(raw_text.strip()) < 100:
            return jsonify({"error": "Could not extract text. Is this a scanned image PDF?"}), 422

        monthly_rent = extract_rent_from_lease(raw_text)
        set_lease_rent(monthly_rent)
        if monthly_rent:
            print(f"[app] Detected monthly rent: ${monthly_rent:.0f}")
        else:
            print("[app] Monthly rent not detected — fee proportionality will default to medium")

        chunks = chunk_lease_text(raw_text)
        if not chunks:
            return jsonify({"error": "No processable sections found"}), 422

        raw_flags = []
        seen_types = set()

        for chunk in chunks:
            detected = detect_candidate_clauses(chunk)
            for clause_type in detected:
                if clause_type in seen_types:
                    continue

                # Python classifies severity. LLM only writes explanations.
                nj_class        = classify_nj_jurisdiction(chunk)
                python_severity = weight_to_severity(nj_class["weight"])

                fee_context = None
                if clause_type == "late_fees":
                    fee_context     = analyze_late_fee(chunk, monthly_rent)
                    python_severity = fee_context["severity_signal"]

                result = analyze_clause(chunk, clause_type, fee_context=fee_context, severity_hint=python_severity)
                if result:
                    # Hard override — Python result always wins over LLM output
                    result["severity"]    = python_severity
                    result["nj_category"] = nj_class
                    raw_flags.append(result)
                    seen_types.add(clause_type)

        score  = compute_risk_score(raw_flags)
        bucket = get_risk_bucket(score)
        summary = build_summary(raw_flags, bucket)

        validated_flags = []
        for rf in raw_flags:
            try:
                validated_flags.append(ClauseFlag(**rf).model_dump())
            except Exception:
                pass

        response = {
            "overall_risk_score": score,
            "risk_bucket": bucket,
            "summary": summary,
            "flags": validated_flags,
            "disclaimer": "This tool provides informational insights only and is not legal advice.",
        }

        save_result(f.filename, raw_text, response)
        return jsonify(response), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500
    finally:
        try:
            os.remove(save_path)
        except Exception:
            pass


@app.route("/api/letter", methods=["POST"])
def letter():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No data provided"}), 400

    required = ["tenant_name", "landlord_name", "property_address", "move_out_date"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    try:
        letter_text = generate_exit_letter(
            tenant_name=data["tenant_name"],
            landlord_name=data["landlord_name"],
            property_address=data["property_address"],
            move_out_date=data["move_out_date"],
            reason=data.get("reason", "personal reasons"),
            lease_flags=data.get("lease_flags", []),
        )
        return jsonify({"letter": letter_text}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Letter generation failed: {str(e)}"}), 500


@app.route("/api/simulate", methods=["POST"])
def simulate():
    data = request.get_json(silent=True)
    if not data or not data.get("scenario"):
        return jsonify({"error": "scenario field required"}), 400
    try:
        response_text = simulate_landlord_response(
            scenario=data["scenario"],
            flags=data.get("lease_flags", []),
            history=data.get("history", []),
        )
        return jsonify({"response": response_text}), 200
    except Exception as e:
        return jsonify({"error": f"Simulation failed: {str(e)}"}), 500


@app.route("/api/lawyers", methods=["GET"])
def lawyers():
    zipcode = request.args.get("zip", "")
    prefix  = zipcode[:3] if len(zipcode) >= 3 else "100"
    city, state = _zip_prefix_to_city(prefix)

    orgs = [
        {
            "name":      f"{city} Legal Aid Society",
            "phone":     _area_phone(prefix, 1),
            "address":   f"1 Courthouse Sq, {city}, {state} {zipcode}",
            "specialty": "Tenant Rights & Housing",
            "free":      True,
        },
        {
            "name":      f"{state} Housing Justice Clinic",
            "phone":     _area_phone(prefix, 2),
            "address":   f"220 Oak Ave, {city}, {state} {zipcode}",
            "specialty": "Eviction Defense",
            "free":      True,
        },
        {
            "name":      f"Tenant Defense Group — {city}",
            "phone":     _area_phone(prefix, 3),
            "address":   f"88 Commerce Blvd, {city}, {state} {zipcode}",
            "specialty": "Lease Disputes & Deposits",
            "free":      False,
        },
        {
            "name":      f"{city} Community Law Center",
            "phone":     _area_phone(prefix, 4),
            "address":   f"415 Main St, {city}, {state} {zipcode}",
            "specialty": "Habitability & Repairs",
            "free":      True,
        },
    ]
    return jsonify({"lawyers": orgs, "zipcode": zipcode}), 200


_NB_INDEX_PATH = os.path.join(os.path.dirname(__file__), "nearby_data", "index.json")
_NB_INDEX = None

def _load_nb_index():
    global _NB_INDEX
    if _NB_INDEX is None and os.path.exists(_NB_INDEX_PATH):
        with open(_NB_INDEX_PATH) as f:
            _NB_INDEX = json.load(f)
    return _NB_INDEX or []

NB_ZIP_PREFIXES = {"089"}  # New Brunswick, NJ


@app.route("/api/leases/nearby", methods=["GET"])
def nearby_leases():
    zipcode = request.args.get("zip", "10001")
    prefix  = zipcode[:3] if len(zipcode) >= 3 else "100"

    if prefix in NB_ZIP_PREFIXES:
        leases = [
            {k: v for k, v in entry.items() if k != "flags"}
            | {"has_analysis": True}
            for entry in _load_nb_index()
        ]
        return jsonify({"leases": leases, "zipcode": zipcode}), 200

    lat, lng, rent_base = _zip_prefix_to_coords(prefix)
    rng = random.Random(int(prefix) if prefix.isdigit() else 100)
    streets  = ["Oak St", "Elm Ave", "Pine Blvd", "Maple Dr", "Cedar Ln",
                "Birch Rd", "Walnut St", "Spruce Ave", "Ash Ct", "Willow Way"]
    buckets  = ["Low", "Low", "Moderate", "Moderate", "Moderate", "High"]
    leases   = []
    for _ in range(7):
        angle  = rng.uniform(0, 2 * math.pi)
        radius = rng.uniform(0.002, 0.012)
        rent   = rent_base + rng.randint(-300, 400)
        num    = rng.randint(1, 999)
        leases.append({
            "address":     f"{num} {rng.choice(streets)}",
            "lat":         round(lat + radius * math.sin(angle), 6),
            "lng":         round(lng + radius * math.cos(angle), 6),
            "avg_rent":    rent,
            "risk_bucket": rng.choice(buckets),
            "zip":         zipcode,
            "has_analysis": False,
        })
    return jsonify({"leases": leases, "zipcode": zipcode}), 200


@app.route("/api/leases/nearby/<lease_id>", methods=["GET"])
def nearby_lease_detail(lease_id):
    for entry in _load_nb_index():
        if entry["id"] == lease_id:
            return jsonify(entry), 200
    return jsonify({"error": "Not found"}), 404


@app.route("/api/leases/nearby/<lease_id>/download", methods=["GET"])
def nearby_lease_download(lease_id):
    from flask import send_file
    pdf_path = os.path.join(os.path.dirname(__file__), "nearby_data", f"{lease_id}.pdf")
    if not os.path.exists(pdf_path):
        return jsonify({"error": "PDF not found"}), 404
    return send_file(pdf_path, mimetype="application/pdf",
                     as_attachment=True, download_name=f"{lease_id}_lease.pdf")


# ── helpers ──────────────────────────────────────────────────────────────────

_ZIP_REGIONS = {
    # prefix: (city, state, lat, lng, median_rent)
    "100": ("New York",      "NY",  40.7128, -74.0060, 2800),
    "101": ("New York",      "NY",  40.7580, -73.9855, 2900),
    "102": ("New York",      "NY",  40.6892, -73.9442, 2500),
    "110": ("Brooklyn",      "NY",  40.6782, -73.9442, 2400),
    "113": ("Queens",        "NY",  40.7282, -73.7949, 2100),
    "089": ("New Brunswick",  "NJ",  40.4870, -74.4478, 1700),
    "021": ("Boston",        "MA",  42.3601, -71.0589, 2600),
    "022": ("Cambridge",     "MA",  42.3736, -71.1097, 2700),
    "191": ("Philadelphia",  "PA",  39.9526, -75.1652, 1600),
    "192": ("Philadelphia",  "PA",  39.9612, -75.1446, 1500),
    "200": ("Washington",    "DC",  38.9072, -77.0369, 2200),
    "201": ("Arlington",     "VA",  38.8816, -77.0910, 2100),
    "220": ("Arlington",     "VA",  38.8799, -77.1067, 2000),
    "230": ("Norfolk",       "VA",  36.8508, -76.2859, 1300),
    "272": ("Raleigh",       "NC",  35.7796, -78.6382, 1400),
    "282": ("Charlotte",     "NC",  35.2271, -80.8431, 1500),
    "300": ("Atlanta",       "GA",  33.7490, -84.3880, 1700),
    "303": ("Atlanta",       "GA",  33.7490, -84.3880, 1800),
    "322": ("Jacksonville",  "FL",  30.3322, -81.6557, 1300),
    "328": ("Orlando",       "FL",  28.5384, -81.3789, 1700),
    "331": ("Miami",         "FL",  25.7617, -80.1918, 2100),
    "337": ("Tampa",         "FL",  27.9506, -82.4572, 1700),
    "371": ("Nashville",     "TN",  36.1627, -86.7816, 1700),
    "400": ("Louisville",    "KY",  38.2527, -85.7585, 1100),
    "430": ("Columbus",      "OH",  39.9612, -82.9988, 1200),
    "441": ("Cleveland",     "OH",  41.4993, -81.6944, 1100),
    "462": ("Indianapolis",  "IN",  39.7684, -86.1581, 1100),
    "481": ("Detroit",       "MI",  42.3314, -83.0458, 1100),
    "530": ("Milwaukee",     "WI",  43.0389, -87.9065, 1100),
    "550": ("Minneapolis",   "MN",  44.9778, -93.2650, 1400),
    "606": ("Chicago",       "IL",  41.8781, -87.6298, 1900),
    "630": ("St. Louis",     "MO",  38.6270, -90.1994, 1100),
    "672": ("Kansas City",   "MO",  39.0997, -94.5786, 1100),
    "681": ("Omaha",         "NE",  41.2565, -95.9345, 1000),
    "700": ("New Orleans",   "LA",  29.9511, -90.0715, 1300),
    "750": ("Dallas",        "TX",  32.7767, -96.7970, 1600),
    "752": ("Dallas",        "TX",  32.8481, -96.8512, 1500),
    "770": ("Houston",       "TX",  29.7604, -95.3698, 1400),
    "782": ("San Antonio",   "TX",  29.4241, -98.4936, 1200),
    "787": ("Austin",        "TX",  30.2672, -97.7431, 1800),
    "800": ("Denver",        "CO",  39.7392, -104.9903, 1900),
    "802": ("Denver",        "CO",  39.7392, -104.9903, 1800),
    "850": ("Phoenix",       "AZ",  33.4484, -112.0740, 1500),
    "852": ("Scottsdale",    "AZ",  33.4942, -111.9261, 1700),
    "890": ("Las Vegas",     "NV",  36.1699, -115.1398, 1300),
    "900": ("Los Angeles",   "CA",  34.0522, -118.2437, 2400),
    "902": ("Los Angeles",   "CA",  34.0195, -118.4912, 2600),
    "910": ("Pasadena",      "CA",  34.1478, -118.1445, 2200),
    "920": ("San Diego",     "CA",  32.7157, -117.1611, 2200),
    "940": ("San Francisco", "CA",  37.7749, -122.4194, 3200),
    "941": ("San Jose",      "CA",  37.3382, -121.8863, 2800),
    "945": ("Oakland",       "CA",  37.8044, -122.2712, 2500),
    "971": ("Portland",      "OR",  45.5051, -122.6750, 1700),
    "980": ("Seattle",       "WA",  47.6062, -122.3321, 2300),
    "981": ("Seattle",       "WA",  47.6588, -122.3090, 2200),
}

_DEFAULT_REGION = ("the area", "US", 39.5, -98.35, 1400)


def _zip_prefix_to_city(prefix: str):
    r = _ZIP_REGIONS.get(prefix, _DEFAULT_REGION)
    return r[0], r[1]


def _zip_prefix_to_coords(prefix: str):
    r = _ZIP_REGIONS.get(prefix, _DEFAULT_REGION)
    return r[2], r[3], r[4]


def _area_phone(prefix: str, idx: int) -> str:
    # Deterministic but varied area codes per region
    area_codes = {
        "089": "732",
        "100": "212", "101": "646", "102": "718", "110": "718", "113": "718",
        "021": "617", "022": "617", "191": "215", "192": "215",
        "200": "202", "201": "703", "220": "703", "230": "757",
        "272": "919", "282": "704", "300": "404", "303": "404",
        "322": "904", "328": "407", "331": "305", "337": "813",
        "371": "615", "400": "502", "430": "614", "441": "216",
        "462": "317", "481": "313", "530": "414", "550": "612",
        "606": "312", "630": "314", "672": "816", "681": "402",
        "700": "504", "750": "214", "752": "972", "770": "713",
        "782": "210", "787": "512", "800": "720", "802": "303",
        "850": "602", "852": "480", "890": "702",
        "900": "213", "902": "310", "910": "626", "920": "619",
        "940": "415", "941": "408", "945": "510",
        "971": "503", "980": "206", "981": "425",
    }
    seeds = [(555, 1800), (555, 2400), (555, 3100), (555, 4700)]
    ac = area_codes.get(prefix, "800")
    s, n = seeds[(idx - 1) % len(seeds)]
    return f"({ac}) {s}-{n:04d}"


if __name__ == "__main__":
    init_db()
    port  = int(os.getenv("FLASK_PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    print(f"\n[LeaseShield] Backend running → http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
