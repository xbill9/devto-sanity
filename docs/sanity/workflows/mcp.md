<!-- Source: https://www.sanity.io/docs/workflows/mcp (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Connect an agent over MCP

Install and authenticate the Workflows MCP server, register it with your agent, address a workflow environment, and see which tools change state.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



`@sanity/workflow-mcp` is an MCP server that exposes your workflows as tools an agent can call. It does two jobs: operate workflows (list what’s deployed and what’s running, inspect and diagnose an instance, start runs and fire actions to move work forward) and author new ones (the agent reads the DSL guide, validates what it wrote, and deploys it into an environment you name). It ships as the `workflow-mcp` binary. The server is standalone during early access and may eventually be folded into the [Sanity MCP](https://www.sanity.io/docs/ai/mcp-server).

In this guide, you’ll connect an AI agent (Claude Code, Claude Desktop, Cursor, or anything else that speaks MCP) to your Workflows setup: install the server, authenticate it, and see how the agent addresses your workflow environments. For the `sanity.workflow.ts` configuration and CLI-driven deploys, see [Configure and deploy workflow definitions](https://www.sanity.io/docs/workflows/deploy-definitions). The MCP server addresses the workflow environments configured there, and can deploy definitions into them itself.

> [!NOTE]
> Public package
> `@sanity/workflow-mcp` is published publicly on npm; installing it needs no `@sanity` org membership.

## Install the server

The server runs over stdio, so your MCP client launches it. You do not start it yourself. Install the package globally so clients can spawn the `workflow-mcp` binary:

**npm**

```shell
npm install -g @sanity/workflow-mcp @sanity/workflow-engine
```

**pnpm**

```shell
pnpm add -g @sanity/workflow-mcp @sanity/workflow-engine
```

**yarn**

```shell
yarn global add @sanity/workflow-mcp @sanity/workflow-engine
```

**bun**

```shell
bun add -g @sanity/workflow-mcp @sanity/workflow-engine
```

Install both packages from the same Workflows release.

npm 7+ and pnpm install peer dependencies automatically. A strict peer installer must add `@modelcontextprotocol/sdk` and `zod` alongside `@sanity/workflow-mcp`, including when it runs the bundled binary.

A client can also spawn the server without an install:

**npm**

```shell
npx -y @sanity/workflow-mcp
```

**pnpm**

```shell
pnpm dlx -y @sanity/workflow-mcp
```

**yarn**

```shell
yarn dlx -y @sanity/workflow-mcp
```

**bun**

```shell
bunx -y @sanity/workflow-mcp
```

This resolves the version when the client boots the server, so a session can quietly pick up a new release. Pinning a version in the command trades that risk for a pin that goes stale instead.

## Authentication

Boot configuration is two environment variables:

#### Properties

**SANITY_AUTH_TOKEN** (string, required)

An org-level token. The server refuses to start without it.

**SANITY_API_HOST** (string)

The API host. Defaults to https://api.sanity.io.

The server also emits adoption telemetry, following your account’s [telemetry consent](https://www.sanity.io/docs/cli-reference/telemetry). Each tool invocation logs a “Workflows MCP Tool Called” event carrying only the tool name, a success flag, and whether a list cursor was used. It never carries tool arguments, cursor values, or results. Set `DO_NOT_TRACK=1` in the server’s environment to opt out.

The server authenticates at the organization level, on the same model as the Sanity MCP: authentication says who may act, and each tool call says where. What the agent can actually touch is decided by the token’s access in [Content Lake](https://www.sanity.io/docs/content-lake), per call.

> [!WARNING]
> Authentication
> The server authenticates with the token supplied in its environment. Scope that token to the required resources and permissions; do not give the agent broader access than it needs.

Workflow history records actions as the identity behind the token (the engine resolves it through `/users/me`), and every entry carries an advisory execution-context stamp (kind `mcp`, id `workflow-mcp`) marking that the action came through this server. The token both authorizes and identifies the actor, so it cannot tell the human driving the agent apart from the token’s own identity. A trigger that cascades during one of the agent’s writes also runs under this token. History marks those entries as triggered, so you can still tell automation apart from the actions the agent fired.

## Register with your MCP client

Everything is configured through the client’s server registration. Claude Code registers the server with one command. Claude Desktop, Cursor, and most other clients take the same shape as JSON:

**Claude Code**

```sh
claude mcp add sanity-workflows \
  --env SANITY_AUTH_TOKEN=<token> \
  -- workflow-mcp
```

**Claude Desktop / Cursor**

```json
{
  "mcpServers": {
    "sanity-workflows": {
      "command": "workflow-mcp",
      "env": {"SANITY_AUTH_TOKEN": "<token>"}
    }
  }
}
```

A GUI-launched client (Claude Desktop among them) may not inherit your shell PATH and then cannot resolve `workflow-mcp`. Register with the npx form instead, accepting that it resolves the version when the client boots the server: `"command": "npx"`, `"args": ["-y", "@sanity/workflow-mcp"]`.

## The workflow environment address

Addressed tools use `workflow_resource` and `tag` to select an environment. `workflows_list_tags` is the exception: it accepts only `workflow_resource` so you can discover the tags deployed to that resource.

#### Properties

**workflow_resource** (string, required)

The resource holding the workflow documents, as <type>:<id>. A dataset is the common case (dataset:yourprojectid.workflows); canvas:, media-library:, and dashboard: resources are accepted too.

**tag** (string, required)

Selects a deployment tag within the workflow resource. Use workflows_list_tags to discover the observed tags and confirm the intended environment before calling another tool.

These are exactly the `workflowResource` and `tag` of a deployment in your `sanity.workflow.ts`: the address of a deployment the CLI shipped.

**sanity.workflow.ts**

```typescript
{
  tag: 'prod',
  workflowResource: {type: 'dataset', id: 'yourprojectid.workflows'}
}
```

There is no default environment. An addressed tool fails when `workflow_resource` or `tag` is missing. `workflows_list_tags` is the exception because it discovers tags from `workflow_resource` alone.

Tell the agent which workflow resource to use. Let it call `workflows_list_tags`, confirm the intended tag, and then pass the complete address to every other tool. One server can work across all of your Workflows environments.

## The tools

The server exposes eleven tools under the plural `workflows_*` names: eight for discovery and workflow operations, plus three for authoring definitions.

### Operations

`workflows_list_tags` needs only `workflow_resource`. The other seven operation tools require the complete `workflow_resource` and `tag` address.

**workflows_list_tags(): read**

Lists the observed tags that currently have deployed definitions in the supplied workflow_resource, sorted in ascending order. It returns {tags: string[]}, does not accept tag, and returns an empty array when the resource has no observed tags. Use the result to confirm the tag before calling an addressed tool.

**workflows_list_definitions(): read**

The catalog: which workflow types are deployed (latest version per name). Each entry reports startable (false for child workflows that only run under a parent) and startKind: interactive = a person starts runs from a picker; autonomous = a system starts runs in reaction to a document. A classification, not a restriction.

**workflows_get_definition(): read**

One deployed definition’s full content, by name (in this server, a definition parameter is always a name string), defaulting to the latest version. The returned definition is valid deploy input, which is how an agent edits a workflow: read it, modify it, validate, and deploy the next version.

**workflows_list_instances(assignment_user_id, assignment_roles, assignment_states): read**

Lists workflow instances with optional definition, document, and include_completed filters. Assignment inputs filter for a person and add counts of active activities in the current open stage. Counts do not promise that an action is available. limit accepts 1 to 100 and defaults to 25.

Parameters:
- **assignment_user_id** (string): Account-global user ID for viewer-scoped assignment filtering and counts.
- **assignment_roles** (string[]): Literal project roles held by assignment_user_id. Requires that user ID. Role aliases do not add inbox ownership.
- **assignment_states** (('unrouted' | 'routed' | 'held')[]): States to include. Routed means offered through a supplied role; held means assigned directly to the supplied user. Requires assignment_user_id.

**workflows_get_state(): read**

Everything actionable about one instance: stage, a workflow-level autonomy narrative (whether the workflow runs itself and where it waits on someone), in-scope activities with their executor classification (interactive, autonomous, off-system, or hybrid) and a causal completesWithoutCaller verdict (yes, no, or conditional) with narrated waitsOn lines when it is not yes, invocable actions with their params (each marked required or optional) and why any are disabled, automations the engine fires on its own listed per activity, and recent history.

**workflows_diagnose(): read**

Explains why an instance is or is not progressing and what would unstick it. Waiting distinguishes an action available to the caller, a manual action unavailable to that caller, and automation.

**workflows_start(): write**

Starts a named definition with initial_fields and an optional instance_id idempotency key. Every ordered start requirement must pass. Child workflows remain spawn-only.

**workflows_fire_action(): write**

The instance write: fires an invocable action on an activity, exactly as an editor would, supplying values for the params the state projection declares. Triggers are the engine’s to fire; they surface as automations and this tool rejects them.

For example, call `workflows_list_instances` with these arguments to find work assigned to a person or offered to their role. Replace `PROJECT_ID`, `ACCOUNT_USER_ID`, and `editor` with your project ID, the person’s account-global user ID, and a project role they hold. Use your workflow dataset and tag.

**workflows_list_instances arguments**

```json
{
  "workflow_resource": "dataset:PROJECT_ID.workflows",
  "tag": "prod",
  "assignment_user_id": "ACCOUNT_USER_ID",
  "assignment_roles": [
    "editor"
  ],
  "assignment_states": [
    "held",
    "routed"
  ]
}
```

Each result includes `assignment: {unrouted, routed, held}` counts. `held` counts direct assignments to the person; `routed` counts work offered through their roles with no person assigned. `unrouted` counts work with no person or role selected. If `has_more` is true, repeat the call with the same arguments and pass `next_cursor` as `cursor`.

### Authoring

**workflows_get_authoring_guide(): read**

The DSL guide an agent reads before writing a workflow definition.

**workflows_validate_definition(): read**

The same checks a deploy runs, over a definitions array (a single workflow is a one-element array): per definition, the expanded (desugared) form that would deploy, or a path-prefixed error list the agent can fix from.

**workflows_deploy_definition(): write**

Publishes validated definitions (a definitions array, even for a single workflow; a parent and the child workflows it spawns belong in one call) into an addressed environment, returning {name, version, status} per definition.

Deploying only ever creates, and the version comes from the content. Content identical to the latest deployed version does nothing (`unchanged`), and any change creates the next version. A deployed version is never patched, and running instances keep the definition version they started under.

Before calling `workflows_deploy_definition`, follow [Upgrade Workflows packages](https://www.sanity.io/docs/workflows/upgrade) and supply the reviewed `expectedMinReaderModel`. Complete the shared-runtime rollout before allowing affected writes, including to existing instances. The required model depends on the definition's features, not the package version.

## Embed the tools in another MCP server

Use `registerWorkflowTools` to add Workflows tools to an existing MCP server. The bundled tools accept `workflow_resource` and `tag` on each addressed request. This example keeps authentication and transport in the host-owned `tokenFor` and `baseClientConfigFor` functions, then uses the package-owned client and engine policy for the selected environment.

**src/register-workflow-tools.ts**

```typescript
import {createClient, type ClientConfig} from '@sanity/client'
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  createWorkflowEngine,
  registerWorkflowTools,
  type WorkflowToolExtra,
  workflowAddressFromInput,
  workflowClientConfig,
} from '@sanity/workflow-mcp'

declare function tokenFor(extra: WorkflowToolExtra): string
declare function baseClientConfigFor(extra: WorkflowToolExtra): ClientConfig

const server = new McpServer({name: 'my-host', version: '1.0.0'})

registerWorkflowTools(server, (extra, input) => {
  const address = workflowAddressFromInput(input)
  const client = createClient(
    workflowClientConfig({
      resource: address.workflowResource,
      token: tokenFor(extra),
      base: baseClientConfigFor(extra),
    }),
  )

  return {engine: createWorkflowEngine({address, client})}
})
```

`workflowClientConfig` preserves host settings such as its requester, headers, and API host, then pins the API version, request-tag family, published perspective, and non-CDN reads required by the engine. It also removes the unused resource-addressing style. `createWorkflowEngine` binds that client to one resource and tag without caching. A long-lived host can cache engines outside the helper.

For custom registration, `WORKFLOW_TOOLS` and the individual tool definitions expose host-neutral input schemas. When `requiresAddress` is true, merge your host's environment parameters into the registered schema and use `toolInputJsonSchema` for the definition-only JSON Schema. Render thrown failures with `workflowErrorText`, and reuse `WORKFLOW_TAG_DESCRIPTION` for your tag parameter. If the host offers tag discovery, register `LIST_WORKFLOW_TAGS_TOOL_NAME` and use `LIST_WORKFLOW_TAGS_DESCRIPTION` rather than rewriting its model-facing guidance.

The package uses Zod 3 through `zod/v3`. Mixing a Zod 4 schema into these definitions fails type checking. `zod` and `@modelcontextprotocol/sdk` are peer dependencies, so embedding hosts must provide compatible versions.

Each wire tool also has a camel-case `*Tool` export. The `workflows_fire_action` wire tool keeps the `fireActionTool` export. `ProjectedDefinitionSummary` is available for projected catalog results. Tag discovery has no definition input; use the exported workflow-resource constants when composing its host schema.

## What the agent can and can’t do

The agent can survey, inspect, and diagnose freely. It changes state through exactly three doors:

- Call `workflows_start` to start a run.
- Use `workflows_fire_action` to advance an instance after reading its current state.
- Call `workflows_deploy_definition` to deploy a workflow definition.

The Content Lake is the boundary. The checks the tools make — disabled actions, guard verdicts, validation — are advisory conveniences for the agent. Enforcement is [dataset access control](https://www.sanity.io/docs/content-lake/keeping-your-data-safe) (custom roles) evaluated against the server’s token and parameters. A token that can’t write in an environment can’t fire actions or deploy into it.

## Next steps

- [Configure and deploy workflow definitions](https://www.sanity.io/docs/workflows/deploy-definitions): deploy definitions and the sanity.workflow.ts deployments the environment addresses point at.
- [Reference](https://www.sanity.io/docs/workflows/reference): the constructs and engine verbs behind these tools.
- [Test a workflow before you deploy it](https://www.sanity.io/docs/workflows/testing): prove a definition in the in-memory bench before an agent deploys it.

