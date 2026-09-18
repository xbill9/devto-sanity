<!-- Source: https://www.sanity.io/docs/workflows/cookbook-coordinated-release (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Cookbook: Coordinated release

A release workflow that coordinates approvals across many documents and hands the atomic go-live to a Content Release.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



Coordinate review across every document in a Content Release, then hand the atomic go-live to Sanity. This recipe defines the review child, the parent workflow, and the Functions that drive them.

The release workflow runs in four stages:

![Release workflow stages: Assembly leads to Scheduled, then Published, then Archived.](https://cdn.sanity.io/images/3do82whm/next/2d5a3bdb148a31546f8feeceb5f987e8657134f4-2202x276.png)

1. **Assembly**: the documents are grouped into the release. A review subworkflow spawns for each one, and a guard holds every member document’s [publish](https://www.sanity.io/docs/content-lake/documents) until its review passes (for what a guard enforces today, see [Guards and enforcement](https://www.sanity.io/docs/workflows/guards)).
2. **Scheduled**: a release manager schedules the embargoed go-live, or publishes on demand.
3. **Published**: the release publishes as one unit, and effects fire the build and notifications.
4. **Archived**: terminal, with revert as the rollback.

## Before you get started

- **Packages**: `@sanity/workflow-engine`, `@sanity/client` (the release helpers live on `client.releases.*`), and `@sanity/functions` + `@sanity/blueprints` for the runtime.
- **A Content Release**: created up front, with a [version document](https://www.sanity.io/docs/content-lake/documents) per member (`client.releases.create` + `client.createVersion`). This workflow coordinates the review and the timed go-live. It does not create the release. See [Content Releases with @sanity/client](https://www.sanity.io/docs/apis-and-sdks/js-client-releases).
- **An editor token**: for the release [dataset](https://www.sanity.io/docs/content-lake/datasets), plus the engine’s own client and a `workflows` dataset for its instances.
- **A release-manager role** in [dataset access control](https://www.sanity.io/docs/content-lake/keeping-your-data-safe) (custom [roles](https://www.sanity.io/docs/user-guides/roles)): the `schedule` action is gated to it. That gate is advisory in the engine, and dataset access control separately decides what each [token](https://www.sanity.io/docs/content-lake/http-auth) may actually write.

The workflow takes two definitions: a small review child spawned once per document, and the parent that coordinates them. The release and member documents are supplied as [global document references](https://www.sanity.io/docs/workflows/global-document-references) so each keeps its resource identity.

## Define the review child

The review child is a spawn-only (`lifecycle: 'child'`) workflow: one document, one reviewer, approve or request changes.

![Review subworkflow stages: Review leads to Approved, while requested changes loop back to Review.](https://cdn.sanity.io/images/3do82whm/next/dc8bc4c27d727f69f7b22592b36e3685d4422562-1242x540.png)

```typescript
import {
  defineWorkflow,
  defineField,
  defineStage,
  defineActivity,
  defineAction,
  defineTransition,
  defineGuard,
} from '@sanity/workflow-engine/define'

export const releaseReview = defineWorkflow({
  name: 'release-review',
  title: 'Release document review',
  lifecycle: 'child', // spawn-only: a parent instantiates it, never started cold
  initialStage: 'review',
  fields: [
    defineField({type: 'subject', name: 'subject', initialValue: {type: 'input'}, required: true}),
    defineField({type: 'actor', name: 'reviewer'}),
    defineField({type: 'actor', name: 'approval'}),
    defineField({type: 'string', name: 'changeNote'}),
  ],
  stages: [
    defineStage({
      name: 'review',
      title: 'Review',
      // Per-document publish hold: a guard's `idRefs` resolves to ONE document, so the
      // hold lives here on the child's own `subject`, not on the parent over the whole
      // `documents` array (an array idRef resolves to nothing and deploys no guard).
      // idRefs are typed GuardReads, resolved at deploy and re-synced by the guard refresh.
      guards: [
        defineGuard({
          name: 'hold-publish-review',
          title: 'Hold publish while under review',
          match: {idRefs: [{type: 'fieldRead', field: 'subject'}], actions: ['publish']},
        }),
      ],
      activities: [
        defineActivity({
          name: 'review',
          title: 'Review the document',
          actions: [
            defineAction({
              name: 'claim',
              title: 'Take this review',
              filter: '!defined($fields.reviewer)',
              ops: [{type: 'field.set', target: {field: 'reviewer'}, value: {type: 'actor'}}],
            }),
            defineAction({
              name: 'approve',
              title: 'Approve',
              filter: '$fields.reviewer.id == $actor.id',
              status: 'done',
              ops: [{type: 'field.set', target: {field: 'approval'}, value: {type: 'actor'}}],
            }),
            defineAction({
              name: 'request-changes',
              title: 'Request changes',
              filter: '$fields.reviewer.id == $actor.id',
              status: 'done',
              params: [{type: 'string', name: 'note', title: 'What to change', required: true}],
              ops: [{type: 'field.set', target: {field: 'changeNote'}, value: {type: 'param', param: 'note'}}],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'approved', to: 'approved', when: 'defined($fields.approval)'}),
        defineTransition({name: 'changes', to: 'changes-requested', when: 'defined($fields.changeNote)'}),
      ],
    }),
    defineStage({
      name: 'changes-requested',
      title: 'Changes requested',
      // Still the team's; keep the publish hold until the document is approved.
      guards: [
        defineGuard({
          name: 'hold-publish-changes',
          title: 'Hold publish while changes are pending',
          match: {idRefs: [{type: 'fieldRead', field: 'subject'}], actions: ['publish']},
        }),
      ],
      activities: [
        defineActivity({
          name: 'fix',
          title: 'Address the changes',
          actions: [
            defineAction({
              name: 'resubmit',
              title: 'Resubmit for review',
              status: 'done',
              // clear the note before the move so the review stage's `changes` transition doesn't refire on re-entry
              ops: [{type: 'field.unset', target: {field: 'changeNote'}}],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'back-to-review', to: 'review', when: '$allActivitiesDone'}),
      ],
    }),
    defineStage({name: 'approved', title: 'Approved'}), // terminal: the parent reads this as "cleared for release"
  ],
})
```

Take review records the caller in the workflow-level `reviewer` field. The same reviewer keeps the review when the workflow returns to this stage. This actor field does not create a task assignment; use [Fields](https://www.sanity.io/docs/workflows/fields) to add one.

## Define the release workflow

The parent coordinates the reviews and the timed go-live in one `defineWorkflow` call:

```typescript
import {
  defineWorkflow,
  defineField,
  defineStage,
  defineActivity,
  defineAction,
  defineTransition,
} from '@sanity/workflow-engine/define'

export const coordinatedRelease = defineWorkflow({
  name: 'coordinated-release',
  title: 'Coordinated release',
  initialStage: 'assembly',
  // Refuse another unfinished run of this definition for the same release.
  start: {
    requirements: [
      {
        type: 'groq',
        name: 'one-open-release',
        title: 'Release workflow already in progress',
        query:
          "count(*[_type == 'sanity.workflow.instance' && tag == $tag && definition == $definition" +
          " && !defined(completedAt) && fields[name == 'release'][0].value.releaseName == $fields.release.releaseName]) == 0",
      },
    ],
  },
  fields: [
    defineField({type: 'release.ref', name: 'release', initialValue: {type: 'input'}, required: true}),
    defineField({type: 'doc.refs', name: 'documents', initialValue: {type: 'input'}, required: true}),
    defineField({type: 'datetime', name: 'publishAt'}),
  ],
  stages: [
    defineStage({
      name: 'assembly',
      title: 'Assembly',
      // The publish hold is PER-DOCUMENT, on each release-review child over its single
      // `subject` (see above), NOT a parent guard over the `documents` array. A guard's
      // `idRefs` resolves to one document, so an array target deploys no guard at all.
      activities: [
        defineActivity({
          name: 'reviews',
          title: 'Review every document',
          actions: [
            defineAction({
              name: 'open-reviews',
              when: 'true', // entry trigger: fires on the first cascade after stage entry
              spawn: {
                // GDR rows self-key on their id, so fan out over the doc.refs field directly.
                forEach: '$fields.documents[]',
                definition: {name: 'release-review'},
                with: {subject: '$row'}, // each child reviews one document
              },
            }),
            // Declared after the spawn: triggers run in declaration order, so the entry
            // cascade opens the reviews before this gate first evaluates.
            defineAction({
              name: 'all-reviewed',
              when: "count($subworkflows[activity == 'reviews' && current && status == 'active']) == 0",
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [defineTransition({name: 'to-scheduled', to: 'scheduled', when: '$allActivitiesDone'})],
    }),
    defineStage({
      name: 'scheduled',
      title: 'Scheduled',
      activities: [
        defineActivity({
          name: 'schedule',
          title: 'Schedule the release',
          actions: [
            defineAction({
              name: 'schedule',
              title: 'Schedule go-live',
              roles: ['release-manager'],
              params: [{type: 'dateTime', name: 'publishAt', title: 'Go-live', required: true}],
              status: 'done',
              ops: [{type: 'field.set', target: {field: 'publishAt'}, value: {type: 'param', param: 'publishAt'}}],
              effects: [
                {name: 'schedule-release', bindings: {release: '$fields.release', publishAt: '$fields.publishAt'}},
              ],
            }),
          ],
        }),
        defineActivity({
          name: 'go-live',
          title: 'Await go-live',
          // off-system: the publish happens in Content Releases, and `target` deep-links
          // the release; a scheduled Function fires `mark-published` once it has published
          target: {type: 'field', field: 'release'},
          actions: [defineAction({name: 'mark-published', title: 'Mark released', status: 'done'})],
        }),
      ],
      transitions: [defineTransition({name: 'to-published', to: 'published', when: '$allActivitiesDone'})],
    }),
    defineStage({
      name: 'published',
      title: 'Published',
      activities: [
        defineActivity({
          name: 'announce',
          title: 'Build and notify',
          actions: [
            defineAction({
              name: 'queue-announcements',
              when: 'true', // entry trigger: queues both effects the moment the stage opens
              effects: [{name: 'build-site'}, {name: 'notify-stakeholders'}],
            }),
            defineAction({
              name: 'confirm-announced',
              when:
                "$effectStatus['build-site'] == 'done' && $effectStatus['notify-stakeholders'] == 'done'",
              status: 'done',
            }),
            defineAction({
              name: 'announcement-failed',
              when:
                "$effectStatus['build-site'] == 'failed' || $effectStatus['notify-stakeholders'] == 'failed'",
              status: 'failed',
            }),
          ],
        }),
      ],
      transitions: [defineTransition({name: 'to-archived', to: 'archived', when: '$allActivitiesDone'})],
    }),
    defineStage({name: 'archived', title: 'Archived'}), // terminal
  ],
})
```

![Release workflow stages: Assembly leads to Scheduled, then Published, then Archived.](https://cdn.sanity.io/images/3do82whm/next/2d5a3bdb148a31546f8feeceb5f987e8657134f4-2202x276.png)

## What each piece does

- **Inputs**: `release` identifies the Content Release; `documents` lists the members that need review.
- **Duplicate starts**: the `one-open-release` requirement rejects another unfinished parent instance for the same release. Spawned child workflows do not evaluate parent start requirements.
- **Review fan-out**: `open-reviews` spawns one `release-review` child per document. `all-reviewed` completes the parent activity when no child in the current cohort remains active.
- **Per-document hold**: each child places the guard on its own `subject`, because a guard targets one document rather than the parent’s document array. The hold remains until that review is approved.
- **Scheduling**: the release manager supplies `publishAt`. The `schedule-release` effect schedules the Content Release, and a scheduled Function later confirms publication by firing `mark-published`.
- After publication, the workflow runs the build and notification effects. Both must succeed before it archives. A failure stays visible in Published.

## Write the effect handlers

Keep the shared client and each external concern in a small file. Map each effect name in the workflow definition to the handler that performs that work. A handler may receive the same effect more than once, so use the effect key to give repeated calls the same external outcome.

### Shared content client

```typescript
// handlers/content.ts
import {createClient} from '@sanity/client'

export const content = createClient({
  projectId: 'yourprojectid',
  dataset: 'production',
  apiVersion: '2025-02-19',
  token: process.env.SANITY_EDITOR_TOKEN!,
  useCdn: false,
})
```

### Release scheduling

```typescript
// handlers/schedule-release.ts
import {type EffectHandler, type ReleaseRef} from '@sanity/workflow-engine'
import {content} from './content'

export const scheduleRelease: EffectHandler = async (params) => {
  const release = params.release as ReleaseRef
  const publishAt = params.publishAt as string
  const current = await content.releases.get({releaseId: release.releaseName})

  if (current?.state === 'scheduled' && current.publishAt === publishAt) return

  await content.releases.schedule({
    releaseId: release.releaseName,
    publishAt,
  })
}
```

### Site build

Use the stable effect key as the receiving system’s idempotency key. The deployment hook must honor this header.

```typescript
// handlers/build-site.ts
import {type EffectHandler} from '@sanity/workflow-engine'

export const buildSite: EffectHandler = async (_params, ctx) => {
  const response = await fetch(process.env.DEPLOY_HOOK_URL!, {
    method: 'POST',
    headers: {'Idempotency-Key': ctx.effectKey},
  })

  if (!response.ok) {
    throw new Error(`Build hook failed: ${response.status}`)
  }
}
```

### Stakeholder notification

Write a deterministic outbox record. A separate worker can deliver the Slack message or email and mark the record complete.

```typescript
// handlers/notify-stakeholders.ts
import {type EffectHandler} from '@sanity/workflow-engine'
import {content} from './content'

export const notifyStakeholders: EffectHandler = async (_params, ctx) => {
  await content.createIfNotExists({
    _id: `workflow-notification.${ctx.effectKey}`,
    _type: 'workflow.notification',
    instanceId: ctx.instanceId,
    status: 'pending',
  })
}
```

### Map effects to handlers

```typescript
// handlers/effect-handlers.ts
import {type EffectHandler} from '@sanity/workflow-engine'
import {buildSite} from './build-site'
import {notifyStakeholders} from './notify-stakeholders'
import {scheduleRelease} from './schedule-release'

export const effectHandlers: Record<string, EffectHandler> = {
  'schedule-release': scheduleRelease,
  'build-site': buildSite,
  'notify-stakeholders': notifyStakeholders,
}
```

Learn more in [Content Releases with @sanity/client](https://www.sanity.io/docs/apis-and-sdks/js-client-releases).

## Configure the engine

Create the engine with the workflow dataset client, the effect handlers, and a `resourceClients` route for the production dataset that holds the release and member documents.

```typescript
// engine.ts
import {createClient} from '@sanity/client'
import {createEngine, ENGINE_API_VERSION, type ParsedGdr} from '@sanity/workflow-engine'
import {effectHandlers} from './handlers/effect-handlers'
import {content} from './handlers/content'

const workflowClient = createClient({
  projectId: 'yourprojectid',
  dataset: 'workflows',
  apiVersion: ENGINE_API_VERSION,
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
})

export const engine = createEngine({
  client: workflowClient,
  workflowResource: {type: 'dataset', id: 'yourprojectid.workflows'},
  tag: 'prod',
  effects: {handlers: effectHandlers},
  resourceClients: (parsed: ParsedGdr) =>
    parsed.scheme === 'dataset' && parsed.dataset === 'production' ? content : undefined,
})
```

## Drive it with Functions

Use the robot token, effect drainer, and the Scheduled Function that periodically ticks existing instances from [Run Workflows with Sanity Functions](https://www.sanity.io/docs/workflows/sanity-functions). This recipe adds another Scheduled Function for the Content Release go-live.

### Drain queued release effects

Register this recipe's effect handlers with the drainer from the integration guide. One `drainEffects()` call consumes every scheduling and announcement effect it can claim. Each completion advances the workflow, and the delta filter wakes only when new unclaimed work appears.

### A scheduled Function for the go-live

The engine keeps no clock. A scheduled Function checks releases waiting at go-live and fires mark-published after Sanity reports the release as published:

```typescript
// functions/confirm-go-live/index.ts
import {engine} from '../../engine'
import {content} from '../../handlers/content'

export const handler = async () => {
  const waiting = await engine.query<{_id: string; releaseName: string}[]>({
    groq: `*[_type == "sanity.workflow.instance" && tag == $tag && definition == "coordinated-release" && currentStage == "scheduled" && !defined(completedAt)]{
      _id, "releaseName": fields[name == "release"][0].value.releaseName
    }`,
  })
  for (const wf of waiting) {
    const release = await content.releases.get({releaseId: wf.releaseName})
    if (release?.state === 'published') {
      await engine.fireAction({
        instanceId: wf._id,
        activity: 'go-live',
        action: 'mark-published',
        idempotent: true,
      })
    }
  }
}
```

The integration guide configures the shared robot token and the Scheduled Function that ticks workflow instances. Add this recipe's go-live check as a separate Scheduled Function. A durable-execution runtime is the alternative to polling: rather than sweeping for releases that are due, it parks the run until the go-live time and resumes it in place.

## Deploy it

First, deploy both workflow definitions: the parent and its spawn-only child (the child must be deployed for the parent to spawn it). The CLI reads a `sanity.workflow.ts`:

These definitions require reader model `10` because they declare required content-reference fields. Before using the acknowledgement below with existing workflow data, follow [the package rollout order](https://www.sanity.io/docs/workflows/upgrade) and verify every runtime sharing the workflow resource can read model `10`.

```typescript
// sanity.workflow.ts
import {defineWorkflowConfig} from '@sanity/workflow-engine/define'
import {coordinatedRelease} from './coordinated-release'
import {releaseReview} from './release-review'

export default defineWorkflowConfig({
  deployments: [
    {
      name: 'production',
      tag: 'prod',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: 'yourprojectid.workflows'},
      definitions: [releaseReview, coordinatedRelease],
    },
  ],
})
```

Then log in and run the deploy:

```sh
sanity login && sanity-workflows deploy
```

Deploying a changed definition creates a new version. See [Configure and deploy workflow definitions](https://www.sanity.io/docs/workflows/deploy-definitions) for sharing and deployment options.

Start with the [runtime Blueprint](https://www.sanity.io/docs/workflows/sanity-functions), then add `confirm-go-live` as another Scheduled Function bound to the same robot token.

Deploy the extended blueprint:

**npm**

```shell
# after adding confirm-go-live to the canonical runtime blueprint
npx sanity blueprints deploy
```

**pnpm**

```shell
# after adding confirm-go-live to the canonical runtime blueprint
pnpm dlx sanity blueprints deploy
```

**yarn**

```shell
# after adding confirm-go-live to the canonical runtime blueprint
yarn dlx sanity blueprints deploy
```

**bun**

```shell
# after adding confirm-go-live to the canonical runtime blueprint
bunx sanity blueprints deploy
```

The document Function advances instance-driven work. The scheduled Function confirms go-live.

## Run it

Start an instance with the release and its member documents. The one-open-release requirement prevents another unfinished run for that Content Release:

```typescript
import {refDataset, releaseRef} from '@sanity/workflow-engine'
import {engine} from './engine'

const release = releaseRef({res: {type: 'dataset', id: 'yourprojectid.production'}, releaseName: 'spring-launch'})

// The definition's start requirement prevents another unfinished run for this release.

// verbs return an OperationResult; the instance document is on .instance
const {instance: wf} = await engine.startInstance({
  definition: 'coordinated-release',
  initialFields: [
    {type: 'release.ref', name: 'release', value: release},
    {
      type: 'doc.refs',
      name: 'documents',
      value: [
        refDataset({projectId: 'yourprojectid', dataset: 'production', documentId: 'landing', type: 'page'}),
        refDataset({projectId: 'yourprojectid', dataset: 'production', documentId: 'pricing', type: 'page'}),
        refDataset({projectId: 'yourprojectid', dataset: 'production', documentId: 'launch-post', type: 'article'}),
      ],
    },
  ],
})

// One release-review child spawns per document; reviewers claim and approve each
// (see the Editorial review example for the per-review calls). Once every child
// is approved, the workflow moves to 'scheduled'. Then a release manager:
await engine.fireAction({
  instanceId: wf._id,
  activity: 'schedule',
  action: 'schedule',
  params: {publishAt: '2026-07-01T09:00:00Z'},
})

// A scheduled Function then confirms the go-live: once Sanity publishes the release
// it fires `mark-published`, advancing the workflow to 'published'.
```

One review child spawns per document. Once every child is approved, the workflow moves to Scheduled. At go-live the release publishes as one unit. The build and notification then run; both must succeed before the workflow archives.

A manager starts the release and schedules its go-live, and reviewers approve child workflows through engine actions. Functions drain the schedule effect and confirm publication. The engine owns the transitions from Assembly to Scheduled, Published, and Archived, and the Content Lake persists each state.

![A manager starts the release, reviewers approve child workflows through the engine, and the manager schedules go-live. Functions drain the schedule effect and confirm publication. The engine transitions Assembly to Scheduled, Published, and Archived while the Content Lake persists each state.](https://cdn.sanity.io/images/3do82whm/next/72d7058b8f54fd4babb521368c7b718cbf1e165a-2800x2692.png)

## Adapting it

- **Publish on demand** instead of scheduling: drop the `publishAt` param and have the effect call `client.releases.publish` immediately.
- **Reuse the editorial example**: if each document is written fresh for the launch, use it as the child rather than the review-only child here.
- **Predicated guards**: the holds here are unconditional denies. Give a guard a `predicate` (Content Lake GROQ over the [mutation](https://www.sanity.io/docs/content-lake/mutations-introduction)) to allow specific writes while the hold stands, for example permitting metadata patches on a member document while still denying `publish`.
- **Cardinality**: a single-document release is the same machine with one child. Sanity’s [Scheduled Drafts](https://www.sanity.io/docs/studio/scheduled-drafts) are exactly that.

## Next steps

- [Cookbook](https://www.sanity.io/docs/workflows/cookbook): the other examples and how to run them.
- [Reference](https://www.sanity.io/docs/workflows/reference): the entries for `spawn`, `guards`, `release.ref`, and `effects`.
- [Content Releases with @sanity/client](https://www.sanity.io/docs/apis-and-sdks/js-client-releases): the release helpers the effect handlers call.
- [Functions](https://www.sanity.io/docs/functions/functions-introduction): the runtime for the driver Functions.
- [Blueprints CLI](https://www.sanity.io/docs/cli-reference/cli-blueprints): the CLI that deploys the Functions.
- [Test your workflows](https://www.sanity.io/docs/workflows/testing): cover the release’s review fan-out and scheduled go-live in the in-memory bench, advancing the clock past the embargo.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



