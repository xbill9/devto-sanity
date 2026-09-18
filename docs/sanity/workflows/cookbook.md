<!-- Source: https://www.sanity.io/docs/workflows/cookbook (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Cookbook

Worked, runnable workflow examples for Sanity: editorial review, AI content pipelines, coordinated releases, and more, each a complete definition.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



The examples run from the smallest useful review to a coordinated multi-document [release](https://www.sanity.io/docs/user-guides/content-releases). Between them they cover the constructs you reach for most often:

- Every example is built from stages, transitions, and the actions that do the work.
- Review loops send rejected work back to drafting, and claims let a writer take the open commission.
- Triggers fire the effects that generate [drafts](https://www.sanity.io/docs/content-lake/drafts) and run the checks.
- Conditions route work to a human only when a check fails.
- Subworkflows give each [document](https://www.sanity.io/docs/content-lake/documents) in a release its own review.
- Guards coordinate a document lock across engine-mediated workflow surfaces until its review approves. [Content Lake enforcement](https://www.sanity.io/docs/content-lake/documents) for deployed guards has not shipped.

## Editorial review

One article from assignment to publish, gated by a single editor.

1. **Assignment**: a writer takes the open commission.
2. **Drafting**: the assigned writer writes, then submits for review.
3. **Review**: a desk editor approves it, or sends it back with a reason. Rejection loops to drafting.
4. **Published**: terminal.

This is the loop the other examples build on, so read it first.

→ [Cookbook: Editorial review](https://www.sanity.io/docs/workflows/cookbook-editorial-review)

## AI content pipeline

An agent drafts, automated checks run, and a person steps in only when a check flags the piece.

1. **Drafting**: an AI effect generates the draft.
2. **Checks**: automated effects score it (brand voice, SEO, links, facts) and flag what fails.
3. **Verification**: opens only for flagged pieces. Clean ones skip straight to publishing.
4. **Publishing**: triggers publish the document, then queue a notification.
5. **Published**: terminal.

→ [Cookbook: AI content pipeline](https://www.sanity.io/docs/workflows/cookbook-ai-content-pipeline)

## Coordinated release

Many documents reviewed and published together as one Content Release.

1. **Assembly**: documents are grouped into a named release; each gets its own review subworkflow, and a guard coordinates the publish hold across engine-mediated workflow surfaces until that review approves.
2. **Scheduled**: once every document is approved, the release is [scheduled](https://www.sanity.io/docs/user-guides/content-releases) for an embargoed go-live (or published on demand).
3. **Published**: the release publishes as one unit; effects fire the build and notifications.
4. **Archived**: terminal, with revert as the rollback.

→ [Cookbook: Coordinated release](https://www.sanity.io/docs/workflows/cookbook-coordinated-release)

## Handle workflows when referenced content is deleted

Choose what happens to in-flight workflow instances when referenced content is deleted. A document-delete Function finds affected runs with `instancesForDocument` and can retain them or abort them through the engine without deleting their audit records.

→ [Cookbook: Handle workflows when referenced content is deleted](https://www.sanity.io/docs/workflows/cookbook-handle-deleted-subject)

## Running a workflow

A definition on its own does nothing. To run it, you connect a runtime: whatever calls the engine when a person acts or content changes. Most deployments use two surfaces, and add more as needed.

Use the Studio plugin for the ready-made human interface, or the Studio/App SDK adapters when building a custom workflow UI.

Use the [Sanity Functions integration](https://www.sanity.io/docs/workflows/sanity-functions) for autonomous execution. A typical deployment combines three jobs:

- Use Document Functions to start instances, reevaluate existing instances, or fire named actions after the exact relevant content change.
- Use a separate Document Function with a pending-effect delta filter to call `drainEffects()` when unclaimed work appears.
- Use a Scheduled Function to tick in-flight instances for time-based conditions. It can also make an effect available again when its previous handler stopped before recording an outcome.

Any service that can call the engine may drive a workflow. Choose one owner for each trigger source and make repeated delivery safe.

## How much to enforce

Choose the mechanism that matches the guarantee you need. Engine verdicts and guards coordinate cooperative editors and explain themselves. Dataset access control is the only one of the three the Content Lake evaluates against every writer. [Actors, tokens, and what’s actually enforced](https://www.sanity.io/docs/workflows/actors-and-enforcement) compares all three and says which one holds, and [Guards and enforcement](https://www.sanity.io/docs/workflows/guards) has the guard declaration.

The editorial example relies on advisory workflow guidance. The coordinated release combines role-based access, guards that coordinate its engine-mediated document paths, and Content Lake access control on the release.

## Tags and client factories

Two pieces of plumbing show up in every real deployment.

Use a distinct tag for each environment so definitions and instances from production, staging, and local development remain separate.

Use `resourceClients` when workflow data and governed content need different clients, or when runtime-supplied references may target another resource. See [Global document references](https://www.sanity.io/docs/workflows/global-document-references) for routing and admission rules.

Resource aliases keep definitions portable: reference a named resource in the definition, then bind that alias to the appropriate project and dataset in each deployment.

Every `@content:` reference expands to a physical global document reference (GDR) at deploy, so moving between environments means deploying the same source with a different map. Bare IDs and physical GDRs are unchanged.

This is the deploy-time sibling of `resourceClients`, which routes reads at runtime.

The same definitions deploy under each tag, with the alias bound to that environment’s dataset:

This configuration uses the `articleReview` definition from [Test your workflows](https://www.sanity.io/docs/workflows/testing). Its required subject needs reader model 10 in each environment. Follow [Upgrade Workflows packages](https://www.sanity.io/docs/workflows/upgrade) before using this acknowledgement.

```typescript
// sanity.workflow.ts
import {defineWorkflowConfig} from '@sanity/workflow-engine/define'

import {articleReview} from './article-review'

export default defineWorkflowConfig({
  deployments: [
    {
      name: 'production',
      tag: 'prod',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: 'yourprojectid.workflows'},
      resourceAliases: [{name: 'content', resource: {type: 'dataset', id: 'yourprojectid.production'}}],
      definitions: [articleReview],
    },
    {
      name: 'staging',
      tag: 'staging',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: 'yourprojectid.workflows-staging'},
      resourceAliases: [{name: 'content', resource: {type: 'dataset', id: 'yourprojectid.staging'}}],
      definitions: [articleReview],
    },
  ],
})
```

## Next steps

- [Quick start: run your first workflow](https://www.sanity.io/docs/workflows/getting-started) walks the shortest path from nothing to a running workflow.
- [Workflows](https://www.sanity.io/docs/workflows/introduction) explains the model behind the workflow definition language.
- [Reference](https://www.sanity.io/docs/workflows/reference) has every construct and verb, with exact shapes.
- [Test your workflows](https://www.sanity.io/docs/workflows/testing) shows how to cover a recipe’s paths with the in-memory bench before deploying it.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



