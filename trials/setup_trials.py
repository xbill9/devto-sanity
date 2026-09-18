#!/usr/bin/env python3
"""Create the Sanity-side fixtures for one participant's trials and print the run sheet.

Per run: T1 waters a distinct field, T2 adds a distinct handle, T3 amends a distinct proposal. Two extra water
votes make field-05 the unique "most water votes" answer (verify.py refuses to start a T3 run on a tie).
Needs SANITY_PROJECT_ID and SANITY_DRAINER_TOKEN (source ../env.sh).
"""
import json, os, sys, urllib.request

P, TOKEN = os.environ["SANITY_PROJECT_ID"], os.environ["SANITY_DRAINER_TOKEN"]
PARTICIPANT = sys.argv[1] if len(sys.argv) > 1 else "A1"
ORDER = {1: ["S1", "S2", "S3"], 2: ["S2", "S3", "S1"], 0: ["S3", "S1", "S2"]}[int(PARTICIPANT[1:]) % 3]
T1_FIELDS = {"S1": [1, 2, 3], "S2": [4, 6, 8], "S3": [10, 11, 12]}

def mutate(mutations):
    req = urllib.request.Request(
        f"https://{P}.api.sanity.io/v2026-09-01/data/mutate/production",
        data=json.dumps({"mutations": mutations}).encode(),
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
    )
    return json.load(urllib.request.urlopen(req, timeout=20))

muts = []
for s in ("S1", "S2"):  # S3's proposals live in the markdown repo
    for r in (1, 2, 3):
        muts.append({"createOrReplace": {"_id": f"trial-{PARTICIPANT}-{s}-{r}".lower(), "_type": "proposal",
                                         "title": f"Trial {PARTICIPANT} {s} run {r}", "author": "person",
                                         "fields": [{"_type": "reference", "_ref": "field-01", "_key": "seed"}]}})
for i in (1, 2):
    cid = f"citizen-trialvoter-{i}"
    muts.append({"createOrReplace": {"_id": cid, "_type": "citizen", "handle": f"Trial voter {i}"}})
    muts.append({"createOrReplace": {"_id": f"vote-{cid}-field-05", "_type": "vote", "choice": "water",
                                     "citizen": {"_type": "reference", "_ref": cid},
                                     "field": {"_type": "reference", "_ref": "field-05"}, "castAt": "2026-09-18T18:00:00Z"}})
# Every T1 target starts on Brawndo, or the task would already be done.
for s in ("S1", "S2"):
    for n in T1_FIELDS[s]:
        muts.append({"patch": {"id": f"field-{n:02d}", "set": {"irrigation": "brawndo"}}})
mutate(muts)

print(f"run sheet for {PARTICIPANT} (surface order {', '.join(ORDER)})")
for s in ORDER:
    for task in ("T1", "T2", "T3"):
        for r in (1, 2, 3):
            arg = {"T1": str(T1_FIELDS[s][r - 1]), "T2": f"{PARTICIPANT}-{s}-{r}",
                   "T3": f"trial-{PARTICIPANT}-{s}-{r}".lower()}[task]
            print(f"{s} {task} {r} {arg}")
