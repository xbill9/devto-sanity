#!/usr/bin/env python3
"""Summarize stopwatch trials. Every number in the article comes from this output.

Usage: analyze.py [runs.csv]   (default: runs.csv next to this file)

Populations (human, agent) are never pooled. Per population x surface x task it reports
n, median/min/max seconds, success count, and total assists. Timing stats use every run,
correct or not; the success count is reported beside them rather than filtering.
"""
import csv
import statistics
import sys
from collections import defaultdict
from pathlib import Path

COLUMNS = ["participant", "population", "surface", "task", "run", "seconds", "assists", "correct"]
SURFACES = {"S1": "Kiosk", "S2": "Stock Studio", "S3": "Markdown/GitHub"}


def load(path: Path) -> list[dict]:
    with path.open(newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != COLUMNS:
            sys.exit(f"{path}: expected columns {COLUMNS}, got {reader.fieldnames}")
        rows = []
        for i, row in enumerate(reader, start=2):
            try:
                row["seconds"] = float(row["seconds"])
                row["assists"] = int(row["assists"])
                row["correct"] = int(row["correct"])
                row["run"] = int(row["run"])
            except ValueError as e:
                sys.exit(f"{path}:{i}: {e}")
            if row["population"] not in ("human", "agent") or row["surface"] not in SURFACES or row["correct"] not in (0, 1):
                sys.exit(f"{path}:{i}: invalid row {row}")
            rows.append(row)
    return rows


def main() -> None:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("runs.csv")
    rows = load(path)
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for r in rows:
        groups[(r["population"], r["surface"], r["task"])].append(r)

    print(f"source: {path}  rows: {len(rows)}")
    for population in ("human", "agent"):
        keys = sorted(k for k in groups if k[0] == population)
        if not keys:
            continue
        participants = sorted({r["participant"] for r in rows if r["population"] == population})
        pop = [r for r in rows if r["population"] == population]
        print(f"\n## {population} (participants: {', '.join(participants)})\n")
        print("| Surface | Task | n | Median s | Min s | Max s | Correct | Assists |")
        print("|---|---|---:|---:|---:|---:|---:|---:|")
        for key in keys:
            g = groups[key]
            secs = [r["seconds"] for r in g]
            print(
                f"| {SURFACES[key[1]]} | {key[2]} | {len(g)} | {statistics.median(secs):.1f} | {min(secs):.1f} | "
                f"{max(secs):.1f} | {sum(r['correct'] for r in g)}/{len(g)} | {sum(r['assists'] for r in g)} |"
            )
        print(f"\ntotal: {sum(r['correct'] for r in pop)} of {len(pop)} runs correct")


if __name__ == "__main__":
    main()
