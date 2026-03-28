import os
import json
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from database import init_db, save_result
from pdf_utils import extract_text_from_pdf
from chunking import chunk_lease_text
from rules import detect_candidate_clauses
from llm import analyze_clause, generate_exit_letter, simulate_landlord_response
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

    save_path = os.path.join(UPLOAD_FOLDER, f.filename)
    try:
        f.save(save_path)
    except Exception as e:
        return jsonify({"error": f"Could not save file: {str(e)}"}), 500

    try:
        raw_text = extract_text_from_pdf(save_path)
        if not raw_text or len(raw_text.strip()) < 100:
            return jsonify({"error": "Could not extract text. Is this a scanned image PDF?"}), 422

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
                result = analyze_clause(chunk, clause_type)
                if result:
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
        )
        return jsonify({"response": response_text}), 200
    except Exception as e:
        return jsonify({"error": f"Simulation failed: {str(e)}"}), 500


@app.route("/api/lawyers", methods=["GET"])
def lawyers():
    zipcode = request.args.get("zip", "")
    stub = [
        {"name": "Community Legal Aid",      "phone": "1-800-555-0101", "address": f"123 Main St, {zipcode}", "specialty": "Tenant Rights",   "free": True},
        {"name": "Tenant Rights Law Group",  "phone": "1-800-555-0202", "address": f"456 Oak Ave, {zipcode}", "specialty": "Lease Disputes",   "free": False},
        {"name": "Housing Justice Clinic",   "phone": "1-800-555-0303", "address": f"789 Elm St, {zipcode}",  "specialty": "Eviction Defense", "free": True},
    ]
    return jsonify({"lawyers": stub, "zipcode": zipcode}), 200


@app.route("/api/leases/nearby", methods=["GET"])
def nearby_leases():
    zipcode = request.args.get("zip", "10001")
    stub = [
        {"address": "12 Oak St",    "lat": 40.7128, "lng": -74.0060, "avg_rent": 2100, "risk_bucket": "Moderate", "zip": zipcode},
        {"address": "88 Elm Ave",   "lat": 40.7138, "lng": -74.0070, "avg_rent": 1850, "risk_bucket": "Low",      "zip": zipcode},
        {"address": "5 Pine Blvd",  "lat": 40.7118, "lng": -74.0050, "avg_rent": 2400, "risk_bucket": "High",     "zip": zipcode},
    ]
    return jsonify({"leases": stub, "zipcode": zipcode}), 200


if __name__ == "__main__":
    init_db()
    port  = int(os.getenv("FLASK_PORT", 5001))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    print(f"\n[LeaseShield] Backend running → http://localhost:{port}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
