<!-- Source: https://www.sanity.io/docs/workflows/getting-started (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Quick start: run your first workflow

Define your first workflow in TypeScript, deploy it, and move a Sanity document through its stages.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



Sanity Workflows moves a document through named stages under rules you deploy. You author a **definition** that names the stages, the work inside each one, and the conditions for moving between them. Deploying the definition makes it available to run. Starting an **instance** runs it against one document.

This quick start deploys a three-stage article review, starts an instance against a document in your dataset, and moves that instance to its final stage. Every step runs from a terminal with the Workflows CLI. No Sanity Studio is involved.

You need:

- Node.js 20.12 or later.
- A Sanity project and a dataset you can write to.
- One published document in that dataset for the workflow to act on. Note its `_id` and its `_type`.

## Step 1: Install the packages

Use Workflows 0.33.0 or later for this quick start. `@sanity/workflow-engine` provides the definition language and runtime. `@sanity/workflow-cli` deploys definitions and drives instances from a terminal. Install both at the same version:

**npm**

```shell
npm install @sanity/workflow-engine @sanity/workflow-cli
```

**pnpm**

```shell
pnpm add @sanity/workflow-engine @sanity/workflow-cli
```

**yarn**

```shell
yarn add @sanity/workflow-engine @sanity/workflow-cli
```

**bun**

```shell
bun add @sanity/workflow-engine @sanity/workflow-cli
```

The CLI reads the token from your Sanity login session. Log in once:

**npm**

```shell
npx sanity@latest login
```

**pnpm**

```shell
pnpm dlx sanity@latest login
```

**yarn**

```shell
yarn dlx sanity@latest login
```

**bun**

```shell
bunx sanity@latest login
```

In CI, set `SANITY_AUTH_TOKEN` instead of logging in. With neither, the CLI stops before it writes anything and reports `No Sanity token found — run `sanity login`, or set SANITY_AUTH_TOKEN.`

## Step 2: Define a three-stage workflow

A definition names the stages a document passes through, the activities inside each stage, and the transitions that move an instance onward. Create `workflows/article-review.ts` with three stages: `drafting`, `review`, and `approved`.

**workflows/article-review.ts**

```typescript
import {
  defineAction,
  defineActivity,
  defineField,
  defineStage,
  defineTransition,
  defineWorkflow,
} from '@sanity/workflow-engine/define'

export const articleReview = defineWorkflow({
  name: 'article-review',
  title: 'Article review',
  description: 'Takes one article from drafting, through an editor review, to approved.',
  initialStage: 'drafting',
  fields: [
    defineField({
      type: 'subject',
      name: 'subject',
      title: 'Article',
      required: true,
      description: 'The document this instance moves through the stages.',
      initialValue: {type: 'input'},
    }),
  ],
  stages: [
    defineStage({
      name: 'drafting',
      title: 'Drafting',
      description: 'The writer is working on the article.',
      activities: [
        defineActivity({
          name: 'write',
          title: 'Write the article',
          actions: [
            defineAction({
              name: 'submit',
              title: 'Submit for review',
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [defineTransition({name: 'to-review', title: 'Send to review', to: 'review'})],
    }),
    defineStage({
      name: 'review',
      title: 'Editorial review',
      description: 'An editor reads the article and approves it.',
      activities: [
        defineActivity({
          name: 'sign-off',
          title: 'Review the article',
          actions: [
            defineAction({
              name: 'approve',
              title: 'Approve',
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'to-approved', title: 'Approve and finish', to: 'approved'}),
      ],
    }),
    defineStage({
      name: 'approved',
      title: 'Approved',
      description: 'The article is approved. Nothing more to do here.',
    }),
  ],
})
```

The `subject` field identifies the document the instance is about. `initialValue: {type: 'input'}` means you supply that document when you start the instance. `required: true` rejects a start that omits the reference. It also blocks actions and transitions if the selected document becomes unavailable while the workflow runs.

Each non-terminal stage holds one activity with one action. Firing the action resolves its activity, because the action declares `status: 'done'`.

Neither transition declares a `when` condition, so each takes the default `$allActivitiesDone`: the instance leaves the stage once every activity in that stage resolves. `approved` declares no transitions at all, which makes it terminal.

## Step 3: Configure and deploy the definition

The Workflows CLI reads a `sanity.workflow.ts` from the directory you run it in. That file binds your definitions to a deployment: a name, an environment tag, and the dataset the engine writes its own documents to. Create it beside your `workflows/` directory.

**sanity.workflow.ts**

```typescript
import {defineWorkflowConfig} from '@sanity/workflow-engine/define'

import {articleReview} from './workflows/article-review'

export default defineWorkflowConfig({
  deployments: [
    {
      name: 'dev',
      tag: 'dev',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: 'PROJECT_ID.DATASET_NAME'},
      definitions: [articleReview],
    },
  ],
})
```

Replace `PROJECT_ID` with your Sanity project ID and `DATASET_NAME` with the dataset. `name` identifies this deployment when a config holds more than one. `tag` is the environment partition the engine scopes its documents to.

