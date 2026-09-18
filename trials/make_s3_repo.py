#!/usr/bin/env python3
"""Build the S3 surface: the same seed data as markdown files with YAML frontmatter.

One file per document, like ~/tether. The participant edits these in GitHub's web editor.
Usage: make_s3_repo.py [out_dir]   (default: s3-repo/)
"""
import json
import sys
from pathlib import Path

SEED = Path(__file__).resolve().parent.parent / "studio" / "seed" / "seed.ndjson"


def frontmatter(doc: dict) -> str:
    lines = ["---"]
    for key, value in doc.items():
        if key.startswith("_"):
            continue
        lines.append(f"{key}: {json.dumps(value) if isinstance(value, str) else value}")
    return "\n".join(lines + ["---", ""])


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("s3-repo")
    for sub in ("fields", "citizens", "proposals"):
        (out / sub).mkdir(parents=True, exist_ok=True)
    docs = [json.loads(line) for line in SEED.read_text().splitlines() if line.strip()]
    for doc in docs:
        sub = {"field": "fields", "citizen": "citizens"}[doc["_type"]]
        (out / sub / f"{doc['_id']}.md").write_text(frontmatter(doc))
    (out / "README.md").write_text(
        "# Department of Agriculture\n\n"
        "- Fields are in `fields/`. Change `irrigation:` to `\"water\"` to water one.\n"
        "- Citizens are in `citizens/`. Copy one to add a citizen.\n"
        "- Proposals are in `proposals/`. List field ids under `fields:`.\n"
    )
    print(f"wrote {len(docs)} documents to {out}")


if __name__ == "__main__":
    main()
