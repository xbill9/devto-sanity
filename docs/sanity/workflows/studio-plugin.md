<!-- Source: https://www.sanity.io/docs/workflows/studio-plugin (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Add Workflows to Sanity Studio

Install the Workflows plugin in a Sanity Studio, bind it to your deployed definitions, and put workflows in front of editors.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



The Workflows Studio plugin connects deployed workflow definitions to Sanity Studio. It adds a workflow strip and a Workflows view to the document editor, and a Workflows tool for tracking work across documents.

This guide starts from a Studio with no workflow UI and ends with an editor starting a workflow on a document. For what editors see and do once it is running, read [Workflows in Sanity Studio](https://www.sanity.io/docs/workflows/studio-user-guide).

Before you start, you need:

- At least one deployed workflow definition, and the tag it was deployed under: see [Configure and deploy workflow definitions](https://www.sanity.io/docs/workflows/deploy-definitions).
- Sanity Studio v6.3.0 or later (v6.x).
- React and React DOM 19.2.7 or later.
- `styled-components` 6.4.2 or later.
- `@sanity/sdk` 3.1 or later in the 3.x line. The plugin requires this dependency directly.
- Node.js 20 or later.

> [!NOTE]
> Only the plugin needs a Studio
> Studio 6 is a major version, so a Studio still on v5 needs that upgrade before the plugin installs, and that upgrade is its own piece of work. The engine, the CLI, the App SDK adapter, and the MCP server have no dependency on Sanity Studio, so you can author, deploy, and drive workflows while the Studio upgrade is still ahead of you. The [quick start](https://www.sanity.io/docs/workflows/getting-started) runs end to end without one.

## Install the packages

Install the packages in an existing Studio v6 project. The plugin reads the definitions you deployed with the workflow CLI.

Install every `@sanity/workflow-*` package at the same version. These packages declare exact peer versions, so include the full runtime stack in your installation.

SDK 3.1.0 can resolve `@sanity/mutate` 0.18.1, which can leave document reads pending with Sanity client 8. Before installing, merge this override into your application’s root package-manager configuration:

**package.json (npm)**

```json
{
  "overrides": {
    "@sanity/sdk": {
      "@sanity/mutate": "0.18.2"
    }
  }
}
```

**pnpm-workspace.yaml (pnpm)**

```yaml
overrides:
  '@sanity/sdk@3>@sanity/mutate': 0.18.2
```

Install the plugin, SDK, and Workflows runtime packages:

**npm**

```shell
npm install @sanity/sdk@^3.1 @sanity/workflow-studio-plugin @sanity/workflow-components @sanity/workflow-diagram @sanity/workflow-engine @sanity/workflow-react @sanity/workflow-sdk @sanity/workflow-studio @sanity/workflow-cli
```

**pnpm**

```shell
pnpm add @sanity/sdk@^3.1 @sanity/workflow-studio-plugin @sanity/workflow-components @sanity/workflow-diagram @sanity/workflow-engine @sanity/workflow-react @sanity/workflow-sdk @sanity/workflow-studio @sanity/workflow-cli
```

**yarn**

```shell
yarn add @sanity/sdk@^3.1 @sanity/workflow-studio-plugin @sanity/workflow-components @sanity/workflow-diagram @sanity/workflow-engine @sanity/workflow-react @sanity/workflow-sdk @sanity/workflow-studio @sanity/workflow-cli
```

**bun**

```shell
bun add @sanity/sdk@^3.1 @sanity/workflow-studio-plugin @sanity/workflow-components @sanity/workflow-diagram @sanity/workflow-engine @sanity/workflow-react @sanity/workflow-sdk @sanity/workflow-studio @sanity/workflow-cli
```

Run `npm ls @sanity/sdk @sanity/mutate` or `pnpm why @sanity/mutate`. Confirm that SDK 3 resolves Mutate 0.18.2; other dependency branches may use different versions. Commit the configuration and updated lockfile.

Keep the override until your SDK release requires Mutate 0.18.2 or later and excludes 0.18.1. After removing it, reinstall and verify the dependency tree again.

## Register the plugin

In `sanity.config.ts`, register the Workflows document view and add the plugin with the tag used to deploy the definitions.

**sanity.config.ts**

```typescript
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {
  workflowDefaultDocumentNode,
  workflowStudioPlugin,
} from '@sanity/workflow-studio-plugin'

export default defineConfig({
  // ...your projectId, dataset, schema...
  plugins: [
    structureTool({
      defaultDocumentNode: workflowDefaultDocumentNode(),
    }),
    workflowStudioPlugin({
      tag: 'production', // must match the deploy tag
    }),
  ],
})
```

`workflowDefaultDocumentNode()` takes no arguments and adds the Workflows view to every document type; the plugin works out at runtime which workflows apply to each one. To place the view yourself instead, append `workflowsView(S)` to that document type's own `views([...])`.

`tag` is the only required option. Add `workflowDataset` when workflow definitions and instances live in a dataset other than the workspace's own; the plugin otherwise reads the workspace dataset. Every plugin option is listed in the [Reference](https://www.sanity.io/docs/workflows/reference).

## Bind workflows to document types

A workflow’s [subject](https://www.sanity.io/docs/workflows/fields) field identifies its primary document and the document types it accepts. The plugin discovers startable workflows whose latest deployed definition has an input-sourced subject matching a schema document type. System types, including the `sanity.` namespace, assets, and engine-owned types, need an explicit mapping row.

A mapping row connects one Studio document type to one deployed workflow definition, replacing what discovery found for that pair. Add a row when you need to:

- Enable `autoStart` for one workflow.
- Bind a definition that uses [doc.ref](https://www.sanity.io/docs/workflows/fields) instead of a first-class subject.
- Customize the label an editor sees, seed the workflow's start values, or bind the workflow to a [Content Release](https://www.sanity.io/docs/user-guides/content-releases) perspective.

**sanity.config.ts**

```typescript
workflowStudioPlugin({
  tag: 'production',
  mappings: [
    {
      docType: 'article',
      definition: 'article-review',
      label: 'Editorial review',
    },
  ],
})
```

Several workflows may target one document type, so the same `docType` can appear on more than one row. Two rows sharing the same `docType` and `definition` are a configuration error: the plugin throws `Duplicate workflow mapping for article::article-review` while `sanity.config.ts` is evaluated, so the Studio does not start.

A row does not have to supply every value a workflow needs in order to start. Required input fields it leaves unset are collected in the start dialog. See [Fields](https://www.sanity.io/docs/workflows/fields) for what a definition can declare and where initial values come from.

For a manual start, `initialStateBuilder` replaces the default subject seed; returning `[]` omits it. Use `contextBuilder` to supply initial `$context`. Neither builder runs during auto-start.

## Start a workflow automatically

Use `autoStart` on a mapping row to start that workflow when an editor creates a document in Studio. Add one row for each workflow that should start this way.

**sanity.config.ts**

```typescript
workflowStudioPlugin({
  tag: 'production',
  mappings: [
    {
      docType: 'article',
      definition: 'article-review',
      label: 'Article review',
      autoStart: true,
    },
  ],
})
```

Auto-start requires an input-sourced document subject and applies only to fresh documents created in Studio:

- The new document becomes the workflow subject in the same draft or [Content Release](https://www.sanity.io/docs/user-guides/content-releases) perspective.
- [Inputs](https://www.sanity.io/docs/workflows/fields) declared `required: true` are collected before the editor enters the form.
- The mapping’s `initialStateBuilder` and `contextBuilder` do not run. Start the workflow manually when it needs values from either builder.
- If several workflows apply, Studio starts them independently and retries only those that failed.
- Writes outside Studio bypass auto-start. It is an integration convenience, not an enforcement boundary.

## Verify it in the document editor

Open a document whose type a deployed workflow accepts. The workflow strip appears above the document form and offers the workflows bound to that type. Start one, then open the Workflows view to see the stage's activities, editable fields, and available actions.

If the strip offers nothing, check three things in order. The plugin's `tag` must match the tag the definitions were deployed under. The definition must be deployed to the dataset the plugin reads, which is `workflowDataset` when you set one and the workspace dataset otherwise. And the definition's subject has to accept this document type, or the type needs a mapping row.

A workflow the plugin rejected still appears, with its start control disabled and a tooltip naming the document type: `Unavailable — this workflow isn’t set up correctly for Article documents`. The reason is deliberately kept out of the tooltip. Find it under **Setup issue** on that workflow's page in the Workflows tool, or in the browser console, where it is prefixed `[workflow-studio-plugin]`. Opening a start dialog re-reads the deployed definitions, so a definition you deploy after the Studio has mounted becomes available without a restart.

Once a workflow is running, a guard that denies publishing, unpublishing, or deleting disables that Studio action and explains the hold. These holds are advisory, and the Content Lake remains the enforcement boundary. See [Guards and enforcement](https://www.sanity.io/docs/workflows/guards).

## Embed tables in a custom Studio tool

Use `RunsTable` for workflow runs and `ForMeTable` for assigned tasks when building a custom Studio tool. Both come from `@sanity/workflow-studio-plugin` and retain the Workflows tool’s document previews, member faces, task hints, and virtualized rows.

Render the tables inside a studio configured with `workflowStudioPlugin`. Give each table a height-constrained container with `overflowY: "auto"` so its rows can scroll.

A run preview is a reduced instance record used in lists. Build table rows from previews with `runRowsOf({previews, definitions, now})`, using a map of deployed definitions by name. Include settled parent previews so a child workflow keeps its root document attribution. Use `forMeTaskRowsOf({rows, who})` to select tasks for an account-global user ID and resolved project role names.

Your tool owns these interactions:

- Load data and render loading, error, and empty states around the table.
- Filter and sort rows before passing them in. `onSort` reports the requested column; it does not reorder rows.
- Control selection, focus, and keyboard navigation. Use `onSelectRun` or `onSelect` for row selection, with `selectedId`, `selectedRef`, and `onNavigateKey` for focus and navigation.
- Reset the scroll position when the scope or sort order changes, and update `now` to refresh timestamps.

For controls outside Studio, use [Reusable UI components](https://www.sanity.io/docs/workflows/ui-components). The Studio tables depend on Studio providers.

## Next steps

- [Workflows in Sanity Studio](https://www.sanity.io/docs/workflows/studio-user-guide): what editors see and how they move work forward.
- [Effects and runtimes](https://www.sanity.io/docs/workflows/effects-and-runtimes): Studio advances workflows only while an editor is present, so a queued effect or a deadline needs a server runtime. [Run Workflows with Sanity Functions](https://www.sanity.io/docs/workflows/sanity-functions) is the deployment most Studio setups use.
- [Choose your surface](https://www.sanity.io/docs/workflows/introduction): every package that can drive a workflow, and when to reach for each.
- [Create a workflow-powered Document Action](https://www.sanity.io/docs/workflows/custom-studio-integrations): build your own workflow controls inside Studio with the Studio adapter.
- [Reference](https://www.sanity.io/docs/workflows/reference): every plugin option and mapping field, with types and defaults.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



