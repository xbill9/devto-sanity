<!-- Source: https://www.sanity.io/docs/workflows/introduction (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Workflows

What Workflows is, the core concepts behind it, and which surface to build on.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



Sanity Workflows turns a content process into data. You describe the process once, as a definition. The definition names the stages content moves through, the work that happens in each stage, and the rules for moving on. Every time the process runs, you get an instance: a Sanity document that tracks that one run. People, agents, and applications all follow the same definition, and they all write to the same record.

Workflows is organization-wide by design. One workflow can coordinate content across projects, datasets, Canvas, and Media Library through [global document references](https://www.sanity.io/docs/workflows/global-document-references).

With Workflows, you can:

- **Coordinate a launch across many markets.** Fan a shared launch out into per-market work. Content, assets, localization, and specialist review all move in parallel, and one release gate holds until every required decision is in.
- **Keep translations in step with their source.** Give each locale its own run and its own owner. When the source changes, only the affected versions come back for review. You don't re-check every market.
- **Push one change through every place it lands.** A revised product claim, certification, or price connects to the pages, feeds, and locales that carry it. Each one routes to the specialist who has to approve it.
- **Mix automation with human judgment.** Let expected results move forward on their own, and send the uncertain or risky ones to a person. The record shows what automation produced and what the person changed.
- **See what is blocked and why.** Each instance stores its current stage, its open work, and the history of how it got there. Status is a GROQ query, not a thread of messages.

#### Start building

[Deploy your first workflow](https://www.sanity.io/docs/workflows/getting-started)
Define a three-stage workflow, deploy it, and move an article from drafting to published.

[Start from a complete example](https://www.sanity.io/docs/workflows/cookbook)
Adapt runnable definitions for editorial review, coordinated release, asset intake, and AI pipelines.

## Requirements

Workflows ships as a set of npm packages. Install the ones you need, and keep every `@sanity/workflow-*` package in one application on the same version.

The packages declare each other as peer dependencies pinned to an exact version, and pnpm and Yarn do not install peers for you, so a mismatch surfaces as an unmet peer warning — or as a surface that loads but never finds a workflow. The rule holds across surfaces as well as within one application: a Studio and a server runtime reading the same tag should be on the same version.

- Node.js 20 or later for the engine, the App SDK adapter, and the MCP server. The CLI requires Node.js 20.12 or later.
- A Sanity project, plus a resource where the engine stores definitions and instances. A dedicated dataset is a common choice.
- For the Studio plugin: Sanity Studio v6.3.0 or later, React 19 (v19.2.7 or later), and styled-components v6.4.2 or later.
- For the App SDK adapter: `@sanity/sdk` and `@sanity/sdk-react` v2.12.0 or later, and React 19 (v19.2.7 or later).
- For the MCP server: an MCP client, and `@modelcontextprotocol/sdk` v1.29.0 or later.

Only the Studio plugin needs Sanity Studio. The engine, the CLI, the App SDK adapter, and the MCP server don't depend on it. They run anywhere that meets their Node.js or React requirements.

Workflows is in early access. Read [how early access works](https://www.sanity.io/docs/workflows/prerelease) for the versioning, breaking-change, and stored-data policy before you rely on it.

## Core concepts

Workflows runs on a small vocabulary. Here is how the pieces fit together in one run.

You write a definition and deploy it. Starting that definition against a piece of content creates an instance, which lands in the first stage. A stage holds activities: the work to be done there. An action resolves an activity — a person approves, an agent finishes a job, a webhook reports back — and writes its result into the instance’s fields. A transition watches those fields through a condition, and moves the instance on as soon as the condition holds. The instance repeats that loop, stage by stage, until it reaches a stage with no way out.

Effects, guards, and subworkflows sit around that loop rather than in it. Each concept below links to the article that covers it in full.

### Definitions and instances

A [definition](https://www.sanity.io/docs/workflows/definitions-and-instances) is a codified description of a process: the stages, the work in each stage, and the rules for moving between them. An instance is one live run of it, pinned to the definition version it started on, so deploying a new version never disturbs a run already under way.

### Stages and transitions

A [stage](https://www.sanity.io/docs/workflows/definitions-and-instances) is a named place in the process, and an instance sits in exactly one at a time; a stage with no way out is terminal. A [transition](https://www.sanity.io/docs/workflows/definitions-and-instances) is a one-way link to the next stage that fires as soon as its condition holds — nothing chooses to move the instance.

### Activities and actions

An [activity](https://www.sanity.io/docs/workflows/activities-and-actions) is a unit of work belonging to one stage visit; it tracks its own state and gates but holds no data of its own. An action is what resolves an activity, and every state change it makes is an [operation](https://www.sanity.io/docs/workflows/operations) committed alongside it.

### Fields

[Fields](https://www.sanity.io/docs/workflows/fields) are the data an instance carries, each scoped to the workflow, a stage, or an activity so that same-named decisions in different stages cannot collide. Most workflows declare one `subject` field: the content the run is about.

### Conditions

A [condition](https://www.sanity.io/docs/workflows/conditions) is a GROQ expression that decides when a transition fires or a gate opens. It reads a snapshot the engine assembles in memory — fields, the acting actor, referenced documents, and the clock — not the Content Lake, so it can only see what the engine put there.

### Effects

An [effect](https://www.sanity.io/docs/workflows/effects-and-runtimes) is queued work that reaches outside the engine: send an email, start a build, call an external API. The engine records the request and commits; a runtime you operate then claims it, runs it, and reports back — nothing drains automatically.

### Guards

A [guard](https://www.sanity.io/docs/workflows/guards) is a rule the engine deploys as its own document, next to the content it protects, declaring which mutations are allowed while an instance sits in a stage. It lasts exactly as long as the stage visit.

### Subworkflows

A [subworkflow](https://www.sanity.io/docs/workflows/subworkflows) is a child workflow a parent spawns, usually one per row of a query. The children are ordinary instances with their own stages and fields, and the parent reads their progress as `$subworkflows`.

### The reactive session

The [reactive session](https://www.sanity.io/docs/workflows/reactive-session) is the live, subscribed view a UI renders from: you hand it the documents you are already watching. It works out what the current actor can do, which transitions are ready, and whether the instance is stuck, and commits when someone fires an action.

### Tags

Every workflow read and write is scoped to a [tag](https://www.sanity.io/docs/workflows/deploy-definitions), and each surface sets its tag once. A definition deployed under `staging` is invisible to a Studio configured with `tag: 'production'` — the first thing to check when a surface finds no workflows.

### Subjects and discovery

Surfaces use that [subject](https://www.sanity.io/docs/workflows/fields) field to work out which workflows apply to a given document. It declares the document types the definition accepts, so binding workflows to content usually needs no per-document configuration.

## The engine is a library, not a service

The [workflow engine](https://www.sanity.io/docs/workflows/engine) is a TypeScript library. Nothing runs in the background watching your content and pushing runs along, and there is no hosted service behind it. The engine acts only when your code calls it, so you supply the runtime.

Nothing moves on a timer by itself. A transition that should fire once a deadline passes needs something to call `tick` after the clock crosses it, whether that is a scheduled [Sanity Function](https://www.sanity.io/docs/workflows/sanity-functions), a cron job, or a queue worker. When one transition leads straight into another, that chain is a cascade. It runs inside the call you made, not in a loop somewhere off-stage.

Three verbs cover the calls you make. `fireAction` says that someone or something acted. `tick` says that something changed that the engine cannot see for itself: an edit to the subject, a deadline that has passed, a child that has finished. It re-evaluates the instance and advances it as far as it can. `evaluate` is a read-only call. It reports what an actor can do right now, and why they cannot do the rest. That is what a UI renders. None of the three runs unless something calls it.

## Engine checks are advisory

The engine checks a lot before it commits: action verdicts, permission gates, readiness, whether a document is editable. Every one of those checks exists so a consumer can disable the right controls, explain why, and fail before a commit that would not have worked. None of them is a security boundary. Anyone holding a write token can talk to the Content Lake directly and skip the engine entirely.

The Content Lake is the only enforcement point. When a rule has to actually hold, it belongs there: as dataset access control today, and as a [guard](https://www.sanity.io/docs/workflows/guards) once the lake evaluates guard documents.

## Choose your surface

Workflows ships one engine and several ways to reach it. Each of those is a surface. Pick the one that matches what you are building. They all operate on the same definitions and instances, and one project can use several at once.

| Surface | Package | Reach for it when |
| --- | --- | --- |
| Engine | `@sanity/workflow-engine` | You are authoring definitions or driving instances from your own code. Everything else sits on top of this. |
| CLI | `@sanity/workflow-cli` | You are deploying definitions, inspecting instances, or recovering a stuck run from a terminal or CI. |
| Studio plugin | `@sanity/workflow-studio-plugin` | Your editors work in Sanity Studio and need the workflow strip, the Workflows tool, and publish holds. |
| App SDK adapter | `@sanity/workflow-sdk` | You are building your own interface outside Studio and want live workflow state. |
| React components | `@sanity/workflow-react`, `@sanity/workflow-components`, `@sanity/workflow-diagram` | You want live workflow state as hooks, plus prebuilt stage, activity, and diagram components, inside a React app you control. |
| MCP server | `@sanity/workflow-mcp` | You are wiring an agent to operate or author workflows. |
| Sanity Functions | No Workflows package | You need deadlines to fire and queued effects to drain when nobody is watching. |
| Blueprint | `@sanity/workflow-blueprint` | Your definitions deploy as part of a Sanity Blueprint, next to the rest of your infrastructure. |
| Test harness | `@sanity/workflow-engine-test` | You are testing a definition and want to drive it without a Studio or a live dataset. |

Only the Studio plugin needs Sanity Studio. Every other surface installs and runs on its own.

Each surface has its own setup guide: the [CLI](https://www.sanity.io/docs/workflows/deploy-definitions), the [Studio plugin](https://www.sanity.io/docs/workflows/studio-plugin), the [App SDK adapter](https://www.sanity.io/docs/workflows/app-sdk), the [MCP server](https://www.sanity.io/docs/workflows/mcp), and [Sanity Functions](https://www.sanity.io/docs/workflows/sanity-functions).

Every surface reaches the same engine. The reactive session in `@sanity/workflow-react` sits directly on the engine. The App SDK adapter and the Studio adapter each give that session a way to watch documents, and the Studio plugin builds its interface on top of the Studio adapter. The CLI and the MCP server call the engine directly, with no React layer in between.

<div style="display:none">Unknown block type "mermaidDiagram", specify a component for it in the `components.types` option</div>Whichever surface you pick, the [reference](https://www.sanity.io/docs/workflows/reference) spells out every construct exactly: each field, type, default, option, and engine verb.

## Limitations

The engine ships a small set of hard caps that stop a runaway definition, plus a few defaults you can tune on `createEngine`. The caps limit how far a cascade runs and how deep subworkflows nest. The defaults cover the effect claim lease and the idempotency window. These numbers can change before 1.0, and any change ships in the package changelog like any other.

Two behaviors shape a design more than the numbers do. Queued effects have no automatic drainer. They wait until a runtime you operate calls `drainEffects`. And a deployed definition never changes, so correcting a live process means deploying a new version. Instances already running stay pinned to the version they started on.

Effect handlers registered in a browser only run while someone has that interface open. Unattended or consequential work belongs in a server runtime.

[Limits](https://www.sanity.io/docs/workflows/limits) has the exact caps, defaults, and the option names that change them.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



