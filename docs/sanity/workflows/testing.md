<!-- Source: https://www.sanity.io/docs/workflows/testing (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Test your workflows

Run the real workflow engine in memory: drive every path of a workflow, control the clock, simulate guard enforcement, and assert on exactly what happens.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



The test bench (`@sanity/workflow-engine-test`) runs the real workflow engine against an in-memory [Sanity client](https://www.sanity.io/docs/apis-and-sdks/js-client-getting-started): real `defineWorkflow` definitions, a deterministic clock, actors you choose, and simulated guard enforcement, with no [Sanity project](https://www.sanity.io/docs/platform-management/projects-organizations-and-billing) and no network. A workflow is logic, and the bench lets you exercise its paths before a definition touches a [dataset](https://www.sanity.io/docs/content-lake/datasets).

In this guide, you’ll set up a bench, drive an instance through its stages, test who can act, test what the start picker surfaces, control the clock to test deadlines, prove a guard holds, complete effects, and run the suite in CI.

Prerequisites:

- A TypeScript project with `@sanity/workflow-engine` installed and a workflow definition to test.
- A test runner. The examples use Vitest, but the bench has no runner dependency.

## Set up the bench

Install the bench as a dev dependency, along with Vitest if you don’t have a runner yet:

**npm**

```shell
npm install --save-dev @sanity/workflow-engine @sanity/workflow-engine-test vitest
```

**pnpm**

```shell
pnpm add --save-dev @sanity/workflow-engine @sanity/workflow-engine-test vitest
```

**yarn**

```shell
yarn add --dev @sanity/workflow-engine @sanity/workflow-engine-test vitest
```

**bun**

```shell
bun add --dev @sanity/workflow-engine @sanity/workflow-engine-test vitest
```

Keep @sanity/workflow-engine and @sanity/workflow-engine-test on the same version.

The package exports `createBench`. Every call builds a fresh, fully isolated world: the real engine wired to an in-memory client, a permissive default actor, and a clock the test controls. Nothing leaks between benches, so there is no cleanup to write. A cross-resource workflow declares its sibling datasets with `serveResources`, and the bench serves them straight from its own store, which also admits runtime-supplied refs into them. Anything beyond same-store siblings takes a raw `resourceClients` resolver.

The examples test one editorial review workflow. Its single-subject start requirement prevents another unfinished run of the same definition for the article. The workflow moves from drafting through review to publishing, with a guard over the article copy and an effect that performs the final publish.

![Article review moves from Drafting to Review. Approval leads through Publishing to Published, sending back returns to Drafting, and an expired review ends in Expired.](https://cdn.sanity.io/images/3do82whm/next/b0a9f503a1ee7f0274efee871e69d0cccaf30916-2248x800.png)

**article-review.ts**

```typescript
import {
  defineAction,
  defineActivity,
  defineField,
  defineGuard,
  defineStage,
  defineTransition,
  defineWorkflow,
} from '@sanity/workflow-engine/define'

export const articleReview = defineWorkflow({
  name: 'article-review',
  title: 'Article review',
  initialStage: 'drafting',
  // Refuse another unfinished run of this definition for the same subject.
  start: {
    requirements: [
      {
        type: 'singleSubject',
        name: 'one-open-review',
        title: 'Review already in progress',
      },
    ],
  },
  fields: [
    defineField({type: 'subject', name: 'subject', required: true, initialValue: {type: 'input'}}),
    defineField({type: 'string', name: 'publishOutcome'}),
  ],
  stages: [
    defineStage({
      name: 'drafting',
      activities: [
        defineActivity({
          name: 'write',
          actions: [
            defineAction({name: 'submit', title: 'Submit for review', roles: ['writer'], status: 'done'}),
          ],
        }),
      ],
      transitions: [defineTransition({name: 'to-review', to: 'review'})],
    }),
    defineStage({
      name: 'review',
      // Freeze the article's copy while the editor reads it.
      guards: [
        defineGuard({
          name: 'freeze-copy',
          match: {idRefs: [{type: 'fieldRead', field: 'subject'}], actions: ['update']},
          predicate: '!delta::changedAny((body, title))',
        }),
      ],
      // The editor's decision is data; the transition triggers read it.
      fields: [defineField({type: 'string', name: 'decision'})],
      activities: [
        defineActivity({
          name: 'decide',
          actions: [
            defineAction({
              name: 'approve',
              title: 'Approve',
              roles: ['editor'],
              status: 'done',
              ops: [{type: 'field.set', target: {field: 'decision'}, value: {type: 'literal', value: 'approve'}}],
            }),
            defineAction({
              name: 'send-back',
              title: 'Send back',
              roles: ['editor'],
              status: 'done',
              ops: [{type: 'field.set', target: {field: 'decision'}, value: {type: 'literal', value: 'send-back'}}],
            }),
            // A trigger: the engine fires it once the deadline passes.
            defineAction({
              name: 'expire',
              when: '$fields.subject.reviewDeadline <= $now',
              status: 'failed',
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({
          name: 'to-publishing',
          to: 'publishing',
          when: "$allActivitiesDone && $fields.decision == 'approve'",
        }),
        defineTransition({
          name: 'to-drafting',
          to: 'drafting',
          when: "$allActivitiesDone && $fields.decision == 'send-back'",
        }),
        defineTransition({name: 'to-expired', to: 'expired', when: '$anyActivityFailed'}),
      ],
    }),
    defineStage({
      name: 'publishing',
      activities: [
        defineActivity({
          name: 'publish',
          actions: [
            // Entry trigger: queues the publish effect on arrival.
            defineAction({
              name: 'queue-publish',
              when: 'true',
              effects: [{name: 'article.publish', bindings: {}}],
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'to-published', to: 'published', when: "$fields.publishOutcome == 'ok'"}),
      ],
    }),
    defineStage({name: 'published'}), // terminal: no outgoing transitions
    defineStage({name: 'expired'}),
  ],
})
```

The fixture seeds the published article for workflow reads and its draft for guarded edits. The test freezes the clock, deploys the definition, and starts an instance:

Both review definitions in this guide declare a required subject, so their deployments acknowledge reader model 10. Before deploying outside the bench, follow [Upgrade Workflows packages](https://www.sanity.io/docs/workflows/upgrade) to update the runtimes that share the workflow resource.

**article-review.test.ts**

```typescript
import {
  ActionDisabledError,
  type Actor,
} from '@sanity/workflow-engine'
import {createBench, GuardDeniedError, subjectField} from '@sanity/workflow-engine-test'
import {expect, test} from 'vitest'

import {articleReview} from './article-review'

const T0 = '2026-03-01T09:00:00.000Z'
const DAY_MS = 24 * 60 * 60 * 1000

const writer: Actor = {kind: 'person', id: 'wanda', roles: ['writer']}
const editor: Actor = {kind: 'person', id: 'ed', roles: ['editor']}

async function startArticleReview() {
  const article = {
    _id: 'article-1',
    _type: 'article',
    title: 'Bench-tested workflows',
    body: 'First draft',
    reviewDeadline: '2026-03-03T09:00:00.000Z', // two days after T0
  }
  const bench = createBench({
    now: T0,
    documents: [article, {...article, _id: 'drafts.article-1'}],
  })
  await bench.deployDefinitions({
    expectedMinReaderModel: 10,
    definitions: [articleReview],
  })
  const {instance} = await bench.startInstance({
    definition: 'article-review',
    initialFields: [subjectField('article-1', {type: 'article'})],
  })
  return {bench, instance}
}

test('a new run starts in drafting', async () => {
  const {instance} = await startArticleReview()
  expect(instance.currentStage).toBe('drafting')
})
```

`deployDefinitions` and `startInstance` are the engine’s own verbs. The bench wraps them and handles the client, scope, and access wiring. `subjectField` builds the conventional `subject` entry pointing at a [document](https://www.sanity.io/docs/content-lake/documents) in the bench’s default [resource](https://www.sanity.io/docs/studio/global-document-reference-type), so you never hand-write [reference URIs](https://www.sanity.io/docs/studio/reference-type). `startInstance` returns an `OperationResult` whose `instance` is the instance document after the start commit and any cascade: the run begins in `drafting`, with the `write` activity active.

Use `subjectField()` for the workflow’s first-class subject. Use `docRefField()` for an ordinary document reference that does not determine applicability. `instancesForSubject` continues to find both current subject fields and legacy required `doc.ref` subjects while definitions are migrated.

## Drive an instance through its stages

Bench verbs take the same arguments as the engine’s, plus an `actor` shortcut. Role gates match the actor’s [roles](https://www.sanity.io/docs/user-guides/roles) literally, so fire each action as someone who holds the role:

```typescript
test('an approved article reaches publishing', async () => {
  const {bench, instance} = await startArticleReview()

  await bench.fireAction({instanceId: instance._id, activity: 'write', action: 'submit', actor: writer})
  expect(await bench.currentStage(instance._id)).toBe('review')

  const {instance: after} = await bench.fireAction({
    instanceId: instance._id,
    activity: 'decide',
    action: 'approve',
    actor: editor,
  })
  expect(after.currentStage).toBe('publishing')
})
```

Firing `approve` writes the `decision` field, the `to-publishing` trigger turns true, and the cascade moves the instance in the same commit. When the promise resolves, everything has settled. There is nothing to poll or wait for.

The send-back loop tests the same way:

```typescript
test('a send-back returns the article to drafting', async () => {
  const {bench, instance} = await startArticleReview()
  await bench.fireAction({instanceId: instance._id, activity: 'write', action: 'submit', actor: writer})

  const {instance: after} = await bench.fireAction({
    instanceId: instance._id,
    activity: 'decide',
    action: 'send-back',
    actor: editor,
  })

  expect(after.currentStage).toBe('drafting')
  expect(await bench.activityStatus(instance._id, 'write')).toBe('active')
})
```

The instance is back in `drafting` and the `write` activity is active again. The `decision` field is stage-scoped, so the next review round starts with a clean slate.

## Test who can act

`bench.evaluate` computes the read-side verdicts a UI renders from: every action on the current stage, with `allowed` and a structured `disabledReason` when it is not. Evaluate as a specific actor to test both sides of a gate:

```typescript
test('a writer cannot approve, and the verdict says why', async () => {
  const {bench, instance} = await startArticleReview()
  await bench.fireAction({instanceId: instance._id, activity: 'write', action: 'submit', actor: writer})

  const evaluation = await bench.evaluate({instanceId: instance._id, actor: writer})
  const approve = evaluation.currentStage.activities
    .flatMap((activity) => activity.actions)
    .find((candidate) => candidate.action.name === 'approve')

  expect(approve).toMatchObject({allowed: false, disabledReason: {kind: 'filter-failed'}})

  await expect(
    bench.fireAction({instanceId: instance._id, activity: 'decide', action: 'approve', actor: writer}),
  ).rejects.toBeInstanceOf(ActionDisabledError)
})
```

On an action without `when`, the `roles` shorthand, which expands into stored primitives, folds into the action’s `filter`, so a role miss surfaces as a `filter-failed` verdict: for that caller the action might as well not exist, and a UI renders it absent rather than disabled. Firing it anyway throws `ActionDisabledError` carrying the same structured reason, so the missing button and the thrown error agree.

The bench’s default actor is a permissive placeholder whose `*` role satisfies no role gate. A test that exercises roles passes an actor holding the real role, as `writer` and `editor` do.

Like every check the engine makes, these verdicts are advisory. Hard enforcement lives in the [Content Lake](https://www.sanity.io/docs/content-lake), and [Actors, tokens, and what’s actually enforced](https://www.sanity.io/docs/workflows/actors-and-enforcement) says which restriction holds against a client that never calls the engine. To pull the Content Lake’s grants gate into a test, build the bench with `currentUser` and [grants](https://www.sanity.io/docs/content-lake/roles-concepts) (or pass a per-call `grants:` shortcut on a verb), and a write the grants do not permit is rejected with the same 403 the real Content Lake returns.

Use the same `attributes` shortcut at bench construction or per call to test `$attributes` gates without a Management API. The bag composes like `grants`.

```typescript
const bench = createBench({
  attributes: {department: 'politics'},
})

await bench.evaluate({instanceId, attributes: {department: 'politics'}})
```

## Test start visibility

The article-review definition uses a single-subject requirement. evaluateStart reports whether that requirement is met before a commit, and startInstance checks it again when starting. start.filter remains a discovery rule. See Conditions for both decision points.

```typescript
import {StartNotAllowedError} from '@sanity/workflow-engine'

test('a second review on the same article is refused', async () => {
  const {bench} = await startArticleReview()

  const preflight = await bench.evaluateStart({
    definition: 'article-review',
    initialFields: [subjectField('article-1', {type: 'article'})],
  })
  expect(preflight).toMatchObject({allowed: false, outcome: 'unsatisfied'})

  await expect(
    bench.startInstance({
      definition: 'article-review',
      initialFields: [subjectField('article-1', {type: 'article'})],
    }),
  ).rejects.toBeInstanceOf(StartNotAllowedError)
})

test('a review on a different article starts', async () => {
  const {bench} = await startArticleReview()

  const preflight = await bench.evaluateStart({
    definition: 'article-review',
    initialFields: [subjectField('article-2', {type: 'article'})],
  })
  expect(preflight).toMatchObject({allowed: true, outcome: 'satisfied'})

  const {instance} = await bench.startInstance({
    definition: 'article-review',
    initialFields: [subjectField('article-2', {type: 'article'})],
  })
  expect(instance.currentStage).toBe('drafting')
})
```

The second start fails with a named unmet requirement. A different subject starts normally, and completing or aborting the first run frees its subject. The requirement is scoped to this definition. It prevents ordinary duplicate starts, but Content Lake access control remains the hard enforcement boundary.

The bench also exposes definitionsForDocument, the read a start picker derives from. Pass the loaded candidate document. The result includes startable definitions whose subject type and start.filter accept that document:

```typescript
import {defineField, defineStage, defineWorkflow} from '@sanity/workflow-engine/define'

// A browse-time-pure filter: it reads the candidate document, never $fields,
// so it only offers this review for finance articles.
const financeReview = defineWorkflow({
  name: 'finance-review',
  title: 'Finance review',
  initialStage: 'review',
  start: {filter: "articleType == 'finance'"},
  fields: [
    defineField({type: 'subject', name: 'subject', required: true, initialValue: {type: 'input'}}),
  ],
  stages: [defineStage({name: 'review'})],
})

test('the picker offers article-review and hides a filter that does not match', async () => {
  const {bench} = await startArticleReview()
  await bench.deployDefinitions({
    expectedMinReaderModel: 10,
    definitions: [financeReview],
  })

  const startable = await bench.definitionsForDocument({
    document: {_id: 'article-1', _type: 'article'},
  })

  expect(startable.map((definition) => definition.name)).toEqual(['article-review'])
})
```

article-review has no filter, so discovery includes it even while its start requirement is unmet. finance-review appears only for a candidate document whose articleType is finance. A UI can call evaluateStart after collecting inputs to display unmet requirements before it calls startInstance.

## Control the clock

The bench clock feeds `$now` and every timestamp the engine stamps. `createBench({now: T0})` freezes it at a known instant. `advance` moves the clock forward and `setNow` jumps to an instant. Neither writes anything; call `tick` to evaluate the new time.

```typescript
test('an undecided review expires when the deadline passes', async () => {
  const {bench, instance} = await startArticleReview()
  await bench.fireAction({instanceId: instance._id, activity: 'write', action: 'submit', actor: writer})

  const before = await bench.tick({instanceId: instance._id})
  expect(before).toMatchObject({changed: false, cascaded: 0})

  bench.advance(3 * DAY_MS) // now three days past T0, one past the deadline
  const after = await bench.tick({instanceId: instance._id})

  expect(after.instance.currentStage).toBe('expired')
})
```

Before the deadline the tick is a no-op, reported as `changed: false`. Once `advance` crosses the deadline, the next tick’s cascade fires the `expire` trigger: the `decide` activity resolves `failed` and the `$anyActivityFailed` transition routes the instance to `expired`, with the frozen clock stamped on its history. The article document itself was never touched; only time moved.

## Test guard enforcement

The `review` stage deploys the `freeze-copy` guard document on entry and deletes it on exit. The bench simulates Content Lake enforcement at its client write seam, so guard tests cover denied mutations even though raw-client enforcement is not active in the Content Lake.

`activeGuardsForDocument` previews a denial without writing. `editDocument` attempts the write and throws `GuardDeniedError` when a guard rejects it. This content-edit guard targets the draft, so both calls use `drafts.article-1`:

```typescript
test('the review stage locks the article copy', async () => {
  const {bench, instance} = await startArticleReview()
  await bench.fireAction({instanceId: instance._id, activity: 'write', action: 'submit', actor: writer})

  const active = await bench.activeGuardsForDocument('drafts.article-1')
  expect(active.map((guard) => guard.name)).toEqual(['freeze-copy'])

  await expect(
    bench.editDocument({documentId: 'drafts.article-1', patch: {set: {body: 'Reworded during review'}}}),
  ).rejects.toThrow(GuardDeniedError)
})
```

The guard’s predicate denies only writes that change `body` or `title`, so a [patch](https://www.sanity.io/docs/content-lake/http-patches) that leaves both alone goes through even during review.

Drive the stage to exit and the guard document is deleted:

```typescript
test('the guard is deleted when the review stage exits', async () => {
  const {bench, instance} = await startArticleReview()
  await bench.fireAction({instanceId: instance._id, activity: 'write', action: 'submit', actor: writer})
  await bench.fireAction({instanceId: instance._id, activity: 'decide', action: 'send-back', actor: editor})

  expect(await bench.activeGuardsForDocument('drafts.article-1')).toEqual([])
  await bench.editDocument({documentId: 'drafts.article-1', patch: {set: {body: 'Second draft'}}})
})
```

With the review stage exited, no guards remain active and the same edit succeeds.

## Complete effects

Entering `publishing` fires the `queue-publish` trigger, which queues the `article.publish` effect. In production an effect handler picks it up, performs the external work, and reports back; in a test, you play the handler. `listPendingEffects` lists what is queued, and `completePendingEffect` completes an effect by name, with `ops` writing its outcome onto the instance in the same commit:

```typescript
test('completing the publish effect finishes the run', async () => {
  const {bench, instance} = await startArticleReview()
  await bench.fireAction({instanceId: instance._id, activity: 'write', action: 'submit', actor: writer})
  await bench.fireAction({instanceId: instance._id, activity: 'decide', action: 'approve', actor: editor})

  const pending = await bench.listPendingEffects({instanceId: instance._id})
  expect(pending.map((effect) => effect.name)).toEqual(['article.publish'])

  await bench.completePendingEffect({
    instanceId: instance._id,
    effect: 'article.publish',
    status: 'done',
    ops: [
      {
        type: 'field.set',
        target: {scope: 'workflow', field: 'publishOutcome'},
        value: {type: 'literal', value: 'ok'},
      },
    ],
    actor: {kind: 'system', id: 'g-publish-service'},
  })

  expect(await bench.currentStage(instance._id)).toBe('published')
})
```

The completion applies the `field.set`, the `to-published` transition reads the outcome field and fires in the same cascade, and the instance lands in `published`. An effect reports state through fields, never by flipping an activity’s status. To test the failure path, complete with `status: 'failed'` and assert on where the instance parks.

## Recover a terminal activity

Use resetActivity to test an operator rerunning a failed activity or skipping it so the cascade can continue:

```typescript
const {instance: recovered} = await bench.resetActivity({
  instanceId: instance._id,
  activity: 'publish',
  to: 'active', // use 'skipped' to bypass it
})

expect(recovered.currentStage).toBe('publishing')
```

## Run it in CI

Bench tests are plain unit tests: no Sanity project, no [tokens](https://www.sanity.io/docs/content-lake/http-auth), no network, and no shared state between benches, so they parallelize like the rest of your suite. Run them the same way:

**npm**

```shell
npx vitest run
```

**pnpm**

```shell
pnpm dlx vitest run
```

**yarn**

```shell
yarn dlx vitest run
```

**bun**

```shell
bunx vitest run
```

The command exits non-zero when a test fails, so your CI job fails when a workflow regresses. When you change a definition, re-run the suite: a broken path fails in milliseconds, long before the definition reaches a dataset.

## Next steps

- [Quick start: run your first workflow](https://www.sanity.io/docs/workflows/getting-started): install the engine, deploy a definition, and run it against a real dataset.
- [Workflows](https://www.sanity.io/docs/workflows/introduction): the model behind stages, conditions, guards, and effects.
- [Cookbook](https://www.sanity.io/docs/workflows/cookbook): realistic, worked workflow examples to adapt.
- [Reference](https://www.sanity.io/docs/workflows/reference): every construct and engine verb, with exact shapes.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



