#!/usr/bin/env python3
"""Decide whether a trial run's result is correct. The operator's opinion is not recorded; this is.

  verify.py sanity T1 <field-number>            field N has irrigation == water
  verify.py sanity T2 <handle>                  a citizen with that handle exists
  verify.py sanity T3 <proposal-id>             the proposal includes the field with the most water votes
  verify.py s3 <repo-dir> T1|T2|T3 <arg>        the same checks against the markdown repo

Prints 1 or 0 (for the `correct` column) and the evidence. Sanity checks read the public dataset
over the HTTP query API; SANITY_PROJECT_ID and SANITY_DATASET come from the environment.
The "most water votes" answer is a GROQ count() computed by the Content Lake, not here.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

API = "v2026-09-01"

MOST_WATERED = (
    '*[_type == "field"]{_id, "w": count(*[_type == "vote" && field._ref == ^._id && choice == "water"])}'
    " | order(w desc)[0...2]"
)


def groq(query: str, params: dict) -> object:
    project, dataset = os.environ["SANITY_PROJECT_ID"], os.environ.get("SANITY_DATASET", "production")
    qs = {"query": query, **{f"${k}": json.dumps(v) for k, v in params.items()}}
    url = f"https://{project}.api.sanity.io/{API}/data/query/{dataset}?{urllib.parse.urlencode(qs)}"
    with urllib.request.urlopen(url, timeout=15) as resp:
        return json.load(resp)["result"]


def most_watered_sanity() -> str:
    top = groq(MOST_WATERED, {})
    if len(top) > 1 and top[0]["w"] == top[1]["w"]:
        sys.exit(f"tie for most water votes: {top} — reassign the run before starting it")
    return top[0]["_id"]


def check_sanity(task: str, arg: str) -> tuple[bool, object]:
    if task == "T1":
        got = groq('*[_type == "field" && number == $n][0].irrigation', {"n": int(arg)})
        return got == "water", {"irrigation": got}
    if task == "T2":
        got = groq('count(*[_type == "citizen" && handle == $h])', {"h": arg})
        return got >= 1, {"citizens_with_handle": got}
    if task == "T3":
        target = most_watered_sanity()
        got = groq("*[_id == $p][0].fields[]._ref", {"p": arg}) or []
        return target in got, {"most_watered": target, "proposal_fields": got}
    sys.exit(f"unknown task {task}")


def frontmatter(path: Path) -> dict:
    m = re.match(r"---\n(.*?)\n---", path.read_text(), re.S)
    out = {}
    for line in (m.group(1) if m else "").splitlines():
        key, _, value = line.partition(":")
        out[key.strip()] = value.strip().strip('"')
    return out


def check_s3(repo: Path, task: str, arg: str) -> tuple[bool, object]:
    if task == "T1":
        hits = [frontmatter(p) for p in (repo / "fields").glob("*.md") if frontmatter(p).get("number") == arg]
        got = hits[0].get("irrigation") if hits else None
        return got == "water", {"irrigation": got}
    if task == "T2":
        got = sum(1 for p in (repo / "citizens").glob("*.md") if frontmatter(p).get("handle") == arg)
        return got >= 1, {"citizens_with_handle": got}
    if task == "T3":
        # Votes live in Sanity; the target is the same engine-computed answer for every surface.
        target = most_watered_sanity()
        text = (repo / "proposals" / f"{arg}.md").read_text() if (repo / "proposals" / f"{arg}.md").exists() else ""
        return target in text, {"most_watered": target, "proposal_file_mentions_it": target in text}
    sys.exit(f"unknown task {task}")


def main() -> None:
    if len(sys.argv) >= 4 and sys.argv[1] == "sanity":
        ok, evidence = check_sanity(sys.argv[2], sys.argv[3])
    elif len(sys.argv) >= 5 and sys.argv[1] == "s3":
        ok, evidence = check_s3(Path(sys.argv[2]), sys.argv[3], sys.argv[4])
    else:
        sys.exit(__doc__)
    print(1 if ok else 0, json.dumps(evidence))


if __name__ == "__main__":
    main()
