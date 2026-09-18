---
title: "It's Got What Content Craves: Sanity, Built for the People of Idiocracy"
published: false
description: "An agent proposes watering the crops, a human Cabinet approves (advisorily), and Sanity Workflows moves the plan. Plus what the Brawndo actually bought."
tags: devchallenge, sanitychallenge, sanity, ai
cover_image: https://raw.githubusercontent.com/xbill9/devto-sanity/main/articles/brawndo/devto-cover.d67a2736.jpg
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

## What I Built

In *Idiocracy*, the crops are dying because every field is irrigated with Brawndo. It's got electrolytes. Joe's plan is to water them. With water. Like from the toilet.

This is the Department of Agriculture, run on Sanity. An **agent**, the Secretary of the Interior, drafts a proposal to water the fields. A **human Cabinet** has to approve it. Citizens vote on a public scoreboard. If the Cabinet approves, a Sanity Workflow waters the fields, they sprout, and a few minutes later they are harvested. If it rejects, they stay a dust bowl.

The thesis is the joke, and the joke is the only honest pitch for a CMS. **Sanity's real product is not a database. It is a data store that people who cannot use git can use.** So every surface here is built for them: the editing Studio is a kiosk of giant picture buttons, like the hospital in the film.

Four surfaces, one dataset:

| Surface | Built with | Who uses it |
|---|---|---|
| **The Kiosk** | Sanity Studio with custom picture-button inputs + the Workflows plugin | the Cabinet |
| **Joe's Plan** | Sanity Workflows (early access) | the agent, the Cabinet, the runtime |
| **brawndo.gov** | Next.js 16 + `next-sanity` live content | citizens |
| **The Cabinet Room** | App SDK dashboard app | the Cabinet |

## Demo

**brawndo.gov:** https://brawndo-gov-289270257791.us-central1.run.app. Vote on a field. Your vote replaces itself if you vote again.

PENDING: video walkthrough.

The Kiosk is hosted at `brawndo-agriculture.sanity.studio` and signs in through the Sanity Dashboard.

## Code

https://github.com/xbill9/devto-sanity

`make check` runs the offline suite; the README has the go-live runbook.

## My Build Process

The whole thing was built in one session in Claude Code, from an empty directory to a harvested field. The session is embedded below. These are the parts worth reading.

### What does Sanity actually buy?

That was my first question, and the honest answer shaped everything. A schema'd JSON store with a query language is not new; Postgres and SQLite do that. Three things in Sanity's docs are hard to get elsewhere:

1. **Knowledge Bases refuse to guess.** Conflicting sources surface side by side, and your ruling persists across rebuilds.
2. **Workflows make the process a document.** People, agents and apps move the same instance through the same transitions.
3. **Live, multi-user documents** in your own interface, through the App SDK.

A Path Two app built around the second one felt like the right Brawndo.

### The Kiosk: same schema, two interfaces

The schema is defined once and built twice: `buildSchema({kiosk: true})` swaps in a picture-button input for every enumerated field, and `buildSchema({kiosk: false})` leaves Sanity's defaults. Two Studio workspaces, one dataset. That gives the build a control: the stock Studio is the same data with no Brawndo.

A proposal deliberately has **no status field**. Its stage lives only in its workflow instance, which is itself a Sanity document, so there is exactly one source of truth.

### Joe's Plan

```
petition ──submit──▶ cabinet ──approve──▶ watering ──▶ growing ──(harvestAt)──▶ harvest
                        └──reject──▶ dust-bowl
```

The definition was proven in Sanity's in-memory bench before anything was deployed:

```
 ✓ definitions/joes-plan.test.ts (8 tests)
      Tests  8 passed (8)
```

Eight passing tests prove little on their own, so the build broke the definition on purpose twice (a harvest that fires immediately, a Secretary allowed to approve) and confirmed a test failed each time.

### The Cabinet is advisory

This is the finding I didn't plan for, and it is the best Idiocracy beat in the build.

Sanity's own Workflows docs say every check the engine makes is advisory: role gates, guards and action filters are UX, and only dataset access control is enforced by the Content Lake. The plan was to back the Cabinet with a custom role the agent's token could not satisfy. Then the deploy said:

```
Error: workflow.deployDefinitions: unknown project roles for project "ukyhb6bu":
  - joes-plan: generated role condition references unknown role "secretary"
  - joes-plan: generated role condition references unknown role "cabinet"
```

