<!-- Source: https://www.sanity.io/docs/workflows/deploy-definitions (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Configure and deploy workflow definitions

Install and authenticate the workflow CLI, write the sanity.workflow.ts config that binds your definitions to a Sanity resource, and deploy them to one environment or several.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



Use `@sanity/workflow-cli` to store workflow definitions in the Content Lake. It reads `sanity.workflow.ts` from the current directory, validates the definitions, checks referenced project roles during deployment, and writes valid definitions to the configured workflow resource. It ships as the `sanity-workflows` binary. A workflow engine runs the deployed definitions.

This guide installs and authenticates the CLI, writes the config that binds your definitions to a resource, and deploys them to one environment and then to several. For what each command and flag does once you are set up, see the [Workflow CLI command reference](https://www.sanity.io/docs/workflows/cli-reference).

Before you start, you need:

- Node.js 20.12 or later.
- `@sanity/workflow-cli` 0.33.0 and matching versions of `@sanity/workflow-engine` and `@sanity/workflow-blueprint`.
- At least one workflow definition authored with `defineWorkflow`. See [Definitions, instances, and stages](https://www.sanity.io/docs/workflows/definitions-and-instances), or work through the [quick start](https://www.sanity.io/docs/workflows/getting-started) first.
- A Sanity project, and a dataset for the engine to keep its own documents in. That can be the dataset your content lives in or a separate one.
- A Sanity login session, or a token with the editor role. The next section covers both.

If your definitions reference project roles, the deployment identity must also be able to read that project's role catalog and member directory. Create the referenced roles in the project before deployment.

## Install and authenticate the CLI

The CLI ships as `@sanity/workflow-cli` with a single binary named `sanity-workflows`. Run it with `npx` rather than installing it globally. `npx` uses the copy in your project when there is one, so adding it as a development dependency is how you pin the version a team and a CI job share.

**npm**

```shell
# Inspect the published CLI version
npx @sanity/workflow-cli --version

# Pin matching packages for this project
npm install --save-dev @sanity/workflow-cli@0.33.0 \
  @sanity/workflow-engine@0.33.0 @sanity/workflow-blueprint@0.33.0
```

**pnpm**

```shell
# Inspect the published CLI version
pnpm dlx @sanity/workflow-cli --version

# Pin matching packages for this project
pnpm add --save-dev @sanity/workflow-cli@0.33.0 \
  @sanity/workflow-engine@0.33.0 @sanity/workflow-blueprint@0.33.0
```

**yarn**

```shell
# Inspect the published CLI version
yarn dlx @sanity/workflow-cli --version

# Pin matching packages for this project
yarn add --dev @sanity/workflow-cli@0.33.0 \
  @sanity/workflow-engine@0.33.0 @sanity/workflow-blueprint@0.33.0
```

**bun**

```shell
# Inspect the published CLI version
bunx @sanity/workflow-cli --version

# Pin matching packages for this project
bun add --dev @sanity/workflow-cli@0.33.0 \
  @sanity/workflow-engine@0.33.0 @sanity/workflow-blueprint@0.33.0
```

Install the engine and Blueprint packages alongside the CLI. The CLI declares both as exact peers, and all three release at the same version. Your config imports `defineWorkflowConfig` from the engine; the CLI uses the Blueprint package to load config and generate runtimes.

Authenticate once with the Sanity CLI. Every workflow command reuses that session.

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

In CI there is no session to read, so set `SANITY_AUTH_TOKEN` instead. An explicit `SANITY_AUTH_TOKEN` always wins over a login session, which also makes it the way to run a one-off command as a different identity. Anything that writes needs an [editor-role](https://www.sanity.io/docs/user-guides/roles) [token](https://www.sanity.io/docs/content-lake/http-auth). Never commit it: read it from the secret store of your CI provider and pass it through the environment.

**.github/workflows/deploy-workflows.yml**

```yaml
- name: Deploy workflow definitions
  run: npx @sanity/workflow-cli deploy --deployment production
  env:
    SANITY_AUTH_TOKEN: ${{ secrets.SANITY_AUTH_TOKEN }}
```

> [!WARNING]
> Scope the token to every resource, not one
> The token has to reach every [resource](https://www.sanity.io/docs/studio/global-document-reference-type) the workflow references, not only the one the workflow data lives in. A definition whose subject or reference fields point into other [datasets](https://www.sanity.io/docs/content-lake/datasets), a [canvas](https://www.sanity.io/docs/canvas/introduction-to-canvas), or a [media library](https://www.sanity.io/docs/media-library/introduction) is read through sibling clients derived from that same token. A `sanity login` session or an organization-scoped token covers this. A token scoped to a single project deploys successfully and then fails later on a cross-resource read, which is a confusing place to discover it.

One more environment variable exists: `SANITY_API_HOST` overrides the API host the CLI talks to. Leave it unset unless you have been told to point at a non-production API.

## Write the workflow config

Every workflow command reads a `sanity.workflow.ts` from the directory you run it from. The file default-exports a config built with `defineWorkflowConfig`, declaring one deployment per environment you ship to. TypeScript configs are transpiled on the fly, so there is no build step, and a `sanity.workflow.js` or `sanity.workflow.mjs` works the same way.

This config deploys one definition to one resource. The example acknowledges reader model `10`, required by definitions with required content-reference fields. Before using that value with existing workflow data, follow [Upgrade Workflows packages](https://www.sanity.io/docs/workflows/upgrade) and verify every runtime sharing the resource can read model `10`:

**sanity.workflow.ts**

```typescript
import type {WorkflowDeploymentInput} from '@sanity/workflow-engine'
import {defineWorkflowConfig} from '@sanity/workflow-engine/define'

import {articleReview} from './src/workflows.ts'

export const production = {
  name: 'production',
  tag: 'prod',
  expectedMinReaderModel: 10,
  workflowResource: {type: 'dataset', id: 'YOUR_PROJECT_ID.production'},
  definitions: [articleReview],
} satisfies WorkflowDeploymentInput

export default defineWorkflowConfig({deployments: [production]})
```

The named `production` export also supports [experimental runtime generation](https://www.sanity.io/docs/workflows/sanity-functions). Generated functions import each deployment by its `name`. Keep the authored deployment object available under that export.

Replace `YOUR_PROJECT_ID` with your project ID. A dataset resource ID is always `<projectId>.<dataset>`. Anything else fails at load with `invalid dataset resource id — expected "<projectId>.<dataset>"`.

Four keys carry the setup. `name` is the CLI identity of the deployment, the one `--deployment` matches. `tag` is the environment partition its stored definitions and instances are scoped to. `workflowResource` is the Sanity resource that holds those documents. `resourceAliases` binds the content a definition acts on, and you can leave it out when that content already lives in the `workflowResource`. [Deployments, tags, and resources](https://www.sanity.io/docs/workflows/deployments-and-resources) has the full field reference and the model behind it.

An invalid config fails with a clean, path-prefixed error before the command runs. Getting `expectedMinReaderModel` wrong is the one failure worth recognizing on sight: omit it and deploy stops with `Reader-floor acknowledgement:` and the model your definitions actually need. Keep it a reviewed literal, and read [Upgrade Workflows packages](https://www.sanity.io/docs/workflows/upgrade) before changing it.

### Run the same workflow in more than one place

Running the same definitions in staging and production is a second entry in `deployments`: one `definitions` list, a different `name`, `tag`, and alias binding per environment. Make sure the `workflowResource` and `tag` pair differs between them, either by pointing them at different datasets or by keeping one dataset and giving them different tags.

**sanity.workflow.ts**

```typescript
import {defineWorkflowConfig} from '@sanity/workflow-engine/define'

import {articleReview} from './src/workflows.ts'

export default defineWorkflowConfig({
  deployments: [
    {
      name: 'staging',
      tag: 'staging',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: 'YOUR_PROJECT_ID.workflows-staging'},
      resourceAliases: [
        {name: 'content', resource: {type: 'dataset', id: 'YOUR_PROJECT_ID.staging'}},
      ],
      definitions: [articleReview],
    },
    {
      name: 'production',
      tag: 'prod',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: 'YOUR_PROJECT_ID.workflows'},
      resourceAliases: [
        {name: 'content', resource: {type: 'dataset', id: 'YOUR_PROJECT_ID.production'}},
      ],
      definitions: [articleReview],
    },
  ],
})
```

This config keeps engine documents out of the content datasets, which is why each deployment binds a `content` alias to the dataset its articles actually live in. The two environments stay independent because their `workflowResource` and `tag` pairs differ, which is explained in [Deployments, tags, and resources](https://www.sanity.io/docs/workflows/deployments-and-resources).

Once the config declares more than one deployment, commands stop guessing which one you mean. An interactive terminal prompts you to choose, and a non-interactive shell fails with `Multiple deployments configured — pass --deployment or --tag`. Name the target explicitly in CI. See [Select a deployment, a tag, or an instance](https://www.sanity.io/docs/workflows/cli-reference) for what each selector means on each command.

## Deploy

Deploying has three gears, and running them in order turns most deploy failures into local ones. `--check` validates your definitions and stops: it never contacts the dataset and never resolves a token, so it runs offline and belongs in a pre-commit hook or a pull request check. `--dry-run` adds a colored diff against what is already deployed, and still writes nothing. Not both at once: passing both fails with `Pass either --check or --dry-run, not both.`

Deployment checks referenced role names against the project’s role catalog. An unknown role stops the deployment with the definition name and field path. A known role with no current human member produces a warning. Neither `--check` nor `--dry-run` performs this directory check.

**npm**

```shell
# Offline: does every definition still validate?
npx @sanity/workflow-cli deploy --check --deployment production

# Online, read-only: what would change?
npx @sanity/workflow-cli deploy --dry-run --deployment production

# Write it
npx @sanity/workflow-cli deploy --deployment production
```

**pnpm**

```shell
# Offline: does every definition still validate?
pnpm dlx @sanity/workflow-cli deploy --check --deployment production

# Online, read-only: what would change?
pnpm dlx @sanity/workflow-cli deploy --dry-run --deployment production

# Write it
pnpm dlx @sanity/workflow-cli deploy --deployment production
```

**yarn**

```shell
# Offline: does every definition still validate?
yarn dlx @sanity/workflow-cli deploy --check --deployment production

# Online, read-only: what would change?
yarn dlx @sanity/workflow-cli deploy --dry-run --deployment production

# Write it
yarn dlx @sanity/workflow-cli deploy --deployment production
```

**bun**

```shell
# Offline: does every definition still validate?
bunx @sanity/workflow-cli deploy --check --deployment production

# Online, read-only: what would change?
bunx @sanity/workflow-cli deploy --dry-run --deployment production

# Write it
bunx @sanity/workflow-cli deploy --deployment production
```

To narrow a run to one definition, add `--only <name>`. If you change a definition, run the deploy command again. Re-running is safe: a version comes from the content of the definition, so a deploy that changes nothing writes nothing.

Before deploying definitions that require a newer reader model, complete the [package rollout](https://www.sanity.io/docs/workflows/upgrade). An unchanged deployment does not rewrite the stored definition's model stamps. After deploying changed definition content, inspect the latest stored version:

**npm**

```shell
npx @sanity/workflow-cli definition show article-review --tag prod --json
```

**pnpm**

```shell
pnpm dlx @sanity/workflow-cli definition show article-review --tag prod --json
```

**yarn**

```shell
yarn dlx @sanity/workflow-cli definition show article-review --tag prod --json
```

**bun**

```shell
bunx @sanity/workflow-cli definition show article-review --tag prod --json
```

Replace `article-review` and `prod` with your definition name and tag. Check `version`, `modelVersion`, and `minReaderModel` in the returned JSON. New writes use `modelVersion: 10`. A definition with required content-reference fields also needs `minReaderModel: 10`; a definition without them can keep a lower floor. Existing instances keep the definition version they started with.

**npm**

```shell
# One environment at a time, which is what a promotion pipeline wants
npx @sanity/workflow-cli deploy --deployment staging
npx @sanity/workflow-cli deploy --deployment production

# Or every deployment in the config, in one run
npx @sanity/workflow-cli deploy --all-tags
```

**pnpm**

```shell
# One environment at a time, which is what a promotion pipeline wants
pnpm dlx @sanity/workflow-cli deploy --deployment staging
pnpm dlx @sanity/workflow-cli deploy --deployment production

# Or every deployment in the config, in one run
pnpm dlx @sanity/workflow-cli deploy --all-tags
```

**yarn**

```shell
# One environment at a time, which is what a promotion pipeline wants
yarn dlx @sanity/workflow-cli deploy --deployment staging
yarn dlx @sanity/workflow-cli deploy --deployment production

# Or every deployment in the config, in one run
yarn dlx @sanity/workflow-cli deploy --all-tags
```

**bun**

```shell
# One environment at a time, which is what a promotion pipeline wants
bunx @sanity/workflow-cli deploy --deployment staging
bunx @sanity/workflow-cli deploy --deployment production

# Or every deployment in the config, in one run
bunx @sanity/workflow-cli deploy --all-tags
```

`--all-tags` is deliberately explicit: deploying everything is never the default. A failing deployment does not stop the others. Fix the cause and re-run; see [Exit codes](https://www.sanity.io/docs/workflows/cli-reference) for how a multi-target run reports and exits.

Deploying puts the definition in the Content Lake. It does not make anything run. Nothing advances a workflow until your code calls the engine, so decide what your runtime is before you rely on deadlines or queued effects firing. See [Run Workflows with Sanity Functions](https://www.sanity.io/docs/workflows/sanity-functions).

### Definition sharing

Definitions are shared with Sanity by default when a deploy creates a new version. Pass `--no-share-defs` to opt out for one invocation. A failed share warns but does not fail the deploy.

## Next steps

- [Workflow CLI command reference](https://www.sanity.io/docs/workflows/cli-reference) covers every command, flag, selector, and exit code.
- [Deployments, tags, and resources](https://www.sanity.io/docs/workflows/deployments-and-resources) explains name against tag, the storage partition that keeps environments apart, and how resource aliases resolve.
- [Test a workflow before you deploy it](https://www.sanity.io/docs/workflows/testing) runs a definition against an in-memory bench, with no dataset involved.
- [Run Workflows with Sanity Functions](https://www.sanity.io/docs/workflows/sanity-functions) is what makes deadlines fire and queued effects drain once nobody is at a terminal.
- [How early access works](https://www.sanity.io/docs/workflows/prerelease) explains the version policy and the stored-data contract behind `expectedMinReaderModel`.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



