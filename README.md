# Brawndo: It's Got What Content Craves

A Path Two entry for the [DEV Sanity Challenge](https://dev.to/challenges/sanity-2026-09-16) (deadline
**2026-10-04, 11:59 PM PDT**). The Department of Agriculture is run by people who can't use git: an agent
proposes watering the crops, a human Cabinet approves (advisorily), citizens vote live, and a stopwatch
measures whether "idiots can use a data store". Design: [docs/DESIGN.md](docs/DESIGN.md).

| Dir | What | Stack |
|---|---|---|
| `studio/` | The Kiosk (picture-button inputs) + a stock workspace, same schema; Workflows plugin in the Kiosk | Sanity Studio 6 |
| `workflows/` | `joes-plan` definition, in-memory tests, local tick/drain runtime + effect handlers | `@sanity/workflow-*` 0.33.0 (pinned exact) |
| `web/` | brawndo.gov — public live scoreboard and voting | Next.js 16 + `next-sanity` live |
| `cabinet/` | The Cabinet Room — live docket + crop map in the Sanity Dashboard | App SDK |
| `agent/` | The Secretary of the Interior | Claude (`claude-opus-5`) + `@sanity/workflow-mcp` |
| `trials/` | Stopwatch protocol, `verify.py`, `analyze.py` | Python 3, stdlib only |

## Verify without a Sanity account

```
source ./env.sh      # Node 24 LTS via nvm (trixie ships 20; Studio 6 needs >= 22.12); derives per-app env vars
make install
make check           # typecheck ×5, workflow tests, offline workflow validation, builds, analyzer fixture
```

## Go live (needs your Sanity login)

Run from `studio/` unless noted, after `source ./env.sh`.

1. **Log in:** `npx sanity@latest login`
2. **Project + public dataset:** `npx sanity projects create "Brawndo" --dataset production --dataset-visibility public`
   → put the id in `.env` as `SANITY_PROJECT_ID`, then `source ./env.sh` again.
3. **Go/no-go (docs/DESIGN.md §7 step 5):**
   - `cd workflows && npm run check` then `npm run deploy`. If Workflows early access isn't enabled, stop here and
     take the §8 fallback.
   - Custom roles: in sanity.io/manage → project → Access, create roles `cabinet` and `secretary`, with
     `secretary` **denied writes to `field`**. If the plan can't, use the `BRAWNDO_ROLE_*` fallback in `.env.example`.
4. **Seed:** `node seed/seed.mjs && npx sanity datasets import seed/seed.ndjson --dataset production --replace`
5. **Tokens** (`npx sanity tokens add "<label>" --role <role>`): vote (editor, or a custom role limited to
   `vote`/`citizen`), agent (`secretary`), drainer (editor). The MCP token is org-level: Manage → org → API.
6. **Studio:** `npx sanity deploy` → the Kiosk is at `/kiosk`, the control at `/stock`.
7. **Runtime:** `cd workflows && npm run runtime:watch` (ticks + drains every 15s).
8. **Scoreboard:** `cd web && npm run dev` locally; for Cloud Run build the `Dockerfile` with
   `--build-arg NEXT_PUBLIC_SANITY_PROJECT_ID=...`, inject `SANITY_VOTE_TOKEN` from Secret Manager, then
   `npx sanity cors add https://<run-url>` (live updates fail silently without it).
9. **Cabinet Room:** `cd cabinet && npm run deploy -- --create --title "Cabinet Room" --yes --json`
   (needs `SANITY_ORGANIZATION_ID`; save the returned app id as `deployment.appId` in `sanity.cli.ts`).
10. **Agent:** `cd agent && npm start` — drafts a proposal, starts Joe's Plan and submits it to the Cabinet.
11. **Trials:** follow [trials/PROTOCOL.md](trials/PROTOCOL.md).

## Live status (2026-09-18)

- Sanity project `ukyhb6bu` (org `oxystvdvu`, GitHub login `xbill9`) was created without an account via `sanity new`,
  then claimed the same day. It's on the Growth trial (30 days).
- **Joe's Plan works end to end live:** agent submits → Cabinet approves in the Kiosk → drainer waters (fields
  sprout) → harvest. Reproduce with `cd workflows && npm run e2e:start`, approve in the Kiosk at
  `localhost:3333/kiosk/workflows`, then `npm run e2e:finish <instanceId>`.
- **No custom roles on this plan.** The deploy uses the fallback (`BRAWNDO_ROLE_CABINET=administrator`,
  `BRAWNDO_ROLE_SECRETARY=editor`). Robot tokens can't hold `administrator`, so the Cabinet can only be a person.
  But the agent's `editor` token could write fields directly, so **the Cabinet is advisory**. That's the article's punchline.
- Tokens: separate `editor` robot tokens for vote, agent and drainer (in `.env`). Still to do, in the Manage UI: an org-level
  token for `@sanity/workflow-mcp` (the agent's MCP path).
- **brawndo.gov is live** at https://brawndo-gov-289270257791.us-central1.run.app (Cloud Run, `aisprint-491218`,
  us-central1, max 2 instances; the vote token comes from Secret Manager `brawndo-vote-token`). The hosted Studio is at
  `brawndo-agriculture.sanity.studio`.
- brawndo.gov voting also works on `localhost:3000`. The dataset holds test votes and an abandoned plan
  (`dev.wf-instance.077cc8e641d4`, stuck in `growing` from before the harvestAt fix).

## Known gaps (as of 2026-09-18)

- Nothing has run against a live project yet. Every check above is offline: typecheck, in-memory workflow
  bench, CLI `--check`, builds. First contact with Sanity is step 3.
- `web/` `next build` prerenders against the dataset, so it only passes once step 4 is done.
- Lesson from the live run: an effect handler's `outputs` only go into `$effects['<name>']`. Writing a workflow field
  needs returned `ops` with an explicit `target.scope`. The bench test passed only because it used `ops` directly.
- Pictures are emoji placeholders until the nb2lite parody art lands in `studio/static/`.
- Instance history in a public dataset exposes actors' opaque Sanity user ids. Accepted for the demo; the
  alternative is a dedicated private workflows dataset (`workflowDataset` option on the Studio plugin).
