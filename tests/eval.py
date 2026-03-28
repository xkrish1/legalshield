"""
tests/eval.py

LeaseShield accuracy evaluation against 15 sample contracts.
Runs the full backend pipeline (no LLM — Python classifier only)
and compares against the hand-labeled answer key.

Outputs:
  1. Per-contract detection table
  2. Confusion matrix (TP/TN/FP/FN) for detection
  3. Severity accuracy breakdown
  4. Per-clause-type precision / recall / F1

Usage:
  cd /path/to/leaseshield
  source backend/venv/bin/activate
  python tests/eval.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from pdf_utils import extract_text_from_pdf
from chunking import chunk_lease_text
from rules import detect_candidate_clauses
from few_shot import classify_nj_jurisdiction, weight_to_severity
from fee_analysis import extract_rent_from_lease, analyze_late_fee
from answer_key import ANSWER_KEY, CLAUSE_TYPES

CONTRACTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'sample_contracts')

SEV_ORDER = {"low": 0, "medium": 1, "high": 2}


# ── Pipeline (no LLM) ────────────────────────────────────────────────────────

def run_pipeline(pdf_path: str) -> dict:
    """
    Runs detection + NJ classification without Ollama.
    Returns {clause_type: severity_string} for every detected clause.
    """
    raw_text = extract_text_from_pdf(pdf_path)
    if not raw_text:
        return {}

    monthly_rent = extract_rent_from_lease(raw_text)
    chunks = chunk_lease_text(raw_text)

    results = {}
    seen = set()

    for chunk in chunks:
        for ct in detect_candidate_clauses(chunk):
            if ct in seen:
                continue
            nj_class = classify_nj_jurisdiction(chunk)
            sev = weight_to_severity(nj_class["weight"])

            if ct == "late_fees":
                fc = analyze_late_fee(chunk, monthly_rent)
                sev = fc["severity_signal"]

            results[ct] = sev
            seen.add(ct)

    return results


# ── Confusion matrix helpers ─────────────────────────────────────────────────

def classify_pair(predicted_sev, truth_sev):
    """
    Returns (outcome, detail) for a single (contract, clause_type) pair.

    Detection-level outcomes:
      TP  — correctly detected (both present, any severity)
      TN  — correctly not detected (both absent)
      FP  — detected but should be absent
      FN  — not detected but should be present

    Severity outcome (only when both detected):
      CORRECT — severity matches ground truth exactly
      OVER    — predicted higher than truth (e.g. high vs low)
      UNDER   — predicted lower than truth (e.g. low vs high)
    """
    detected = predicted_sev is not None
    present  = truth_sev is not None

    if detected and present:
        if predicted_sev == truth_sev:
            return "TP", "CORRECT"
        po = SEV_ORDER.get(predicted_sev, -1)
        to = SEV_ORDER.get(truth_sev, -1)
        direction = "OVER" if po > to else "UNDER"
        return "TP", direction      # detected correctly, severity wrong
    elif not detected and not present:
        return "TN", None
    elif detected and not present:
        return "FP", None
    else:  # not detected, should be present
        return "FN", None


# ── Run evaluation ───────────────────────────────────────────────────────────

def run_eval(verbose=True):
    totals = {ct: {"TP": 0, "TN": 0, "FP": 0, "FN": 0} for ct in CLAUSE_TYPES}
    sev_counts = {ct: {"CORRECT": 0, "OVER": 0, "UNDER": 0} for ct in CLAUSE_TYPES}

    all_rows = []   # (fname, ct, truth, predicted, outcome, sev_detail)

    files = sorted(ANSWER_KEY.keys())

    for fname in files:
        truth = ANSWER_KEY[fname]
        path  = os.path.join(CONTRACTS_DIR, fname)

        if not os.path.exists(path):
            print(f"  [SKIP] {fname} — file not found")
            continue

        predicted = run_pipeline(path)

        for ct in CLAUSE_TYPES:
            pred_sev  = predicted.get(ct)
            truth_sev = truth.get(ct)
            outcome, sev_detail = classify_pair(pred_sev, truth_sev)

            totals[ct][outcome] += 1
            if sev_detail and sev_detail != "CORRECT":
                sev_counts[ct][sev_detail] += 1
            elif sev_detail == "CORRECT":
                sev_counts[ct]["CORRECT"] += 1

            all_rows.append((fname, ct, truth_sev, pred_sev, outcome, sev_detail))

    return totals, sev_counts, all_rows


def print_report(totals, sev_counts, all_rows):
    W = 24  # noqa — used in non-f-string contexts only

    # ── Per-contract clause table ─────────────────────────────────────────
    print("\n" + "="*80)
    print("PER-CONTRACT RESULTS")
    print("="*80)
    print(f"{'File':<30} {'Clause Type':<22} {'Truth':>6} {'Pred':>7} {'Outcome'}")
    print("-"*80)

    prev_file = None
    for fname, ct, truth, pred, outcome, sev_detail in all_rows:
        # Only show non-TN rows (TN = unambiguously correct, suppress for brevity)
        if outcome == "TN":
            continue
        if fname != prev_file:
            print(f"\n{fname}")
            prev_file = fname
        marker = ""
        if outcome == "FP": marker = "  ← FALSE POSITIVE"
        if outcome == "FN": marker = "  ← FALSE NEGATIVE"
        if sev_detail and sev_detail != "CORRECT":
            marker = f"  ← SEV {sev_detail}"
        print(f"  {'':28} {ct:<22} {str(truth):>6} {str(pred):>7}  [{outcome}]{marker}")

    # ── Detection confusion matrix per clause type ────────────────────────
    print("\n" + "="*80)
    print("DETECTION CONFUSION MATRIX  (per clause type, across all 15 contracts)")
    print("="*80)
    hdr = f"{'Clause Type':<24} {'TP':>4} {'TN':>4} {'FP':>4} {'FN':>4}  {'Precision':>10} {'Recall':>8} {'F1':>6}"
    print(hdr)
    print("-"*80)

    total_tp = total_tn = total_fp = total_fn = 0

    for ct in CLAUSE_TYPES:
        tp = totals[ct]["TP"]
        tn = totals[ct]["TN"]
        fp = totals[ct]["FP"]
        fn = totals[ct]["FN"]
        total_tp += tp; total_tn += tn; total_fp += fp; total_fn += fn

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall    = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1        = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

        print(f"{ct:<24} {tp:>4} {tn:>4} {fp:>4} {fn:>4}  {precision:>10.0%} {recall:>8.0%} {f1:>6.0%}")

    print("-"*80)
    prec  = total_tp / (total_tp + total_fp) if (total_tp + total_fp) > 0 else 0
    rec   = total_tp / (total_tp + total_fn) if (total_tp + total_fn) > 0 else 0
    f1    = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0
    acc   = (total_tp + total_tn) / (total_tp + total_tn + total_fp + total_fn)
    print(f"{'TOTAL':<24} {total_tp:>4} {total_tn:>4} {total_fp:>4} {total_fn:>4}  {prec:>10.0%} {rec:>8.0%} {f1:>6.0%}")
    print(f"\nOverall detection accuracy: {acc:.0%}  ({total_tp+total_tn}/{total_tp+total_tn+total_fp+total_fn})")

    # ── Severity accuracy (for TP pairs only) ────────────────────────────
    print("\n" + "="*80)
    print("SEVERITY ACCURACY  (for correctly detected clauses only)")
    print("="*80)
    print(f"{'Clause Type':<24} {'Correct':>8} {'Over':>6} {'Under':>6}  {'Accuracy':>9}")
    print("-"*60)

    total_c = total_o = total_u = 0
    for ct in CLAUSE_TYPES:
        c = sev_counts[ct]["CORRECT"]
        o = sev_counts[ct]["OVER"]
        u = sev_counts[ct]["UNDER"]
        total_c += c; total_o += o; total_u += u
        n = c + o + u
        acc_s = c / n if n > 0 else 0.0
        if n > 0:
            print(f"{ct:<24} {c:>8} {o:>6} {u:>6}  {acc_s:>9.0%}")

    total_n = total_c + total_o + total_u
    total_acc = total_c / total_n if total_n > 0 else 0
    print("-"*60)
    print(f"{'TOTAL':<24} {total_c:>8} {total_o:>6} {total_u:>6}  {total_acc:>9.0%}")
    print(f"\n  OVER  = predicted severity higher than ground truth (conservative — safer for tenants)")
    print(f"  UNDER = predicted severity lower than ground truth (dangerous — misses real risk)")

    # ── Summary ──────────────────────────────────────────────────────────
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    fp_rows = [(f, c, t, p) for f, c, t, p, o, _ in all_rows if o == "FP"]
    fn_rows = [(f, c, t, p) for f, c, t, p, o, _ in all_rows if o == "FN"]
    over_rows  = [(f, c, t, p) for f, c, t, p, o, s in all_rows if s == "OVER"]
    under_rows = [(f, c, t, p) for f, c, t, p, o, s in all_rows if s == "UNDER"]

    print(f"\nFalse Positives ({len(fp_rows)}) — detected clauses that aren't in the lease:")
    for f, c, t, p in fp_rows:
        print(f"  {f}  {c}  predicted={p}")

    print(f"\nFalse Negatives ({len(fn_rows)}) — missed clauses that are in the lease:")
    for f, c, t, p in fn_rows:
        print(f"  {f}  {c}  truth={t}  predicted=None")

    print(f"\nSeverity OVER ({len(over_rows)}) — over-flagged (conservative, safer for tenants):")
    for f, c, t, p in over_rows:
        print(f"  {f}  {c}  truth={t}  predicted={p}")

    print(f"\nSeverity UNDER ({len(under_rows)}) — under-flagged (missed real risk, most dangerous):")
    for f, c, t, p in under_rows:
        print(f"  {f}  {c}  truth={t}  predicted={p}")


if __name__ == "__main__":
    print("Running LeaseShield evaluation (no LLM)...")
    print(f"Contracts: {CONTRACTS_DIR}")
    totals, sev_counts, all_rows = run_eval()
    print_report(totals, sev_counts, all_rows)
