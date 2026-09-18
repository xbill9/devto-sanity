# Stopwatch protocol — "can idiots use a data store?"

Design: [../docs/DESIGN.md §6](../docs/DESIGN.md). This file is the procedure the operator follows.

## Surfaces

| Code | Surface | URL / location |
|---|---|---|
| S1 | Kiosk — picture-button Studio | `<studio>/kiosk` |
| S2 | Stock Studio — same schema, default inputs | `<studio>/stock` |
| S3 | Markdown on GitHub — web editor, then commit | `trials/s3-repo/` pushed to a scratch GitHub repo |

## Tasks

| Code | Task (read aloud verbatim) | Correct when (checked by `verify.py`, not by eye) |
|---|---|---|
| T1 | "Switch field N from Brawndo to water." | field N has `irrigation: water` |
| T2 | "Add a new citizen called H." | a citizen with handle H exists |
| T3 | "Find the field with the most water votes and add it to proposal P." | P's fields include that field (answer precomputed with GROQ `count()`) |

Each run uses a **different** N, H or P, so memory of the last answer doesn't carry over. The run sheet assigns them.

## Procedure

1. Participant code only (`P1`, `P2`, …; `A1` for the Claude in Chrome agent). Never a name.
2. Read the consent line. Recording is optional and stored under `trials/recordings/` (gitignored).
3. Surface order follows the Latin square below by participant number. Within a surface: T1, T2, T3, three runs each.
4. Start the clock when the task text finishes. Stop it when the participant says "done". Record the wall-clock seconds.
5. Assists: count every time the participant asks for help and the operator answers. Answer only with the task text again.
6. Correctness is recorded afterwards by `verify.py` against the dataset or repo. The operator's opinion is not recorded.
7. One CSV row per run, appended to `runs.csv` immediately. Never reconstructed afterwards.

## Latin square (surface order)

| Participant mod 3 | Order |
|---|---|
| 1 | S1, S2, S3 |
| 2 | S2, S3, S1 |
| 0 | S3, S1, S2 |

## CSV columns (`runs.csv`)

`participant,population,surface,task,run,seconds,assists,correct`

- `population`: `human` or `agent`. **Never pooled.** `analyze.py` reports them separately.
- `correct`: `1` or `0`, as written by `verify.py`.

## Reporting rules

- Every number in the article comes from `analyze.py` output, quoted verbatim.
- Report median **and** min/max. With three runs, the spread is the finding.
- Publish `runs.csv` in full, alongside the article.
