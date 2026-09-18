<!-- Source: https://www.sanity.io/docs/workflows/sanity-functions (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Run Workflows with Sanity Functions

Use GROQ-triggered and scheduled Sanity Functions to start workflows, reevaluate conditions, and process queued effects.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



Use [Sanity Functions](https://www.sanity.io/docs/functions/functions-introduction) to call the [Workflows engine](https://www.sanity.io/docs/workflows/engine) without maintaining a server.

A [Document Function](https://www.sanity.io/docs/functions/function-quickstart) responds to [GROQ](https://www.sanity.io/docs/content-lake/groq-introduction)-filtered document changes. A [Scheduled Function](https://www.sanity.io/docs/functions/scheduled-function-quickstart) reevaluates workflows as time passes. An [effect](https://www.sanity.io/docs/workflows/effects-and-runtimes) is external work queued by a workflow. A Function with the required handlers runs it.

This guide shows how to configure the Functions yourself. The optional [experimental generator](https://www.sanity.io/docs/workflows/sanity-functions) is not ready for production use.

## Choose a Function for each use case

Start with the event that should run your code: a content change or a schedule. Inside the Function, call the engine operation that produces the required workflow outcome. The sections below cover common pairings. The [Engine reference](https://www.sanity.io/docs/workflows/reference) lists every operation.

### Start a workflow when content becomes eligible

Use a [Document Function](https://www.sanity.io/docs/functions/function-quickstart) whose GROQ filter matches the change that makes a document eligible. Call `startInstance()` to create an [instance](https://www.sanity.io/docs/workflows/definitions-and-instances), the stored run of that workflow. Filter on the qualifying change instead of every edit. Only `startInstance()` creates an instance. If the Function misses that document change, a later `tick()` call cannot create it.

### Reevaluate after relevant content changes

Use a [Document Function](https://www.sanity.io/docs/functions/function-quickstart) when an existing instance must respond promptly after a field used by a workflow [condition](https://www.sanity.io/docs/workflows/conditions) changes. Filter on that field delta, find the affected instances, and call `tick()` once per instance. If an immediate response is unnecessary, omit this Function. The Scheduled Function described below can call `tick()` periodically instead.

### Reevaluate when time passes

Time passing does not create a document event. To reevaluate conditions that depend on time, run a [Scheduled Function](https://www.sanity.io/docs/functions/scheduled-function-quickstart) on a cron schedule. On each invocation, query in-flight [instances](https://www.sanity.io/docs/workflows/definitions-and-instances) and call `tick()` once for each one. The cron interval is the maximum delay before a time-based [condition](https://www.sanity.io/docs/workflows/conditions) or [transition](https://www.sanity.io/docs/workflows/definitions-and-instances) is reevaluated.

### Handle an explicit workflow event

An [action](https://www.sanity.io/docs/workflows/activities-and-actions) is a named event accepted by a workflow, such as approval or rejection. When a document change or schedule should send that event, run the matching Function and call [fireAction()](https://www.sanity.io/docs/workflows/activities-and-actions). Use `fireAction()` only for actions that do not declare a `when` condition. An action with `when` fires automatically the next time another engine operation reevaluates the instance and finds the condition true.

### Run queued work outside the engine

An [effect](https://www.sanity.io/docs/workflows/effects-and-runtimes) is external work queued by a workflow. The engine records the work; a registered effect handler performs it. To run new work promptly, use a [Document Function](https://www.sanity.io/docs/functions/function-quickstart) triggered when the number of unclaimed effects increases. Inside that Function, call `drainEffects()`. This guide calls a Function that invokes `drainEffects()` an effect drainer. If a Scheduled Function already calls `tick()` for the same instances and registers the required handlers, it can call `drainEffects()` in the same invocation instead. That design accepts the schedule interval as the delay before queued work runs. There is no combined tick-and-drain operation.

Register together only the handlers that can share credentials, dependencies, timeout budget, scaling, and ownership. `drainEffects()` selects a handler by the effect name and continues until no registered work can be claimed. Use separate drainers when one of those runtime boundaries differs.

The rest of this guide implements two independent triggers. A Document Function drains effects as soon as work is queued. A Scheduled Function periodically ticks in-flight instances.

## Keep document triggers narrow

Engine operations mutate [workflow instance](https://www.sanity.io/docs/workflows/definitions-and-instances) documents when they claim work, record outcomes, append history, or move between stages. A Document Function can therefore react to mutations produced by its own previous call.

Filter for the smallest document delta that makes the engine operation useful. Broad filters spend invocations and reads on no-op calls. They can also keep waking the same Function as its previous invocation updates the instance.

For an effect drainer, run only when the number of unclaimed pending effects increases:

```groq
_type == "sanity.workflow.instance" &&
tag == "prod" &&
count(after().pendingEffects[!defined(claim)]) >
coalesce(count(before().pendingEffects[!defined(claim)]), 0)
```

The comparison between `after()` and `before()` detects newly available work. Claiming or completing an existing effect does not increase the count, so those mutations do not wake the Function again.

The `coalesce(..., 0)` fallback also handles a newly created instance that already contains pending work. A filter that only checks whether pending work exists is simpler, but unrelated instance mutations can then cause repeated invocations while the work remains.

## Deploy the Blueprint

The [Blueprint](https://www.sanity.io/docs/blueprints/blueprints-introduction) below binds the effect drainer to its GROQ event and the Scheduled Function to its cron schedule. Both Functions use the same robot token. Scheduled Functions are organization-scoped and do not receive a target project or dataset in event context, so the Blueprint passes those values as environment variables. Follow [Define a robot token with Blueprints](https://www.sanity.io/docs/blueprints/blueprints-robot-tokens) for the token resource and membership fields.

```typescript
// sanity.blueprint.ts
import {
  defineBlueprint,
  defineDocumentFunction,
  defineRobotToken,
  defineScheduledFunction,
} from '@sanity/blueprints'

const projectId = process.env.SANITY_PROJECT_ID ?? ''
const dataset = process.env.SANITY_DATASET ?? 'workflows'
const robotToken = '$.resources.wf-prod-runtime.token'

export default defineBlueprint({
  resources: [
    defineRobotToken({
      name: 'wf-prod-runtime',
      label: 'Workflows runtime',
      memberships: [
        {resourceType: 'project', resourceId: projectId, roleNames: ['editor']},
      ],
    }),
    defineDocumentFunction({
      name: 'wf-prod-drain-effects',
      src: './functions/wf-prod-drain-effects',
      project: projectId,
      robotToken,
      event: {
        on: ['create', 'update'],
        filter:
          '_type == "sanity.workflow.instance" && tag == "prod" && ' +
          'count(after().pendingEffects[!defined(claim)]) > ' +
          'coalesce(count(before().pendingEffects[!defined(claim)]), 0)',
        projection: '{_id}',
        resource: {type: 'dataset', id: `${projectId}.${dataset}`},
      },
    }),
    defineScheduledFunction({
      name: 'wf-prod-tick-instances',
      src: './functions/wf-prod-tick-instances',
      event: {expression: '* * * * *'},
      robotToken,
      env: {
        SANITY_PROJECT_ID: projectId,
        SANITY_DATASET: dataset,
      },
    }),
  ],
})
```

Keep the `tag` identical in the drainer trigger, engine configuration, and Scheduled Function query. Set the cron expression to the maximum delay your time-based workflow decisions can tolerate and that your plan supports.

## Drain effects when work is queued

The `effectHandlers` object maps each effect name to the code that performs it. When unclaimed work appears, the Function calls `drainEffects()` once for the instance in the event.

```typescript
// functions/wf-prod-drain-effects/index.ts
import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'
import {createEngine, ENGINE_API_VERSION} from '@sanity/workflow-engine'

import {effectHandlers} from '../../effect-handlers'

interface WorkflowEvent {
  _id: string
}

export const handler = documentEventHandler<WorkflowEvent>(
  async ({context, event}) => {
    const projectId = context.clientOptions.projectId
    const dataset = context.clientOptions.dataset
    if (!projectId || !dataset) {
      throw new Error('The Function event has no project or dataset')
    }

    const client = createClient({
      ...context.clientOptions,
      projectId,
      dataset,
      apiVersion: ENGINE_API_VERSION,
      perspective: 'raw',
      useCdn: false,
    })
    const engine = createEngine({
      client,
      workflowResource: {type: 'dataset', id: `${projectId}.${dataset}`},
      tag: 'prod',
      executionContext: {kind: 'drainer', id: 'wf-prod-drain-effects'},
      effects: {
        handlers: effectHandlers,
        // Leave other effects pending for the drainer that owns them.
        missingHandler: 'skip',
      },
    })

    await engine.drainEffects({instanceId: event.data._id})
  },
)
```

One `drainEffects()` call continues until no effect registered by this Function can be claimed. After each handler completes, the engine reevaluates automatic transitions. Effects queued during that reevaluation are available to the same drain.

Do not add an outer loop or call `tick()` after the drain. Those calls repeat reads and cascade evaluation without advancing the effect queue.

A drain may run several handlers, so budget for their combined duration. A handler may receive the same effect more than once. Use `ctx.effectKey` as the idempotency key for any external write. Use separate drainers before their combined work approaches the Function timeout.

## Tick workflows on a schedule

This Scheduled Function selects in-flight instances and completed instances that still have pending effects. It releases expired claims on both. It calls `tick()` only for in-flight instances, running automatic progression until each is stable.

`sweepStaleClaims()` releases ownership left by a handler that stopped before recording an outcome. Releasing a claim increases the unclaimed-work count and wakes the effect drainer. Completed instances need this recovery too: reaching a terminal stage does not discard queued effects.

**functions/wf-prod-tick-instances/index.ts**

```typescript
// functions/wf-prod-tick-instances/index.ts
import {createClient} from '@sanity/client'
import {scheduledEventHandler} from '@sanity/functions'
import {
  createEngine,
  ENGINE_API_VERSION,
  errorMessage,
  instancesQuery,
  sweepStaleClaims,
} from '@sanity/workflow-engine'

export const handler = scheduledEventHandler(async ({context}) => {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET
  if (!projectId || !dataset) {
    throw new Error('The Scheduled Function requires SANITY_PROJECT_ID and SANITY_DATASET')
  }

  const client = createClient({
    ...context.clientOptions,
    projectId,
    dataset,
    apiVersion: ENGINE_API_VERSION,
    perspective: 'raw',
    useCdn: false,
  })
  const executionContext = {kind: 'server', id: 'wf-prod-tick-instances'} as const
  const engine = createEngine({
    client,
    workflowResource: {type: 'dataset', id: `${projectId}.${dataset}`},
    tag: 'prod',
    executionContext,
  })

  const {query, params} = instancesQuery({
    tag: 'prod',
    filter: {includeCompleted: true},
  })
  const instances = await client.fetch<Array<{_id: string; completedAt: string | null}>>(
    `${query}[!defined(completedAt) || count(pendingEffects) > 0]{_id, completedAt}`,
    params,
  )

  let failed = 0
  for (const {_id, completedAt} of instances) {
    try {
      await sweepStaleClaims({
        client,
        tag: 'prod',
        instanceId: _id,
        executionContext,
      })
      if (completedAt === null) {
        await engine.tick({instanceId: _id})
      }
    } catch (error) {
      failed += 1
      console.error(`Scheduled recovery failed for ${_id}: ${errorMessage(error)}`)
    }
  }

  if (instances.length > 0 && failed === instances.length) {
    throw new Error('Scheduled recovery failed for every selected instance')
  }
})
```

`tick()` does not run effect handlers. If this Scheduled Function also owns the handlers, register them on its engine. Call `drainEffects()` for every selected instance after the sweep and optional tick, including completed instances. This runs queued effects in the same invocation, but checks for effects on every schedule.

Handle each instance independently so one failure does not stop recovery for the others. Fail the invocation when every selected instance fails so the problem remains visible in logs.

## Test and deploy

1. Use [Testing functions locally](https://www.sanity.io/docs/functions/functions-local-testing) to exercise both handlers with representative payloads and credentials. Invoke each effect handler more than once with the same `ctx.effectKey` and confirm that it does not repeat the external write.
2. Deploy to a non-production stack and verify that the document trigger detects new work with GROQ `before()` and `after()`. Local Function test commands cannot evaluate these delta functions. See [GROQ feature support across Sanity](https://www.sanity.io/docs/content-lake/groq-feature-support-by-context).
3. Confirm that new work invokes the drainer, claim and completion mutations do not create an invocation loop, and interrupted handlers' expired claims become available again. Include a completed instance with pending effects in the recovery test. A scheduled tick that changes no state must not write.

**npm**

```shell
npx sanity blueprints deploy
```

**pnpm**

```shell
pnpm dlx sanity blueprints deploy
```

**yarn**

```shell
yarn dlx sanity blueprints deploy
```

**bun**

```shell
bunx sanity blueprints deploy
```

Use the [Functions cheat sheet](https://www.sanity.io/docs/functions/functions-cheatsheet) for deployment and log commands.

## Try the generated runtime

> [!WARNING]
> Experimental generator
> Runtime generation in Workflows 0.33 is experimental and not ready for production use. Its commands and generated files may change. For functions you configure yourself, start with [Choose a Function for each use case](https://www.sanity.io/docs/workflows/sanity-functions).

The generator reads your workflow definitions and creates the Sanity Functions they need: functions that run effects, a scheduled heartbeat, and watchers for autonomous workflows. An autonomous workflow starts when a document matches its start conditions. The heartbeat releases expired effect claims and reevaluates in-flight workflow instances, the stored executions of definitions.

A purely interactive workflow can need no generated functions. To try generation, start with a [workflow deployment config](https://www.sanity.io/docs/workflows/deploy-definitions). Export each deployment object under its own `name`, such as `export const production = ...`, and include that object in the default config. Deployment names must also be valid JavaScript binding names; `production` works, while `prod-eu` does not.

Generated functions import this config when they start. Keep resource coordinates available without your local shell environment, and read secrets inside effect handlers. Install the Sanity Functions tooling and the Workflows packages used by the generator:

**npm**

```shell
npm install --save-dev @sanity/blueprints @sanity/functions \
  @sanity/workflow-cli@0.33.0 @sanity/workflow-engine@0.33.0 \
  @sanity/workflow-blueprint@0.33.0
```

**pnpm**

```shell
pnpm add --save-dev @sanity/blueprints @sanity/functions \
  @sanity/workflow-cli@0.33.0 @sanity/workflow-engine@0.33.0 \
  @sanity/workflow-blueprint@0.33.0
```

**yarn**

```shell
yarn add --dev @sanity/blueprints @sanity/functions \
  @sanity/workflow-cli@0.33.0 @sanity/workflow-engine@0.33.0 \
  @sanity/workflow-blueprint@0.33.0
```

**bun**

```shell
bun add --dev @sanity/blueprints @sanity/functions \
  @sanity/workflow-cli@0.33.0 @sanity/workflow-engine@0.33.0 \
  @sanity/workflow-blueprint@0.33.0
```

From the directory containing `sanity.workflow.ts`, generate the files:

**npm**

```shell
npx @sanity/workflow-cli blueprint generate
```

**pnpm**

```shell
pnpm dlx @sanity/workflow-cli blueprint generate
```

**yarn**

```shell
yarn dlx @sanity/workflow-cli blueprint generate
```

**bun**

```shell
bunx @sanity/workflow-cli blueprint generate
```

The command covers every deployment in the config. It writes `workflows.blueprint.ts` and the function modules, manifests, and handler registry the definitions need. It also adds the generated resources to `sanity.blueprint.ts`. Resolve any reported naming collision or manual wiring requirement before deployment.

Implement the scaffolded `effect-handlers/<effect-name>.ts` files. Regeneration preserves those handlers and rewrites the generated modules. It deletes nothing: remove reported orphaned handlers and function directories that are no longer needed. Before deployment, test repeated delivery using `ctx.effectKey`, the effect's idempotency key, and confirm that your handler does not repeat external writes.

Check for drift, deploy definitions, then deploy the functions:

**npm**

```shell
npx @sanity/workflow-cli blueprint generate --check
npx @sanity/workflow-cli deploy --all-tags
npx sanity@latest blueprints deploy
```

**pnpm**

```shell
pnpm dlx @sanity/workflow-cli blueprint generate --check
pnpm dlx @sanity/workflow-cli deploy --all-tags
pnpm dlx sanity@latest blueprints deploy
```

**yarn**

```shell
yarn dlx @sanity/workflow-cli blueprint generate --check
yarn dlx @sanity/workflow-cli deploy --all-tags
yarn dlx sanity@latest blueprints deploy
```

**bun**

```shell
bunx @sanity/workflow-cli blueprint generate --check
bunx @sanity/workflow-cli deploy --all-tags
bunx sanity@latest blueprints deploy
```

The generated Blueprint leaves its definition resources commented out because the Blueprints service does not accept `sanity.workflow` resources yet. Functions resolve definitions from the Content Lake, so the definition deploy must finish first.

A generated heartbeat requires an [organization-scoped stack](https://www.sanity.io/docs/blueprints/promote-stack-to-organization-scope). It requests a once-per-minute schedule. Check the [Functions frequency limits](https://www.sanity.io/docs/functions/functions-introduction) before relying on it; a schedule more frequent than your plan permits may deploy without being invoked.

Keep these limits in mind while testing:

- A subject is the document a workflow is about. A watcher restricted to named subject types wakes on every create and update of those types. A watcher accepting any type watches creates only. Drain triggers can wake for unrelated instance writes while unclaimed effects remain.
- Once emitted, the heartbeat reevaluates every in-flight instance in its tag, including workflows assigned to other hosting kinds.
- `deploy` does not check generated files. Add `blueprint generate --check` to your continuous integration checks. Editing a generated file creates drift, and regeneration overwrites the edit.
- Generation does not check an effect's retry policy against its function timeout.

Use the [runtime settings](https://www.sanity.io/docs/workflows/deployments-and-resources) to choose hosting and effect budgets. The [CLI reference](https://www.sanity.io/docs/workflows/cli-reference) describes generation output and drift failures.

