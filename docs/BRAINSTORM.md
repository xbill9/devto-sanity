# Brainstorm: Sanity Challenge entry

Written 2026-09-18 after surveying the repos in `~`. Challenge brief: [challenge/challenge.md](challenge/challenge.md).

## The constraint that shapes every Path One idea

Path One requires "a Sanity Context MCP endpoint backed by a Knowledge Base". But one MCP serves **one** source type
([retrieval-modes](sanity/context/sanity-context-retrieval-modes.md)):

- **Knowledge Base mode** serves `initial_context` and `knowledge_base_read`. That reads prose entries. Nothing counts or filters.
- **GROQ mode** serves `groq_query`, `schema_explorer` and friends. The engine can filter and `count()`.
- If you attach both kinds of source to one MCP, **the dataset wins silently**, and the agent loses the KB with no error.

So an agent that needs both knowledge and exact numbers connects to **two MCP endpoints**: a KB-mode one for "what is true / what contradicts
what", and a GROQ-mode one for "how many / which is fastest". That is also the house rule: arithmetic belongs in the engine, not the model.
It also gives a direct answer to the judges' line "if a keyword search would have gotten you the same answer, aim higher".

## Idea 1 — Gemma rig advisor (Path One) ★ recommended

*"Which accelerator should I serve Gemma 4 on, for what, at what cost, and does it actually work?"*

**Source material:** `~/gemma4-dev`.
- About 60 rig directories spanning TPU v5e/v5p/v6e, Inferentia2, T4/T4G/L4/MI300X and CPU.
- `NAMING.md`, `HARDWARE.md`, `TPU.md`, `QUANTIZATION.md` and `RIG-ANALYSIS.md`.
- 34 benchmark report files, 24 distinct filenames, all validated against `serving-report.schema.json`.

**Why the content has to be structured, and why the conflicts are real:**
- The rollup already says "five rigs on one row is one measurement, not five": reports travelled with forks. A keyword search over rig
  folders over-counts, while a GROQ query over report documents keyed on `run.id` doesn't.