The Growth trial has no custom roles. The project's roles are the eight built-in ones. So the definition takes its role names from the environment and falls back to `administrator` for the Cabinet and `editor` for the Secretary. Then one more measurement:

```
sanity tokens add brawndo-e2e-cabinet --role administrator ...
Error: Invalid role "administrator". Available roles: editor, developer,
contributor, access-manager, blueprints-deployer, deploy-studio, viewer
```

A robot token cannot be an administrator. **The Cabinet can only be a person.** And the Secretary's `editor` token could write the fields directly if it wanted to. So the Cabinet has a real seat, a real button, and no actual power. That's the movie.

### The bug a green test suite hid

The first live run stalled in `growing` with `harvestAt: null`:

```
[effect.water-fields] watered 2 field(s); harvest at 2026-09-18T16:45:02.622Z
16:45:02  drainer watered { stage: 'growing', harvestAt: null }
16:45:12  final stage growing
```

The watering handler returned `{outputs: {harvestAt}}`. In Workflows, an effect's `outputs` land only in `$effects['water-fields']`; writing a workflow field takes returned `ops` with an explicit `target.scope`. The bench test had passed because it completed the effect with `ops` directly. It tested the definition, not the handler. The fix is three lines, and the second live run reached harvest:

```
16:46:07  agent submitted cabinet
16:46:08  agent approve rejected (engine verdict, advisory) ActionDisabledError
16:46:59  drainer watered { stage: 'growing', harvestAt: '2026-09-18T16:47:00.255Z' }
16:47:16  final stage harvest
16:47:16  fields after harvest [ { growth: 'crop', irrigation: 'water', number: 7 },
                                 { growth: 'crop', irrigation: 'water', number: 9 } ]
```

The approval between those lines was a person clicking **Approve (water)** in the Kiosk.

### Arithmetic belongs in the engine

Every tally on brawndo.gov is a GROQ `count()` computed by the Content Lake. Nothing is summed in React, and the agent never counts rows; its `field_report` tool returns the engine's numbers and the filter it ran. One vote per citizen per field is enforced by construction: a vote's `_id` is derived from both, so voting again replaces rather than adds. Three votes in, two votes out, confirmed by an anonymous public read:

```
vote field-07 -> HTTP 200
vote field-07 -> HTTP 200
vote field-03 -> HTTP 200
anonymous public read: {'anonCitizens': 1, 'f7water': 1, 'votes': 2}
```

The ids use hyphens, not dots, because a dotted `_id` is not publicly readable and those votes would vanish from the public count.

### Starting with no account at all

The project was created with `npx sanity new`, which provisions a real project with no account and a 72-hour claim link. It is a good fit for an agent, with one wall: the unclaimed project's single token cannot deploy a workflow.

```
✖ Deploy failed — Unauthorized - User is missing required grant
  sanity.project.roles/read to perform this operation
```

Claiming took one GitHub sign-in, and everything built so far came along.

### The stopwatch: can idiots use a data store?

PENDING: the measured trials. The protocol is in the repository (`trials/PROTOCOL.md`): three surfaces (Kiosk, stock Studio, markdown on GitHub), three tasks, three runs per cell, correctness checked by script, every number computed by `analyze.py` from the raw CSV.

## Sanity Project Details

- Project ID: `ukyhb6bu`, dataset `production` (public read)
- Workflow: `joes-plan` v1, tag `dev`
- Schema types: `field`, `citizen`, `proposal`, `vote`

## Agent Session

PENDING: curated Claude Code session, made public, with secrets checked.

## Summary

The goal of this build was to test the one honest pitch for a CMS: people who can't use git can use a data store. The key to the build was Sanity Workflows, where an agent and a person move the same document through the same transitions.

- Joe's Plan runs end to end on a live project: agent submits, a person approves in the Kiosk, the runtime waters and harvests.
- The Cabinet can only be a person, because a robot token cannot hold `administrator`, and its approval is advisory, because the trial plan has no custom roles to stop the agent's `editor` token.
- A green in-memory test suite hid a live bug: effect `outputs` do not write workflow fields; returned `ops` do.

Scope: one Sanity project on the Growth trial, `@sanity/workflow-*` 0.33.0 (early access), one live end-to-end run after the fix. The stopwatch trials are the part still to be measured.
