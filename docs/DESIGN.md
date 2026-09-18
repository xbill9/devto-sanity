# Brawndo: It's Got What Content Craves

Design doc for a **Path Two** entry to the [DEV Sanity Challenge](challenge/challenge.md). Written 2026-09-18.
Deadline 2026-10-04, 11:59 PM PDT.

> *Brawndo's got what plants crave.* What do plants crave? *Electrolytes.* ... What are electrolytes?
> *It's what they use to make Brawndo.*

## 1. Thesis

Sanity's real product isn't a database or a query language. Postgres and SQLite do that. **It sells a data store that people who
can't use git can use.** This entry builds that claim as an Idiocracy parody, then **measures it with a stopwatch**. The build writeup
is the honest part: what the Brawndo actually bought, and what it didn't.

It's aimed at the Path Two judging order:

| Criterion | How this entry answers it |
|---|---|
| Quality and honesty of the build writeup | Measured non-programmer trials (§6), plus an embedded agent session with the prompts that failed |
| Functionality of the finished app | A public live scoreboard, a working kiosk, and a workflow that really gates the crops |
| Thoughtfulness of the schema | Workflow state lives only in the workflow instance, and votes are counted by GROQ (§3) |
| Creativity and originality | The Department of Agriculture is run by people who can't use git |

It also covers both bonus items: **Workflows** (§4.2) and the **App SDK** (§4.4).

## 2. The story the app tells

The Department of Agriculture's fields are dying. Every field is irrigated with Brawndo. The Secretary of the Interior (**an agent**)
drafts a proposal: *water the crops*. The Cabinet (**a human**) has to approve it. Citizens watch a public scoreboard and vote. If the plan
is approved, the fields switch to water and, some time later, sprout. If it's rejected, they stay dust.

Every surface is built so that a non-programmer can operate it. That's the claim under test.

## 3. Schema (Content Lake, dataset `production`)

| Type | Fields | Notes |
|---|---|---|
| `field` | `number`, `name`, `crop` (enum), `irrigation` (`brawndo` \| `water`), `growth` (`dust` \| `sprout` \| `crop`), `lastWatered` | `irrigation` and `growth` are rendered as picture buttons in the Kiosk |
| `citizen` | `handle` (pseudonym), `avatar` (image) | No real names; the dataset will be public (§8) |
| `proposal` | `title`, `body` (Portable Text), `fields` (refs → `field`), `author` (`agent` \| `person`) | **No status field.** Its stage lives in the workflow instance |
| `vote` | `citizen` (ref), `field` (ref), `choice` (`brawndo` \| `water`), `castAt` | One document per vote, never a counter |

Two design rules come straight from the house rules:

- **One source of truth for state.** A proposal's approval state is the workflow instance, which is itself a Sanity document
  ([Workflows introduction](sanity/workflows/introduction.md): "Status is a GROQ query"). Copying it onto `proposal` would drift.
- **Arithmetic belongs in the engine.** Tallies are GROQ, for example
  `count(*[_type == "vote" && field._ref == $id && choice == "water"])`. They're never summed in React, and never by the agent. The
  scoreboard displays whatever the query returns, and the writeup shows the query.

## 4. Surfaces

### 4.1 The Kiosk — customized Sanity Studio (for the Cabinet and the trials)

A St. God's Memorial Hospital–style Studio. Every input the Cabinet touches is a **custom input component** built with the
[Form Components API](sanity/studio/form-components.md) ([reference](sanity/studio/form-components-reference.md)): giant picture
buttons with no text entry.

- `irrigation`: two buttons, a Brawndo can and a glass of water.
- `growth`: read-only pictures (dust, sprout, crop).
- `crop`: a picture grid.
- A stock Studio workspace sits beside it, **unmodified**, as the control for the trials (§6).

Art is original parody made with `nb2lite`. No film stills or logos.

### 4.2 Joe's Plan — Sanity Workflows (bonus) ⚠ early access

A definition built with `@sanity/workflow-engine` ([quick start](sanity/workflows/getting-started.md)), `joes-plan`:

```
petition ──submit──▶ cabinet ──approve──▶ watering ──(clock)──▶ harvest
                        │
                        └──reject──▶ dust-bowl
```

- **`petition`**: the agent drafts the `proposal` and fires `submit`.
- **`cabinet`**: `approve`/`reject` actions, pinned to `roles: ['cabinet']`. The Cabinet uses the
  [Studio plugin](sanity/workflows/studio-plugin.md) (needs Studio ≥ 6.3.0 and React ≥ 19.2.7).
