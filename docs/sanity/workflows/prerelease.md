<!-- Source: https://www.sanity.io/docs/workflows/prerelease (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# How early access works

What building on Workflows during early access commits you to: one fixed 0.x stack, a stricter contract for stored documents, what the Content Lake does not yet enforce, and the runtime you supply.

Workflows is in early access. The packages are pre-1.0, the documents the engine stores in the Content Lake are governed more strictly than the package APIs, and you supply the runtime that makes anything move. Read the [release notes](https://www.sanity.io/docs/workflows/release-notes) before every upgrade.

## Versions and breaking changes

The published Workflows packages release as one set: the engine, the CLI, the reactive core and its adapters, the shared components, the diagram, the Studio plugin, the Blueprint provider, the MCP server, and the engine test bench all ship at the same version. Their internal dependencies are exact-version peers, so install the packages your application uses explicitly, and keep every version the same. Every package stays on `0.x`, where a breaking change bumps the minor version: moving from `0.30.0` to `0.31.0` can break your build. The release notes and the package changelogs name every breaking change and the migration it needs.

## The stored-data contract is stricter than the package API

The `0.x` version number covers package APIs. Stored workflow documents have a separate compatibility contract: new engines must keep reading existing documents, and writers cannot silently make old data incompatible.

The engine owns three document types: `sanity.workflow.definition`, `sanity.workflow.instance`, and a guard document deployed beside the content it protects. Definitions and instances each carry two numbers. `modelVersion` records the data model the writing engine conformed to. `minReaderModel` records the oldest engine that can safely read that particular document.

An engine reads every model version at or below its own, so upgrading a reader never orphans a document you already hold. Reading forward fails loudly rather than quietly. An engine that meets a document whose `minReaderModel` is higher than the model it understands throws `ModelVersionAheadError` and tells you to upgrade `@sanity/workflow-engine`, rather than misinterpreting a shape it predates.

### Reader-model rollout

A deployment declares the reader model you have verified across every runtime sharing its workflow resource. Write it as a numeric literal in `expectedMinReaderModel`. Model 4 is the baseline; required content references and effect retries need model 10. The examples here assume every shared runtime has been upgraded to support model 10.

The `fire-action`, `abort`, `set-stage`, and `reset-activity` commands resolve an existing instance by id and submit no definitions, so they do not recheck a deployment’s acknowledgement.

Keep the value a literal. Do not import `DATA_MODEL_MIN_READER` or `DATA_MODEL_MAX_READER` and pass that instead. A dependency upgrade would then advance your acknowledgement on its own, and remove the review point.

**sanity.workflow.ts**

```typescript
import type {WorkflowDeploymentInput} from '@sanity/workflow-engine'
import {defineWorkflowConfig} from '@sanity/workflow-engine/define'
import {myWorkflow} from './workflow'

// Replace PROJECT_ID with your Sanity project id.
const production = {
  name: 'production',
  tag: 'prod',
  expectedMinReaderModel: 10,
  workflowResource: {type: 'dataset', id: 'PROJECT_ID.workflows'},
  definitions: [myWorkflow],
} satisfies WorkflowDeploymentInput

export default defineWorkflowConfig({deployments: [production]})
```

For a direct engine deployment, acknowledge the same reader model:

**deploy.ts**

```typescript
import {engine} from './engine'
import {myWorkflow} from './workflow'

await engine.deployDefinitions({
  expectedMinReaderModel: 10,
  definitions: [myWorkflow],
})
```

Upgrade every studio, CLI, MCP server, Sanity Function, server, and application sharing the workflow resource before relying on a higher reader model. Verify the rollout, then raise the deployment literal and deploy the definitions. Existing instances can acquire a higher reader floor on an engine commit, even without redeployment. Follow [Upgrade Workflows packages](https://www.sanity.io/docs/workflows/upgrade) for the feature-specific sequence.

Model 5 added the `dueDate` and `dueDatetime` field kinds without raising the reader floor. Upgrade every reader before you deploy a definition that uses either kind: an older engine refuses the unfamiliar field kind rather than silently treating it as `date` or `datetime`.

Model 4 changed how readiness is stored, and the namespace of principal IDs in live state. Existing values resolve through the project directory and get rewritten on the instance’s next engine commit, so there is no bulk migration to run. History rows stay exactly as written.

#### Adopt role-constrained assignments

A non-empty `roles` list on an `assignees` field requires reader model 8, unless another feature requires more. A newly deployed definition with a singular `assignee` requires model 9, with or without `roles`. See [Assignment eligibility](https://www.sanity.io/docs/workflows/fields).

1. The `roles` field option also requires a dataset workflow resource and access to its project member directory. It is rejected on Canvas, Media Library, and Dashboard workflow resources.
2. After upgrading all shared runtimes, acknowledge at least model 8 for role-constrained plural assignments, or model 9 for singular assignments. Use a higher value when another feature requires it. An MCP deployment supplies the same value through `expectedMinReaderModel`.
3. Add the non-empty `roles` list and redeploy. Existing instances stay pinned to the definition version they started under.

Without the model-8 acknowledgement, the deploy is rejected before anything is written. A reader older than model 8 refuses a document that carries the option, rather than accepting an assignee the declaration excludes.

## What is not enforced yet

Every check the engine makes is advisory. Action verdicts, permission gates, readiness pre-flights, and editability checks exist so a UI can disable the right controls and explain why. Anyone with a write token can talk to the Content Lake directly and skip the engine, so the Content Lake is the only enforcement point. Treat an engine-side check as UX, never as a security boundary.

A guard is meant to be the mechanism for a rule that must actually hold: a lock deployed beside the content it protects. During early access the Content Lake does not enforce deployed guard documents yet. So a guard currently previews an allow or deny verdict for engine-aware surfaces, and explains a denied engine commit. Until the lake enforces guards, a rule you cannot afford to have bypassed belongs in dataset access control. See [Guards and enforcement](https://www.sanity.io/docs/workflows/guards) for the current boundary and deployment behavior.

The engine also does not yet separate the identity a call is made as from the identity its own writes run under. Both ride the caller’s token. So dataset access control, or a lake-enforced guard, evaluated against an editor’s token can block the engine’s own housekeeping, and leave that editor in a stage they can no longer advance, retract, or reconcile.

## You run the runtime

Workflows is a library, not a service. Nothing runs in the background and nothing moves on a timer by itself: the engine acts only inside a call your code makes. A transition that should fire when a deadline passes needs something to call `tick` after the clock crosses it.

The engine queues an effect rather than running it, and a drainer you operate completes it: a Sanity Function, a server, or the CLI during development. A drainer supplies its effect handlers when it constructs its engine, then calls `engine.drainEffects()` to dispatch the queued work. Nothing drains on its own. [Run Workflows with Sanity Functions](https://www.sanity.io/docs/workflows/sanity-functions) shows how to drain new work with a Document Function and tick existing instances with a Scheduled Function, using a robot token for both.

## Where workflow data lives

Each deployment chooses where its engine-owned state lives, in its `workflowResource`.

- **Definitions and instances**: stored as Sanity documents in the deployment’s `workflowResource`. A dedicated dataset is common, but the configured resource is the authority.
- **Deployment partitions**: every definition and instance carries the deployment tag. Different tags can share one workflow resource without sharing workflow state.
- **Content stays where it is**: a workflow can coordinate documents across datasets, projects, and resource types such as Canvas and Media Library. Those documents never move; workflow fields hold [global document references](https://www.sanity.io/docs/workflows/global-document-references) to them. The deployment’s credentials and resource routing must reach every referenced resource.

See [workflowResource decides where engine documents live](https://www.sanity.io/docs/workflows/deployments-and-resources) for the deployment configuration.

### Future storage

No managed storage destination other than `workflowResource` is part of the contract today. Treat `workflowResource` as the early-access storage contract. If that changes, the release notes will carry the destination and the migration steps.

## Surfaces still in development

The Studio plugin requires Sanity Studio 6.3 or later. Use `autoStart` for fresh documents, and read the release notes before upgrading.

Blueprints can deploy the Functions that operate workflows, but the Blueprints service does not yet register the `sanity.workflow` resource. Deploy definitions with `npx sanity-workflows deploy` before deploying their Functions.

### Generated runtimes are experimental

The `blueprint generate` command creates Sanity Functions from your workflow definitions. It is experimental and not ready for production use. Use `blueprint generate --check` to check generated files; the definition deploy command does not check them.

Generation does not verify that an effect’s retry policy fits its Function timeout. Generated start watchers can run on unrelated edits, and the heartbeat reevaluates every active instance under its deployment tag. Declaring `runtime.kind: 'durableFunction'` does not create a durable workflow runtime. See [Run Workflows with Sanity Functions](https://www.sanity.io/docs/workflows/sanity-functions) for setup and current limitations.

> [!NOTE]
> Share your definitions!
> During early access, we strongly encourage you to leave definition sharing enabled when deploying. Your definitions show us the domains and problems Workflows must support, helping us improve the product.
> Sharing is optional. See [Definition sharing](https://www.sanity.io/docs/workflows/deploy-definitions) for the opt-out control.



## Resetting data during development

`sanity-workflows nuke --deployment <DEPLOYMENT_NAME>` deletes that deployment’s definitions, instances, and guards across every alias-bound resource. Content documents are never touched. It prints a plan and asks you to type every target to confirm. `--force` skips the prompt. Use it only when you intend to discard that workflow state. Model-9 and model-10 upgrades require no reset. To delete one instance, use `sanity-workflows nuke --instance <INSTANCE_ID>`; abort an active instance first because deletion requires a terminal instance.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



