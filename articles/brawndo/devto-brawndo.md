---
title: "It's Got What Content Craves: Sanity, Built for the People of Idiocracy"
published: false
description: "An agent proposes watering the crops, a human Cabinet approves in a picture-button Studio, and Sanity Workflows waters and harvests. Plus a stopwatch on three ways to edit the same data."
tags: devchallenge, sanitychallenge, sanity, ai
cover_image: https://raw.githubusercontent.com/xbill9/devto-sanity/main/articles/brawndo/devto-cover.d67a2736.jpg
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

*This article provides a step by step build of a **Sanity** project for the Department of Agriculture from Idiocracy, where every field is irrigated with Brawndo. An agent proposes watering the crops, a human Cabinet approves in a picture-button Studio, and **Sanity Workflows** waters and harvests the fields. A stopwatch then times the same edits in three interfaces.*

[github.com/xbill9/devto-sanity](https://github.com/xbill9/devto-sanity)

| | |
|---|---|
| Project | Sanity `ukyhb6bu`, dataset `production` (public read), Growth trial |
| Studio | Sanity Studio 6, two workspaces over one schema: **Kiosk** and **Stock** |
| Workflow | `joes-plan` v1, `@sanity/workflow-*` 0.33.0 (early access) |
| Front end | Next.js 16 + `next-sanity` live content, on Cloud Run |
| Dashboard app | App SDK **Cabinet Room** |
| Agent | Claude (`claude-opus-5`) + `@sanity/workflow-mcp` |
| Result | agent → Cabinet → watering → **harvest** on the live project; **27 of 27** timed edits correct |

---

#### What I Built

In Idiocracy the crops are dying because every field is watered with Brawndo. It's got electrolytes. Joe's plan is to water them. With water. Like from the toilet.

This is that Department of Agriculture, run on Sanity. The Secretary of the Interior is an **agent**. It drafts a proposal to water the fields and submits it. The **Cabinet**, a person, approves or rejects it. Citizens vote on a public scoreboard. An approved plan waters the fields, they sprout, and a few minutes later they are harvested. A rejected plan leaves a dust bowl.

The one pitch for a CMS that holds up is that people who can't use git can use a data store. So the editing Studio is a kiosk of giant picture buttons, like the hospital in the film.

| Surface | Built with | Who uses it |
|---|---|---|
| **The Kiosk** | Studio with custom picture-button inputs + the Workflows plugin | the Cabinet |
| **Joe's Plan** | Sanity Workflows | the agent, the Cabinet, the runtime |
| **brawndo.gov** | Next.js + `next-sanity` | citizens |
| **The Cabinet Room** | App SDK dashboard app | the Cabinet |

---

#### Demo

**brawndo.gov:** [brawndo-gov-289270257791.us-central1.run.app](https://brawndo-gov-289270257791.us-central1.run.app) — vote on a field; voting again replaces your vote.

The Kiosk is hosted at `brawndo-agriculture.sanity.studio` and signs in through the Sanity Dashboard.

PENDING: video walkthrough.

---

#### Code

https://github.com/xbill9/devto-sanity

`make check` runs the offline suite. The README has the go-live runbook.

---

#### My Build Process

The whole project was built in one Claude Code session, from an empty directory to a harvested field. The session is embedded at the end.

---

#### Where Do I Start?

With what Sanity sells. A schema'd JSON store with a query language is common. Three things in Sanity's docs are harder to find elsewhere:

1. **Knowledge Bases** surface conflicting sources side by side and keep your ruling across rebuilds.
2. **Workflows** make the process a document. People, agents and apps move the same instance through the same transitions.
3. **The App SDK** gives live, multi-user documents in your own interface.

A Path Two app built around the second one is the right Brawndo.

---

#### At This Point You Should Have…

- Node.js 22.12 or newer (Sanity Studio 6 requires it; this build used Node 24 LTS through nvm)
- A Sanity project. `npx sanity new` creates one with no account and a 72-hour claim link
- The repository cloned, with its environment script sourced (`source ./env.sh` in the repository root)

---

#### Step 1 — One Schema, Two Studios

The schema is defined once and built twice. `buildSchema({kiosk: true})` swaps a picture-button input into every enumerated field. `buildSchema({kiosk: false})` keeps Sanity's defaults. Two Studio workspaces share one dataset, so the stock Studio is the same data without the Brawndo.

A proposal has **no status field**. Its stage lives in its workflow instance, which is itself a Sanity document, so there is one source of truth for where a plan stands.

---

#### Step 2 — Joe's Plan

```
petition ──submit──▶ cabinet ──approve──▶ watering ──▶ growing ──(harvestAt)──▶ harvest
                        └──reject──▶ dust-bowl
```

The definition runs in Sanity's in-memory test bench before it is deployed:

```console
 ✓ definitions/joes-plan.test.ts (8 tests)
      Tests  8 passed (8)
```

The tests prove the Secretary cannot approve, a rejection ends in the dust bowl, failed watering ends in the dust bowl, and harvest waits for `harvestAt`.

🔎 Tip: an effect handler's `outputs` land in `$effects['<effect>']`. To write a workflow field, return `ops` with an explicit `target.scope`:

```typescript
return {
  outputs: {harvestAt},
  ops: [{type: 'field.set', target: {scope: 'workflow', field: 'harvestAt'}, value: {type: 'literal', value: harvestAt}}],
}
```

---

#### Step 3 — The Cabinet Is Advisory

Sanity's Workflows docs say every check the engine makes is advisory. Role checks, guards and action filters shape the interface; the Content Lake enforces only dataset access control. So the Cabinet's power depends on a role the agent's token lacks.

The Growth trial has the eight built-in roles and no custom ones:

```console
Error: workflow.deployDefinitions: unknown project roles for project "ukyhb6bu":
  - joes-plan: generated role condition references unknown role "secretary"
  - joes-plan: generated role condition references unknown role "cabinet"
```

The definition therefore reads its role names from the environment and deploys with `administrator` for the Cabinet and `editor` for the Secretary. A robot token cannot hold `administrator`:

```console
$ sanity tokens add brawndo-e2e-cabinet --role administrator ...
Error: Invalid role "administrator". Available roles: editor, developer,
contributor, access-manager, blueprints-deployer, deploy-studio, viewer
```

⚠️ **The Cabinet can only be a person, and it has no power.** The agent's `editor` token can write the fields directly. The Cabinet has a seat, a button, and an advisory vote. That's the movie.

---

#### Step 4 — Water the Crops

The agent submits, the Cabinet approves in the Kiosk, and the runtime waters and harvests. Live, on the project:

```console
16:46:07  agent submitted cabinet
16:46:08  agent approve rejected (engine verdict, advisory) ActionDisabledError
16:46:59  drainer watered { stage: 'growing', harvestAt: '2026-09-18T16:47:00.255Z' }
16:47:16  final stage harvest
16:47:16  fields after harvest [ { growth: 'crop', irrigation: 'water', number: 7 },
                                 { growth: 'crop', irrigation: 'water', number: 9 } ]
```

Between the second and third lines, a person clicked **Approve (water)** in the Kiosk.

🔎 Tip: Workflows is a library. Nothing moves unless code calls it, so something has to call `tick` after `harvestAt` passes and drain queued effects. Here that is `npm run runtime:watch`; in production it is a pair of Sanity Functions.

---

#### Step 5 — Arithmetic Belongs in the Engine

Every tally on brawndo.gov is a GROQ `count()` computed by the Content Lake:

```groq
count(*[_type == "vote" && field._ref == ^._id && choice == "water"])
```

Nothing is summed in React, and the agent never counts rows. Its `field_report` tool returns the engine's numbers with the filter it ran.

One vote per citizen per field holds by construction: a vote's `_id` is built from both, so voting again replaces the vote. Three votes in, two votes out, read back anonymously:

```console
vote field-07 -> HTTP 200
vote field-07 -> HTTP 200
vote field-03 -> HTTP 200
anonymous public read: {'anonCitizens': 1, 'f7water': 1, 'votes': 2}
```

🔎 Tip: a document `_id` containing a dot is never served anonymously from a public dataset. Vote ids use hyphens. Workflow instance ids contain dots (`dev.wf-instance.…`), so brawndo.gov reads the docket on the server with a token.

🔎 Tip: on a service that scales to zero, a prerendered page shows build-time data after every cold start. The scoreboard renders per request, and `<SanityLive>` keeps an open page current.

---

#### Step 6 — The Stopwatch

The question behind the Kiosk: can idiots use a data store? The protocol times three tasks in three interfaces, three runs each:

- **Water a field.** Switch field N from Brawndo to water.
- **Add a citizen.** Create a citizen with handle H.
- **Amend a proposal.** Find the field with the most water votes on brawndo.gov and add it to proposal P.

The interfaces are the Kiosk, the stock Studio, and the same data as markdown files edited in GitHub's web editor.

A script starts the clock when the task is issued and stops it when the participant signals done. Another script checks the result against the dataset or the repository and records whether it is correct. Every number below comes from `analyze.py` reading the raw CSV, which is published in the repository.

The first participant is an agent: Claude, driving Chrome through the Claude in Chrome extension.

---

#### Compare and Contrast

Median seconds over three runs, participant A1 (the agent):

| Surface | Water a field | Add a citizen | Amend a proposal | Correct |
|---|---:|---:|---:|---:|
| Stock Studio | 🥇 24.8 s | 🥇 16.8 s | 🥇 37.6 s | 9/9 |
| Kiosk (picture buttons) | 🥈 26.4 s | 🥈 25.6 s | 🥈 41.4 s | 9/9 |
| Markdown on GitHub | 🥉 37.2 s | 🥉 41.2 s | 🥉 46.2 s | 9/9 |

The stock Studio is fastest for the agent on every task, and GitHub is slowest on every task. The agent reads the accessibility tree, where a giant picture of a water glass and a small radio button carry the same label.

Both Studios beat editing files. Adding a citizen in GitHub means creating a file, naming it, and typing the frontmatter by hand. Amending a proposal means editing an array inside YAML without breaking it.

---

#### So, Which One?

For an agent, the stock Studio. For the people of Idiocracy, the Kiosk, and that is the next measurement: the same protocol with a person who has never used git.

---

#### Sanity Project Details

- Project ID: `ukyhb6bu`, dataset `production` (public read)
- Workflow: `joes-plan` v1, tag `dev`
- Schema types: `field`, `citizen`, `proposal`, `vote`

---

#### Agent Session

PENDING: curated Claude Code session, made public, with secrets checked.

---

#### Summary

The goal of this article was to build the Department of Agriculture from Idiocracy on Sanity and time whether its interface for non-programmers makes editing faster. The key to the solution was Sanity Workflows, where an agent and a person move the same document through the same transitions. The results were:

- 🟢 Joe's Plan runs end to end on a live project: the agent submits, a person approves in the Kiosk, the runtime waters and harvests
- 🟢 **27 of 27** timed edits correct across three interfaces
- 🟢 Stock Studio fastest for the agent on every task: **24.8 s**, **16.8 s** and **37.6 s** medians
- ❌ Markdown on GitHub slowest on every task: **37.2 s**, **41.2 s** and **46.2 s** medians
- ⚠️ The Cabinet can only be a person, because a robot token cannot hold `administrator`
- ⚠️ The Cabinet is advisory, because the Growth trial has no custom roles to stop the agent's `editor` token

Scope: one Sanity project on the Growth trial, `@sanity/workflow-*` 0.33.0, one participant (the agent) with three runs per task per interface in the order Kiosk, stock Studio, GitHub. The agent's times include the model's time to decide each action, and the Kiosk ran first, so it carries the learning curve.

The strategy for using Sanity Workflows for an agent-and-person approval process was validated with an incremental step by step approach.

---

#### References

- [Sanity Challenge](https://dev.to/challenges/sanity-2026-09-16)
- [Sanity Workflows](https://www.sanity.io/docs/workflows)
- [Actors, tokens, and enforcement](https://www.sanity.io/docs/workflows/actors-and-enforcement)
- [Sanity App SDK](https://www.sanity.io/docs/app-sdk)
- [Live Content API](https://www.sanity.io/docs/content-lake/live-content-api)
- [Projects created without an account](https://www.sanity.io/docs/getting-started/projects-without-an-account)