- **`watering`**: an effect switches the target fields to `irrigation: water`. A clock-conditioned transition moves to `harvest`.
- **`harvest`** and **`dust-bowl`**: terminal stages. `growth` is updated by the effect.
- Definitions get tested in memory with `@sanity/workflow-engine-test` ([testing](sanity/workflows/testing.md)) before any deploy.

**The joke that happens to be true, and has to be handled honestly.** Per
[Actors and enforcement](sanity/workflows/actors-and-enforcement.md), *"every check the engine makes is advisory"*. `roles`, guards
and action filters are UX. Anyone with a write token can bypass them. **The Cabinet has no real power unless dataset access control
backs it.** The design therefore:

1. Gives the agent a robot token whose role **cannot write `field` documents** (dataset access control / custom role). That's the
   only gate the Content Lake enforces.
2. Has watering effects run under a separate drainer token that does have write access, invoked only after `approve`.
3. Says all of this plainly in the writeup. It's the best Idiocracy beat in the whole piece: *the Cabinet is advisory.*

**Runtime:** Workflows is a library, not a service, so nothing moves unless code calls it
([prerelease](sanity/workflows/prerelease.md)).
- Queued effects need a drainer.
- The clock transition needs something to call `tick`.
- Plan: a Document Function drains new work, and a Scheduled Function ticks ([Sanity Functions](sanity/workflows/sanity-functions.md)).
- Fallback: a cron'd CLI script, which is `npx sanity-workflows` locally.

### 4.3 brawndo.gov — Next.js public scoreboard (the required front end)

Path Two requires "Next.js or Astro on the front, Sanity behind it."

- **Next.js App Router with `next-sanity`.** The fields grid and vote tallies update live via `defineLive` / `<SanityLive>`
  ([Next.js intro](sanity/frontend/introduction.md), [Live Content API](sanity/frontend/live-content-api.md), available on all plans).
- **Voting** is a server action that writes a `vote` document with a server-side token. The token never reaches the client, and votes are rate-limited per session.
- **The docket** shows the current workflow stage, read with a GROQ query over the instance.
- **The deploy target** is Cloud Run, the same as `devto-dog` (§9).

### 4.4 The Cabinet Room — App SDK dashboard app (bonus)

A custom app in the Sanity Dashboard ([App SDK intro](sanity/app-sdk/sdk-introduction.md),
[quickstart](sanity/app-sdk/sdk-quickstart.md): `npx sanity@latest init --template app-quickstart`). It isn't another read-only
frontend. It's the Cabinet's war room:

- a live crop map built with document handles and live hooks
- the docket of open proposals with approve/reject, using the Workflows App SDK adapter `@sanity/workflow-sdk`
  ([App SDK adapter](sanity/workflows/app-sdk.md))
- a live vote split per field, computed by a GROQ `count()`

Auth is Dashboard mode ([authentication](sanity/app-sdk/sdk-authentication.md)), so Cabinet members need Sanity accounts. Deploy it with
`npx sanity deploy --title "Cabinet Room"`.

### 4.5 The Secretary of the Interior — the agent

A small agent that connects to the Workflows MCP server `@sanity/workflow-mcp` ([MCP](sanity/workflows/mcp.md)), and to a read-only
query surface for field state. It can draft proposals, fire `submit` and read the docket. **It cannot approve, and it cannot write
fields.** That's enforced by its token (§4.2), not by its prompt. The model and framework are open (§9). Its prompts, failures and
course corrections go into the writeup.

## 5. Repository layout

```
studio/        Sanity Studio: schema, Kiosk input components, stock workspace, Workflows plugin
workflows/     joes-plan definition, sanity.workflow.ts, in-memory tests
functions/     drainer and ticker (Sanity Functions)
web/           Next.js brawndo.gov
cabinet/       App SDK Cabinet Room
agent/         Secretary of the Interior
trials/        protocol, raw timings CSV, analyze.py — see §6
docs/          this doc, brainstorm, saved reference docs
```

## 6. The stopwatch — "can idiots use a data store?"

This is the measured centerpiece of the writeup. The claim under test is that **a non-programmer completes content edits faster and with
fewer errors in the Kiosk than in stock Studio, and in both than in a markdown file on GitHub.**

**Surfaces (S)**
- **S1** Kiosk: picture-button Studio
- **S2** stock Studio: same schema, default inputs
- **S3** a YAML-frontmatter markdown file edited in GitHub's web editor and committed. This is the realistic "no git CLI" path, the
  same shape as `~/tether`.

**Tasks (T)**
- **T1** switch field 7 from Brawndo to water
- **T2** add a new citizen with an avatar
- **T3** find the field with the most water votes and mark it for the next proposal. The answer comes from a GROQ count; the task
  measures whether the participant can find it.