- "`<hw-short>` is the hardware measured, not the rig the file sits in." Inferring hardware from location gives wrong answers.
- Siblings spell the same accelerator differently (`v5litepod-1` vs `v5e-1`), and the env file is authoritative, not the directory name.
- README copy-drift: the older standalone `~/tpu-jax-12b` and `~/tpu-jax-31b` READMEs both claim to serve **E2B** (their `gemma4-dev`
  successors don't). If those repos are included as a source, the KB build should surface this kind of contradiction side by side with
  its sources, which is exactly the feature Path One advertises.
- Vendor docs (TPU and GPU pricing pages, vLLM hardware support) versus measured numbers. For example, "vLLM supports SM 7.5" versus the
  `2026-08-31-crossrig` rows with no throughput.

**Shape:**
- **Dataset (GROQ MCP):** the `servingReport` type is the JSON schema mapped 1:1, plus the `rig`, `hardware` and `model` it references. Load
  it with a script from the existing JSON, never by hand.
- **Knowledge Base (KB MCP):** the rig docs, the published articles and a small set of vendor pages. The resolved conflicts become durable
  build instructions.
- **Agent:** reuse existing ADK or Strands scaffolding (`adk-hello-world`, `multicloud-a2a-subagent`), with two MCP tools. Every numeric
  answer quotes the GROQ filter it sent, because a wrong predicate returns an exact, cited, wrong number.
- **Built-in eval:** a fixed question set where the answer is computed by `rollup.py`, so the demo can show "the agent matched the
  engine, 20/20".

**Risk:** Knowledge Bases and Workflows are new, so budget day 1 for the [quick start](sanity/context/sanity-context-quick-start.md).

## Idea 2 — Iceberg catalog truth-teller (Path One)

*"Does catalog X actually support operation Y?"* Source: `~/lakehouse-iceberg-2026`. Three published papers already have the thesis
"what they declare vs what they serve", and they carry `evidence/` directories. Declared-vs-served is a native KB conflict. It's strong,
but the audience is narrower than Idea 1's, and it overlaps work that's already published.

## Idea 3 — Article pipeline as a Sanity Workflow (Path Two)

Model the `~/publishing-kit` flow as data: **draft → cover image → render tables and code to images → preflight → human approve → publish**.

- **Workflows:** an agent moves the draft forward, and a person approves it through the same transitions. That's the challenge's own
  wording for the bonus.
- **Guards encode the Medium silent killers from `~/.claude/CLAUDE.md`:** no link in `figcaption`, a content-addressed import URL, the
  canonical tag stripped, and `####` headings.
- **App SDK:** a preflight dashboard instead of another read-only frontend.
- It reuses `nb2lite` for covers. The honest build writeup is 40% of the Path Two judging, and this one would be dogfooded.

Caveat: Workflows is early access, and Content Lake enforcement for deployed guards
[has not shipped](sanity/workflows/cookbook.md).

## Idea 4 — Tether log in Sanity (Path Two, small)

`~/tether` is already markdown-as-database, with YAML frontmatter data and a prose body. Migrate it to a schema. The "three runs, never one"
methodology becomes validation, and a retest becomes a workflow. It's the cleanest schema story, but it isn't very strange.

## Suggested plan

Both paths are allowed, with a separate post each. **Idea 1 for Path One** is the primary entry. **Idea 3 for Path Two** only if time
remains after the first week. Deadline: 2026-10-04, 11:59 PM PDT.

---

## Round 2 — what Sanity actually brings, and weirder ideas

**Honest take on Round 1:** Idea 1 is Postgres plus RAG with a Sanity sticker on it. A schema'd JSON store with a query language is not
unique. Only three things in the docs are hard to get elsewhere:

1. **Knowledge Base builds refuse to guess.** When sources disagree, the build raises a conflict and shows both claims with their sources.
   You pick one, and the pick becomes a standing instruction for future rebuilds. If the source changes, the instruction is archived
   with a reason ([resolve-issues](sanity/context/sanity-context-resolve-issues.md)). This is beta and needs a Labs opt-in.
2. **Workflows make the process itself a document.** People, agents and apps move the same instance through the same transitions, and
   "what's blocked and why" is a GROQ query ([introduction](sanity/workflows/introduction.md)). This is early access.
3. **Live, multi-user documents in your own UI** (App SDK hooks, live by default).

A bonkers project should need at least one of those.

### A — Sherlock Holmes Continuity Court (Path One)
The canon contradicts itself. Watson's war wound is in the shoulder in *A Study in Scarlet* and in the leg in *The Sign of Four*. Feed
public-domain Doyle texts (Project Gutenberg) plus a fan wiki into a Knowledge Base. Every conflict the build raises is a **case on the
docket**. You rule on it once, the ruling becomes binding precedent for every future build, and the agent is a pompous barrister who
cites precedent. Ask "how many wounds does Watson have?" and it answers with the ruling, both sources and the date of the decision.
Feature 1 is the whole premise; keyword search would just hand you both passages.

### B — The Tribunal of Past Selves (Path One)
The source material is your own instruction files across `~`: 42 `CLAUDE.md`, 27 `AGENTS.md` and 83 `GEMINI.md` at repo roots, many of
them forks (`-claude`, `-codex`, `-agy`, `-kiro`) that have since drifted. The KB build finds where past-you contradicts present-you.
You adjudicate. The agent then answers "what does xbill believe about X?" and cites the ruling. This is weird, personal and real,
and the corpus doesn't exist anywhere else.

### C — Dog or Not: Court of Appeals (Path Two, extends `~/devto-dog`)
The scanner's verdicts become Workflow instances. An uncertain or contested "NOT A DOG" ruling is appealed by an agent lawyer, then goes
to a human Dog Tribunal, and the precedent is filed. The App SDK adds a live public docket that everyone watches in real time. This uses
feature 2 exactly as the challenge describes it (an agent moves a draft forward, a person approves), for the stupidest possible cause.

### D — Midsommer Madness level foundry (Path Two, extends `~/midsommer-wasm`)
Levels become Sanity documents. An agent proposes a level, a playtest bot runs it, a human approves it, and the level ships to the live
WASM game. A live App SDK editor lets you and the agent drag maypoles around the same level at the same time.

---

## Round 3 — Brawndo: It's Got What Content Craves (Path Two) ★ current favourite

**Thesis:** Sanity's real product is that people who can't use git can use a data store. Prove it Idiocracy-style, then measure it.

- **Schema:** the Department of Agriculture. `field` documents (crop status, Brawndo vs water), `proposal` documents (Joe's plan), and
  `citizen` documents.
- **Studio customization:** the St. God's Memorial Hospital kiosk. Every input is a custom component made of giant picture buttons, with no
  text fields. This hits the brief's "did you customize the interface? build a new component".
- **Workflows (bonus):** "Joe's Plan". An agent drafts "water the crops", the Cabinet (a human) approves through the same transitions,
  and fields change state. This hits "an agent can move a draft forward and a person can approve it".
- **App SDK (bonus):** a live Crop Status scoreboard. Citizens vote and watch fields grow or die in real time.
- **The measured part (the honest writeup):** time a non-programmer making the same edit three ways: picture-button Studio, stock
  Studio, and a markdown file in git. Three runs each, never one. The headline table comes from the stopwatch, not from vibes.
- **Build log:** vibe-coded in Claude Code, with the agent session embedded (made public, secrets scrubbed).

Use original parody art (nb2lite) and no film stills or logos.
