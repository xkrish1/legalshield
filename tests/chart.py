"""
tests/chart.py

Generates a 2x2 TP/TN/FP/FN confusion matrix chart per clause type.
Saves to tests/confusion_matrix.png and opens it.

Usage:
  cd /path/to/leaseshield
  source backend/venv/bin/activate
  python tests/chart.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec

from eval import run_eval
from answer_key import CLAUSE_TYPES

OUT_PATH = os.path.join(os.path.dirname(__file__), "confusion_matrix.png")

DISPLAY_NAMES = {
    "automatic_renewal":   "Auto\nRenewal",
    "early_termination":   "Early\nTermination",
    "late_fees":           "Late\nFees",
    "security_deposit":    "Security\nDeposit",
    "maintenance_repairs": "Maintenance\nRepairs",
    "landlord_entry":      "Landlord\nEntry",
    "subletting":          "Subletting",
    "guest_restrictions":  "Guest\nRestrictions",
}

# 2x2 layout: [TP, FN] / [FP, TN]  (rows = actual, cols = predicted)
CELL = {
    #  (row, col): (label, bg_color, text_color)
    (0, 0): ("TP", "#166534", "white"),   # True Positive  — green
    (0, 1): ("FN", "#7f1d1d", "white"),   # False Negative — red (dangerous)
    (1, 0): ("FP", "#78350f", "white"),   # False Positive — amber
    (1, 1): ("TN", "#1e3a5f", "white"),   # True Negative  — blue
}


def build_detect(all_rows):
    detect = {ct: {"TP": 0, "TN": 0, "FP": 0, "FN": 0} for ct in CLAUSE_TYPES}
    for _, ct, _, _, outcome, _ in all_rows:
        detect[ct][outcome] += 1
    return detect


def draw_2x2(ax, tp, tn, fp, fn, title):
    values = {(0, 0): tp, (0, 1): fn, (1, 0): fp, (1, 1): tn}

    ax.set_facecolor("#0f172a")
    ax.set_xlim(0, 2)
    ax.set_ylim(0, 2)
    ax.invert_yaxis()
    ax.set_aspect("equal")

    for (r, c), (label, bg, fg) in CELL.items():
        val = values[(r, c)]
        ax.add_patch(plt.Rectangle(
            (c, r), 1, 1,
            facecolor=bg if val > 0 else "#1e293b",
            edgecolor="#334155", linewidth=1.2
        ))
        # Big number
        ax.text(c + 0.5, r + 0.42, str(val),
                ha="center", va="center",
                fontsize=22, fontweight="bold",
                color=fg if val > 0 else "#475569")
        # Small label
        ax.text(c + 0.5, r + 0.72, label,
                ha="center", va="center",
                fontsize=9, color=fg if val > 0 else "#475569",
                alpha=0.75)

    # Axis labels
    ax.set_xticks([0.5, 1.5])
    ax.set_xticklabels(["Predicted\nPositive", "Predicted\nNegative"],
                       fontsize=7.5, color="#94a3b8")
    ax.set_yticks([0.5, 1.5])
    ax.set_yticklabels(["Actual\nPositive", "Actual\nNegative"],
                       fontsize=7.5, color="#94a3b8")
    ax.tick_params(length=0)
    for spine in ax.spines.values():
        spine.set_edgecolor("#334155")

    # Precision / Recall under title
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall    = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1        = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    ax.set_title(
        f"{title}\nP {precision:.0%}  R {recall:.0%}  F1 {f1:.0%}",
        fontsize=9, fontweight="bold", color="white", pad=6
    )


def make_chart(totals, sev_counts, all_rows):
    detect = build_detect(all_rows)

    # 2 rows × 4 cols
    fig = plt.figure(figsize=(16, 9), facecolor="#0f172a")
    fig.suptitle(
        "LeaseShield — Detection Confusion Matrix  (15 sample leases, 8 clause types)",
        fontsize=14, fontweight="bold", color="white", y=0.97
    )

    gs = GridSpec(2, 4, figure=fig, hspace=0.55, wspace=0.38,
                  top=0.88, bottom=0.08, left=0.06, right=0.97)

    for idx, ct in enumerate(CLAUSE_TYPES):
        row, col = divmod(idx, 4)
        ax = fig.add_subplot(gs[row, col])
        d  = detect[ct]
        draw_2x2(ax, d["TP"], d["TN"], d["FP"], d["FN"], DISPLAY_NAMES[ct])

    # ── Totals footer ──────────────────────────────────────────────────────
    total_tp = sum(detect[ct]["TP"] for ct in CLAUSE_TYPES)
    total_tn = sum(detect[ct]["TN"] for ct in CLAUSE_TYPES)
    total_fp = sum(detect[ct]["FP"] for ct in CLAUSE_TYPES)
    total_fn = sum(detect[ct]["FN"] for ct in CLAUSE_TYPES)
    total    = total_tp + total_tn + total_fp + total_fn
    acc      = (total_tp + total_tn) / total if total else 0
    prec     = total_tp / (total_tp + total_fp) if (total_tp + total_fp) else 0
    rec      = total_tp / (total_tp + total_fn) if (total_tp + total_fn) else 0
    f1       = 2 * prec * rec / (prec + rec) if (prec + rec) else 0

    fig.text(
        0.5, 0.02,
        f"Overall  TP={total_tp}  TN={total_tn}  FP={total_fp}  FN={total_fn}"
        f"   |   Accuracy {acc:.0%}   Precision {prec:.0%}   Recall {rec:.0%}   F1 {f1:.0%}",
        ha="center", fontsize=9.5, color="#94a3b8"
    )

    fig.savefig(OUT_PATH, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    print(f"Saved → {OUT_PATH}")
    return OUT_PATH


if __name__ == "__main__":
    print("Running eval...")
    totals, sev_counts, all_rows = run_eval(verbose=False)
    path = make_chart(totals, sev_counts, all_rows)
    os.system(f"open {path}")