`expectedMinReaderModel` states the stored-data model every runtime sharing this workflow resource supports. This definition needs model 10 because its subject is required. If other runtimes use the resource, complete the [reader upgrade](https://www.sanity.io/docs/workflows/upgrade) before acknowledging model 10.

Deploy the definition:

**npm**

```shell
npx sanity-workflows deploy
```

**pnpm**

```shell
pnpm dlx sanity-workflows deploy
```

**yarn**

```shell
yarn dlx sanity-workflows deploy
```

**bun**

```shell
bunx sanity-workflows deploy
```

The CLI validates every definition before it writes anything, then reports what it created. `npx sanity-workflows deploy --check` validates without contacting the dataset, and `--dry-run` diffs against what is already deployed. Every command also resolves under its canonical `workflows` topic, so `npx sanity-workflows workflows deploy` does the same thing.

> [!NOTE]
> Share your definitions!
> During early access, we strongly encourage you to leave definition sharing enabled when deploying. Your definitions show us the domains and problems Workflows must support, helping us improve the product.
> Sharing is optional. See [Definition sharing](https://www.sanity.io/docs/workflows/deploy-definitions) for the opt-out control.



## Step 4: Start an instance

An instance is one live run of a definition against content. Starting one pins the definition version it runs under and freezes a snapshot of it, so deploying a change later does not alter an instance already in flight. Supply the document through the `subject` field the definition declared as an input.

**npm**

```shell
npx sanity-workflows start article-review \
  --field subject='{"id":"dataset:PROJECT_ID:DATASET_NAME:DOCUMENT_ID","type":"DOCUMENT_TYPE"}'
```

**pnpm**

```shell
pnpm dlx sanity-workflows start article-review \
  --field subject='{"id":"dataset:PROJECT_ID:DATASET_NAME:DOCUMENT_ID","type":"DOCUMENT_TYPE"}'
```

**yarn**

```shell
yarn dlx sanity-workflows start article-review \
  --field subject='{"id":"dataset:PROJECT_ID:DATASET_NAME:DOCUMENT_ID","type":"DOCUMENT_TYPE"}'
```

**bun**

```shell
bunx sanity-workflows start article-review \
  --field subject='{"id":"dataset:PROJECT_ID:DATASET_NAME:DOCUMENT_ID","type":"DOCUMENT_TYPE"}'
```

`dataset:PROJECT_ID:DATASET_NAME:DOCUMENT_ID` is a global document reference: the scheme, your project ID, your dataset, and the document `_id`. `DOCUMENT_TYPE` is that document’s `_type`. The command prints the instance id and the stage the instance landed in:

**CLI**

```text
Started dev.wf-instance.a1b2c3d4e5f6 — now at drafting
```

Keep that id. Every command in the next step takes it. Pass the published document `_id`, not a draft or release version id: a versioned id is rejected before the instance is created, with `Invalid GDR "…": dataset document ID "drafts.article-1" identifies a stored draft or release version.`

## Step 5: Move the document through the stages

Moving an instance means firing the actions that resolve its activities. The `article-review` definition has one action per non-terminal stage. Fire the first to resolve `write` in `drafting`:

**npm**

```shell
npx sanity-workflows fire-action INSTANCE_ID --activity write --action submit
```

**pnpm**

```shell
pnpm dlx sanity-workflows fire-action INSTANCE_ID --activity write --action submit
```

**yarn**

```shell
yarn dlx sanity-workflows fire-action INSTANCE_ID --activity write --action submit
```

**bun**

```shell
bunx sanity-workflows fire-action INSTANCE_ID --activity write --action submit
```

Replace `INSTANCE_ID` with the id the start command printed. Resolving `write` satisfies the stage’s only activity, so the `to-review` transition fires inside the same call and the instance is in `review` before the command returns. That chain of transitions inside one call is the cascade. Fire the second action:

**npm**

```shell
npx sanity-workflows fire-action INSTANCE_ID --activity sign-off --action approve
```

**pnpm**

```shell
pnpm dlx sanity-workflows fire-action INSTANCE_ID --activity sign-off --action approve
```

**yarn**

```shell
yarn dlx sanity-workflows fire-action INSTANCE_ID --activity sign-off --action approve
```

**bun**

```shell
bunx sanity-workflows fire-action INSTANCE_ID --activity sign-off --action approve
```

Confirm where the instance ended up:

**npm**

```shell
npx sanity-workflows show INSTANCE_ID
```

**pnpm**

```shell
pnpm dlx sanity-workflows show INSTANCE_ID
```

**yarn**

```shell
yarn dlx sanity-workflows show INSTANCE_ID
```

**bun**

```shell
bunx sanity-workflows show INSTANCE_ID
```

`show` prints the state, activities, and effects of the instance. The instance is in `approved` and complete: `approved` declares no transitions, so nothing can move it further. To see what can be fired on an instance at any point, run `npx sanity-workflows fire-action INSTANCE_ID` with no `--action`.

## What just moved this workflow, and what will in production

Every move in this quick start had you as its runtime. `start` and each `fire-action` started a process, ran the engine inside it, committed one change to the Content Lake, and exited. The cascade in step 5, where firing `submit` also moved the instance into `review`, ran inside that one `fire-action` call. The engine is a library, not a service: it acts only when your code calls it, and none of it is running now that those commands have returned.

Production needs a caller for the moves nobody is at a terminal for. A transition whose condition reads the clock does not fire when the deadline passes; something has to call `tick` after the clock crosses it. An effect the workflow queues stays queued until a drainer picks it up. Both are jobs for a process that runs on a schedule and on content changes, and in a Sanity project that process is usually a [Sanity Function](https://www.sanity.io/docs/workflows/sanity-functions).

## Next steps

- [Put these workflows in front of editors in Sanity Studio](https://www.sanity.io/docs/workflows/studio-plugin)
- [See a complete workflow with approval data, change requests, and a review loop](https://www.sanity.io/docs/workflows/cookbook-editorial-review)
- [Prove a definition’s paths in memory before you deploy it](https://www.sanity.io/docs/workflows/testing)
- [Run the same definition in more than one environment](https://www.sanity.io/docs/workflows/deploy-definitions)

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



