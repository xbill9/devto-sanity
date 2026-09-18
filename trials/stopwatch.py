#!/usr/bin/env python3
"""Time one trial run the way PROTOCOL.md says: the clock starts when the task is issued and stops when the
participant says "done"; correctness is then decided by verify.py, never by the operator.

  stopwatch.py <participant> <population> <surface> <task> <run> <arg> [--repo DIR]

"Done" is signalled by creating trials/.done (the participant — a person at the keyboard or an agent — does
`touch trials/.done`). The row is appended to runs.csv immediately. Timeout: 600 s, recorded as incorrect.
"""
import csv, subprocess, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
DONE = HERE / ".done"
TIMEOUT = 600

def main() -> None:
    args = sys.argv[1:]
    repo = None
    if "--repo" in args:
        i = args.index("--repo"); repo = args[i + 1]; del args[i:i + 2]
    participant, population, surface, task, run, arg = args
    DONE.unlink(missing_ok=True)
    start = time.monotonic()
    print(f"START {participant} {surface} {task} run {run} arg={arg}", flush=True)
    while not DONE.exists() and time.monotonic() - start < TIMEOUT:
        time.sleep(0.2)
    seconds = round(time.monotonic() - start, 1)
    DONE.unlink(missing_ok=True)
    if surface == "S3":
        subprocess.run(["git", "-C", repo, "pull", "-q", "--ff-only"], check=False)
        cmd = [sys.executable, str(HERE / "verify.py"), "s3", repo, task, arg]
    else:
        cmd = [sys.executable, str(HERE / "verify.py"), "sanity", task, arg]
    out = subprocess.run(cmd, capture_output=True, text=True).stdout.strip()
    correct = 1 if out.startswith("1") else 0
    with (HERE / "runs.csv").open("a", newline="") as f:
        csv.writer(f).writerow([participant, population, surface, task, run, seconds, 0, correct])
    print(f"STOP {seconds}s correct={correct} evidence={out[2:]}", flush=True)

if __name__ == "__main__":
    main()
