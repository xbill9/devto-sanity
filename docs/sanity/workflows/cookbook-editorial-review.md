<!-- Source: https://www.sanity.io/docs/workflows/cookbook-editorial-review (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Cookbook: Editorial review

A four-stage editorial review workflow for Sanity: assignment, drafting, review, and published, driven by human actions in the Studio.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



This is the base loop the other Cookbook recipes build on: an editorial review where every step is a human action in the [Studio](https://www.sanity.io/docs/studio). It runs in four stages:

![Workflow stages: Assignment leads to Drafting, then Review. Approval leads to Published; requested changes return to Drafting.](https://cdn.sanity.io/images/3do82whm/next/fb3c3d7b692d525db39f22d7ea00d33e06568552-2175x348.png)

1. **Assignment**: a writer takes the open commission.
2. **Drafting**: the assigned writer writes the article, then submits it for review.
3. **Review**: a desk editor approves it, or sends it back with a reason. A rejection loops back to drafting.
4. **Published**: a terminal stage.

The loop runs assignment → drafting → desk-editor review → publication. Copy edit, fact-check, and SEO are real stages too, but which exist and who owns them varies by organization, so the base loop leaves them out. The Adapting it section shows where they slot in.

## Before you get started

- **Packages**: `@sanity/workflow-engine` and `@sanity/workflow-studio-plugin` for the ready-made human surface. No AI packages and no [Functions](https://www.sanity.io/docs/functions/functions-introduction).
- **The engine** (`createEngine`) and a [dataset](https://www.sanity.io/docs/content-lake/datasets) for its instances; the articles can live in the same dataset.
- **No effect handlers**: every step here is a human action fired from the Studio, so there is nothing to drain and no Function to deploy. The whole runtime is the Studio plus the deployed definition. That makes this the shortest recipe to stand up. The [AI pipeline](https://www.sanity.io/docs/workflows/cookbook-ai-content-pipeline) and [Coordinated release](https://www.sanity.io/docs/workflows/cookbook-coordinated-release) recipes add handlers and Functions on top of this same base.

## Define the workflow

The whole workflow is one `defineWorkflow` call, with the four stages and the fields that fill in as it runs:

```typescript
import {
  defineWorkflow,
  defineField,
  defineStage,
  defineActivity,
  defineAction,
  defineTransition,
} from '@sanity/workflow-engine/define'

export const editorialReview = defineWorkflow({
  name: 'editorial-review',
  title: 'Editorial review',
  initialStage: 'assignment',
  fields: [
    defineField({type: 'subject', name: 'subject', initialValue: {type: 'input'}, required: true}),
    defineField({type: 'actor', name: 'writer'}),
    defineField({type: 'actor', name: 'reviewer'}),
    defineField({type: 'actor', name: 'approval'}),
    defineField({type: 'string', name: 'rejectionReason'}),
  ],
  stages: [
    defineStage({
      name: 'assignment',
      title: 'Assignment',
      activities: [
        defineActivity({
          name: 'assign',
          title: 'Assign a writer',
          actions: [
            defineAction({
              name: 'take',
              title: 'Take this assignment',
              filter: '!defined($fields.writer)', // open until a writer takes it
              status: 'done',
              ops: [{type: 'field.set', target: {field: 'writer'}, value: {type: 'actor'}}],
            }),
          ],
        }),
      ],
      transitions: [defineTransition({name: 'to-drafting', to: 'drafting', when: '$allActivitiesDone'})],
    }),
    defineStage({
      name: 'drafting',
      title: 'Drafting',
      activities: [
        defineActivity({
          name: 'write',
          title: 'Write the article',
          actions: [
            defineAction({
              name: 'submit',
              title: 'Submit for review',
              filter: '$fields.writer.id == $actor.id', // only the assigned writer
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [defineTransition({name: 'to-review', to: 'review', when: '$allActivitiesDone'})],
    }),
    defineStage({
      name: 'review',
      title: 'Review',
      activities: [
        defineActivity({
          name: 'review',
          title: 'Review the article',
          actions: [
            defineAction({
              name: 'clear-rejection',
              title: 'Clear the previous rejection',
              when: 'true', // fires on entry, so a resubmitted draft does not bounce straight back
              ops: [{type: 'field.unset', target: {field: 'rejectionReason'}}],
            }),
            defineAction({
              name: 'claim',
              title: 'Take this review',
              filter: '!defined($fields.reviewer)',
              ops: [{type: 'field.set', target: {field: 'reviewer'}, value: {type: 'actor'}}],
            }),
            defineAction({
              name: 'approve',
              title: 'Approve',
              filter: '$fields.reviewer.id == $actor.id', // only the editor who claimed it
              status: 'done',
              ops: [{type: 'field.set', target: {field: 'approval'}, value: {type: 'actor'}}],
            }),
            defineAction({
              name: 'reject',
              title: 'Reject with reason',
              filter: '$fields.reviewer.id == $actor.id',
              status: 'done',
              params: [{type: 'string', name: 'reason', title: 'Reason', required: true}],
              ops: [{type: 'field.set', target: {field: 'rejectionReason'}, value: {type: 'param', param: 'reason'}}],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'to-published', to: 'published', when: 'defined($fields.approval)'}),
        defineTransition({name: 'back-to-drafting', to: 'drafting', when: 'defined($fields.rejectionReason)'}),
      ],
    }),
    defineStage({name: 'published', title: 'Published'}),
  ],
})
```

Take review records the caller in the workflow-level `reviewer` field. The same reviewer keeps the review when the workflow returns to this stage. This actor field does not create a task assignment; use [Fields](https://www.sanity.io/docs/workflows/fields) to add one.

![Workflow stages: Assignment leads to Drafting, then Review. Approval leads to Published; requested changes return to Drafting.](https://cdn.sanity.io/images/3do82whm/next/fb3c3d7b692d525db39f22d7ea00d33e06568552-2175x348.png)

## What each piece does

- subject is the article: a required workflow input that makes the definition discoverable from that document. Its value is a [global document reference](https://www.sanity.io/docs/workflows/global-document-references), which preserves the article’s project and dataset identity. An editor commissions the piece, often as a fresh draft, and the other fields fill in as the workflow runs.
- **Assignment**: a writer takes the open assignment with `take`, which records them in `writer` and completes the activity. The `!defined($fields.writer)` filter keeps the assignment from being taken twice: once someone has it, the action disappears. (Editor-push assignment is the same shape with `take` gated to an editor and the writer passed as a param.)
- **Drafting**: the assigned writer does the actual writing on `subject`, then fires `submit`. It is gated on `$fields.writer.id == $actor.id`, so only the assigned writer can submit.
- **Review**: an editor claims the review, then approves or rejects it. A rejection records the reason and returns the workflow to drafting. The `clear-rejection` entry trigger removes the old reason when the article comes back for another review.
- `approve` writes `approval`, the transition to `published` fires on it, and `published` has no outgoing transitions, so it is terminal.

## Configure the engine

The engine needs a [client](https://www.sanity.io/docs/apis-and-sdks/js-client-getting-started) with [write access](https://www.sanity.io/docs/content-lake/roles-concepts) to the dataset that holds the instances:

The required subject makes this definition require reader model 10. Follow [Upgrade Workflows packages](https://www.sanity.io/docs/workflows/upgrade) to update every runtime sharing the workflow resource before using this acknowledgement.

```typescript
import {createClient} from '@sanity/client'
import {createEngine, ENGINE_API_VERSION} from '@sanity/workflow-engine'
import {editorialReview} from './editorial-review'

const workflowClient = createClient({
  projectId: 'yourprojectid',
  dataset: 'production',          // instances + the articles share one dataset here
  apiVersion: ENGINE_API_VERSION, // satisfies the client here; the engine pins its own traffic to ENGINE_API_VERSION regardless of this value
  token: process.env.SANITY_AUTH_TOKEN, // needs write access
  useCdn: false,
})

export const engine = createEngine({
  client: workflowClient,
  workflowResource: {type: 'dataset', id: 'yourprojectid.production'},
  tag: 'prod',
})

// Deploy the definition once (a setup script or CI step).
await engine.deployDefinitions({
  expectedMinReaderModel: 10,
  definitions: [editorialReview],
})
```

Same `createEngine` as the other recipes, minus `effectHandlers`: this workflow queues no effects.

## Deploy the definition

Deploy the definition with the `sanity-workflows` CLI, configured by a `sanity.workflow.ts` in your working directory. (The `engine.deployDefinitions` call above is the programmatic equivalent for a script or CI step.)

```typescript
// sanity.workflow.ts
import {defineWorkflowConfig} from '@sanity/workflow-engine/define'
import {editorialReview} from './editorial-review'

export default defineWorkflowConfig({
  deployments: [
    {
      name: 'production',
      tag: 'prod', // matches the engine's tag
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: 'yourprojectid.production'},
      definitions: [editorialReview],
    },
  ],
})
```

Log in once, then run the deploy:

```sh
sanity login              # once; in CI, set SANITY_AUTH_TOKEN instead
sanity-workflows deploy   # → editorial-review v1 created
```

This deploys the definition. There are no effect handlers, so this recipe needs no Function. See [Configure and deploy workflow definitions](https://www.sanity.io/docs/workflows/deploy-definitions) for deployment options.

## Run it

Start an instance on an article, then fire each step’s action in turn:

```typescript
import {refDataset} from '@sanity/workflow-engine'
import {engine} from './engine'

// verbs return an OperationResult; the instance document is on .instance
const {instance: wf} = await engine.startInstance({
  definition: 'editorial-review',
  initialFields: [
    {type: 'subject', name: 'subject', value: refDataset({projectId: 'yourprojectid', dataset: 'production', documentId: 'article-1', type: 'article'})},
  ],
})

await engine.fireAction({instanceId: wf._id, activity: 'assign', action: 'take'})    // a writer takes the assignment
// ...the writer drafts the article on `subject`...
await engine.fireAction({instanceId: wf._id, activity: 'write', action: 'submit'})   // writer submits → review
await engine.fireAction({instanceId: wf._id, activity: 'review', action: 'claim'})    // an editor takes the review
await engine.fireAction({instanceId: wf._id, activity: 'review', action: 'approve'})  // → published
```

The `approve` call fires the transition to `published`, which is terminal. A rejection would loop the instance back to drafting instead.

In the Studio these are buttons, and the writing itself happens on the article document between `take` and `submit`. The `clear-rejection` trigger never renders as one, because the engine fires it. Nothing in the definition is tied to that UI.

Run the review in Studio with the Workflows plugin: start it from the article, then use the workflow actions to claim, submit, approve, or reject each step. See [Add Workflows to Sanity Studio](https://www.sanity.io/docs/workflows/studio-plugin).

## Adapting it

- **Editor-assigned instead of writer-claimed**: gate `take` to an editor [role](https://www.sanity.io/docs/user-guides/roles) and pass the writer as a param, so the desk assigns the piece rather than writers picking it up.
- **Add a stage** (copy edit, fact-check, legal) by repeating the review shape: a stage with a `claim` and an approve/reject pair, gated on whoever owns that pass. Some of these stages are near-universal; others are organization-specific.

One active editorial review per article: add a single-subject start requirement. It rejects another unfinished run of this definition for the same resource-qualified subject. See Conditions.

```typescript
start: {
  requirements: [
    {
      type: 'singleSubject',
      name: 'one-open-review',
      title: 'Review already in progress',
    },
  ],
}
```

**Custom start surfaces**: call `evaluateStart` to preview the verdict, then handle `StartNotAllowedError` from `startInstance`.

```typescript
import {refDataset} from '@sanity/workflow-engine'
import {engine} from './engine'

const subject = refDataset({
  projectId: 'yourprojectid',
  dataset: 'production',
  documentId: 'article-1',
  type: 'article',
})
const initialFields = [{type: 'subject' as const, name: 'subject', value: subject}]

const preflight = await engine.evaluateStart({
  definition: 'editorial-review',
  initialFields,
})

if (preflight.allowed) {
  // startInstance checks the requirements again at the commit boundary.
  await engine.startInstance({definition: 'editorial-review', initialFields})
}
```

- **Add a publishing hold**: declare a guard on the stages where publishing should be blocked. See [Guards and enforcement](https://www.sanity.io/docs/workflows/guards).

## Next steps

- [Cookbook](https://www.sanity.io/docs/workflows/cookbook): the other examples and how to run them.
- [Reference](https://www.sanity.io/docs/workflows/reference): the exact shapes of field operations, status, parameters, and field types.
- [Quick start: run your first workflow](https://www.sanity.io/docs/workflows/getting-started): installing the engine and the shortest path to a running workflow.
- [Workflows](https://www.sanity.io/docs/workflows/introduction): the model behind stages, activities, and the reactive session.
- [Test your workflows](https://www.sanity.io/docs/workflows/testing): cover the review loop’s approve and reject paths with the in-memory bench before deploying it.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



