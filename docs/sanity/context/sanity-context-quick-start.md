<!-- Source: https://www.sanity.io/docs/ai/sanity-context-quick-start (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Quick start: connect an agent to Sanity Context

Install the Sanity Context skill, run the guided setup, and verify your agent can read your content.

Sanity Context gives an agent read-only, schema-aware access to your content through a hosted MCP server. This quick start uses the setup skill, which inspects your project and generates the schema, configuration, and code you need. By the end you'll have an MCP endpoint and an agent that can answer questions about your content.

> [!NOTE]
> Prefer a manual setup?
> If you’d rather not use the skill, follow the instructions in the [Configure an MCP](https://www.sanity.io/docs/ai/sanity-context-configure-mcp) guide.

## Prerequisites

- **Context enabled for your organization.** An organization admin can enable it from the [Labs page](https://www.sanity.io/manage/org/labs) of your organization in Manage.
- **A Sanity project with content.**
- **A deployed schema** for the project and dataset the endpoint reads, from a Studio on v5.1.0 or later. Run `sanity schema deploy`, or open your hosted Studio once if you deploy with `sanity deploy`. An MCP endpoint with a dataset source will not serve without one.
- **An organization API token** with Context Viewer permissions, created in [Manage](https://www.sanity.io/manage/org/api/tokens) under API > Tokens at the organization level, not the project level, and kept server-side. Context Editor also works, but Viewer is the least privilege that will do.
- **A model and API key** for the agent you're building.
- **A coding agent** such as Claude Code or Cursor, plus Node.js 20.19+ or 22.12+ to run `npx`.

The setup spans Studio, schema, and application code, so run it with a capable coding model rather than a small one.

## Step 1: Install the Sanity Context skills

The `--all` flag installs three skills: `create-agent-with-sanity-context` for setup, plus `dial-your-context` for tuning the Instructions field and `shape-your-agent` for crafting a system prompt. From your project directory:

**npm**

```shell
npx skills add sanity-io/context --all
```

**pnpm**

```shell
pnpm dlx skills add sanity-io/context --all
```

**yarn**

```shell
yarn dlx skills add sanity-io/context --all
```

**bun**

```shell
bunx skills add sanity-io/context --all
```

## Step 2: Run the setup skill

The `create-agent-with-sanity-context` skill asks about your goal, inspects your project, and walks you through configuration, building an example agent, and optionally adding a frontend UI. Prompt your coding agent:

**Example prompt**

```text
Use the create-agent-with-sanity-context skill to help me build an agent in this project.
```

## Step 3: Verify the connection

The example uses the Vercel AI SDK's MCP client. Pin its major. `@ai-sdk/mcp` shares an internal provider dependency with `ai`, so their majors have to match. If your agent code uses `ai@6`, a bare install resolves a newer `@ai-sdk/mcp` and produces type errors on `model` and `tools` that name neither package:

**npm**

```shell
npm install @ai-sdk/mcp@^1
```

**pnpm**

```shell
pnpm add @ai-sdk/mcp@^1
```

**yarn**

```shell
yarn add @ai-sdk/mcp@^1
```

**bun**

```shell
bun add @ai-sdk/mcp@^1
```

Set `SANITY_CONTEXT_MCP_URL` to your endpoint URL and `SANITY_ORGANIZATION_TOKEN` to your organization API token, then list the tools the endpoint serves. You should see `initial_context` and `groq_query` among them.

**index.ts**

```typescript
import {createMCPClient} from '@ai-sdk/mcp'

// https://api.sanity.io/v1/context/organizations/YOUR_ORGANIZATION_ID/mcp/YOUR_ENDPOINT_NAME
const url = process.env.SANITY_CONTEXT_MCP_URL
const token = process.env.SANITY_ORGANIZATION_TOKEN
if (!url || !token) {
  throw new Error('Set SANITY_CONTEXT_MCP_URL and SANITY_ORGANIZATION_TOKEN first')
}

const mcpClient = await createMCPClient({
  transport: {
    type: 'http',
    url,
    headers: {Authorization: `Bearer ${token}`},
  },
})

const tools = await mcpClient.tools()
console.log(tools)
```

Then ask the agent a question whose answer you already know, and check that it answers from your content rather than guessing.

> [!NOTE]
> Empty schema or no results?
> Context MCP reads your schema from the server, not your local machine, and an endpoint with a dataset source will not serve until the schema is deployed. Run `sanity schema deploy` (Studio v5.1.0 or later), then retry the connection. If the schema is deployed but queries still return nothing, check whether a GROQ filter is excluding everything the agent tries to read.

## Next steps

- [Configure an MCP](https://www.sanity.io/docs/ai/sanity-context-configure-mcp). Set up the endpoint by hand and scope what it serves.
- [Context retrieval modes](https://www.sanity.io/docs/ai/sanity-context-retrieval-modes). Decide between querying your dataset and building a Knowledge Base.
- [Sanity Context patterns and best practices](https://www.sanity.io/docs/ai/sanity-context-patterns). Scoping, routing, and instructing agents once the basics work.



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity Context v2.0.0: Insights moves to the Context app, and the Studio plugin is deprecated](https://www.sanity.io/docs/changelog/context-pkg-Mi4wLjA.md) — September 3, 2026