**Protocol**
- Each participant runs every S × T cell, **three runs per cell, never one**. Each run targets a different field or citizen, so memory
  doesn't carry over.
- Surface order is counterbalanced with a Latin square across participants.
- **Recorded per run:** wall-clock time to done, whether the result is correct (checked by a script against the dataset or repo, not
  by eye), and the count of assists requested.
- Screen recording, with consent.
- **Raw rows** go to `trials/runs.csv`, one row per run.
- **Every** median, min, max and spread in the article is computed by `trials/analyze.py` from that CSV and quoted verbatim. Nothing is
  summarized by hand or by a model.
- **Honesty clause:** n will be tiny (1–3 people). The article says so, publishes every raw row, and reports the spread as the finding
  rather than a single best number.

**Participants:** 1–3 non-programmers from friends or family, identified by pseudonym only. See §9.

## 7. Build order

The calendar is gone; this is being built in one push. The only hard date is the deadline (2026-10-04, 11:59 PM PDT).

**Status 2026-09-18:**
- Steps 1–4 are built and pass `make check` offline. The agent (step 7 code) and the Cabinet Room are built and typecheck too.
- Everything from step 5 on needs a Sanity login. The runbook is in [../README.md](../README.md).

| # | Work | Needs Sanity login? | Exit check |
|---|---|---|---|
| 1 | Repo, Studio scaffold, schema, Kiosk inputs, seed data | No (to build) | `sanity build` succeeds |
| 2 | `joes-plan` definition with in-memory tests | No | Tests prove approve → harvest and reject → dust-bowl |
| 3 | Next.js brawndo.gov, voting server action | No (to build) | `next build` succeeds |
| 4 | `trials/` protocol and `analyze.py` | No | `analyze.py` runs on a fixture CSV |
| 5 | **Go/no-go:** create the project; confirm Workflows early access, Functions and custom roles | **Yes** | `sanity-workflows deploy --check` passes, or take the fallback in §8 |
| 6 | Deploy Studio and the workflow; tokens and roles; drainer and ticker | Yes | An agent-token field write is rejected by the Content Lake |
| 7 | Agent, Cabinet Room (cut first if short on time) | Yes | The agent submits and the Cabinet approves end to end |
| 8 | Stopwatch trials, writeup, publish | Yes | `runs.csv` complete; the post is live |

## 8. Risks and fallbacks

| Risk | Fallback |
|---|---|
| Workflows is early access; APIs and stored data may break ([prerelease](sanity/workflows/prerelease.md)) | Pin all `@sanity/workflow-*` packages to one exact version. If it isn't available on day 1: a `stage` field plus Studio document actions, with the writeup saying why |
| Custom roles or dataset access control not available on the plan in use | Drop the hard gate, **say so in the article**, and let "the Cabinet is advisory" become the literal punchline |
| Scheduled Functions may need an organization-scoped Blueprint stack | Run a cron'd CLI ticker from a small VM or Cloud Run job |
| Public voting abuse | Rate limiting per session; one vote per citizen per field, checked in the server action |
| The submission requires a project ID or public dataset URL ([challenge](challenge/challenge.md)) | Make `production` public-read; keep pseudonyms only and no secrets in any document |
| Trademark or likeness | Original parody art only; no stills, logos or quotes beyond short parody lines |

## 9. Decisions (defaults, 2026-09-18)

The owner is Brawndo and declines to answer questions, so these are defaults. Any of them can be overridden later.

1. **Participants:** use a human non-programmer if one turns up by Oct 1. **Otherwise, Claude in Chrome is the participant.** It runs
   the same S × T × 3 protocol through the browser, and the article labels it plainly as an agent, not a person. That's arguably the
   stranger and better experiment: *can Claude use a data store built for idiots, and is the Kiosk easier for it than GitHub?* If both
   are available, run both and report them as separate populations. Never pool them.
2. **Agent stack:** Claude (`claude-opus-5`) through the Anthropic API, connected to `@sanity/workflow-mcp`. It's the fewest moving parts,
   and there's no second framework to debug. Counting still stays in GROQ.
3. **Hosting for brawndo.gov:** Cloud Run, the same as `devto-dog`.
4. **Scope cut order:** the Cabinet Room goes first, then the agent. The Kiosk, the workflow, the scoreboard and the stopwatch are the
   entry.
5. **Plan tier and custom roles:** don't ask; **check it** as part of the day-1 go/no-go (§7). If custom roles aren't available, take
   the "Cabinet is advisory" fallback in §8.
