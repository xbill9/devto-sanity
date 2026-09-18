<!-- Source: https://www.sanity.io/docs/ai/sanity-context-configure-mcp (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Configure an MCP

Create an MCP in the Context app, scope what it serves, and connect an agent to the endpoint.

An MCP defines what an agent can access and how it should behave. Configuration lives in the Context app rather than in your agent code, so it's visible to your team, editable by non-developers, and shared across environments. This guide creates one and connects an agent to it.

> [!NOTE]
> Prefer to use AI?
> [Enable the agent skills](https://www.sanity.io/docs/ai/sanity-context-quick-start) to have AI help you configure the Context MCP.

## Prerequisites

Context enabled for your organization, an organization API token with Context Viewer permissions, created under Manage > API > Tokens, and a deployed schema (run `sanity schema deploy`, Studio v5.1.0 or later) if the endpoint has a dataset source. See [Sanity Context](https://www.sanity.io/docs/ai/sanity-context) for the full list.

## Create the MCP

In the Context app in the Dashboard, create an MCP and fill in its fields. For what each field does, see [Context MCP](https://www.sanity.io/docs/ai/sanity-context-mcp). The Context app shows the endpoint URL once you save.

## Scope what the agent can read

A GROQ filter limits which documents the agent can reach in GROQ mode. It accepts a filter expression only — the part inside the `[ ... ]` of a full query, evaluating to true or false for one document at a time.

Three things that don't belong in a filter:

- Projection syntax such as `{ name, price }`. Move projections to the agent's queries instead.
- Ordering or slicing such as `order(...)` or `[0...10]`.
- A full query — anything starting with `*[...]`. Filters nested inside an expression are fine.

An invalid filter is rejected with a 422 and the parser error in the response body.

> [!NOTE]
> A filter that matches nothing looks like a broken connection
> A filter like `_type == "product" && public == true` returns no results if no product has `public: true`. If the agent reports empty results, check the filter before checking the connection.

## Connect an agent to the endpoint

Use the endpoint URL from the Context app to connect an MCP client. This example uses the Vercel AI SDK:

**index.ts**

```typescript
import {createMCPClient} from '@ai-sdk/mcp'

const mcpClient = await createMCPClient({
  transport: {
    type: 'http',
    url: 'https://api.sanity.io/v1/context/organizations/YOUR_ORGANIZATION_ID/mcp/YOUR_ENDPOINT_NAME',
    headers: {
      Authorization: `Bearer ${process.env.SANITY_ORGANIZATION_TOKEN}`,
    },
  },
})
```

Replace YOUR_ORGANIZATION_ID with your organization id and YOUR_ENDPOINT_NAME with the endpoint's name, which is chosen when you create the MCP and cannot be changed afterwards. SANITY_ORGANIZATION_TOKEN is the organization API token from your prerequisites; keep it server-side, since it carries organization-level permissions.

Verify the connection by listing the available tools:

**index.ts**

```typescript
const tools = await mcpClient.tools()
console.log(tools)
```

For an endpoint with a dataset source, the list includes `initial_context` and `groq_query`. If a tool is missing, check the endpoint's mode and any tools parameter: each tool is served only in the mode it belongs to, and a tools parameter narrows the list further. For the full tool list per mode, see [Context MCP tools](https://www.sanity.io/docs/ai/sanity-context-mcp-tools).

There are dedicated connect guides for the [Vercel AI SDK](https://www.sanity.io/docs/ai/sanity-context-vercel-ai-sdk), [OpenAI Agents SDK](https://www.sanity.io/docs/ai/sanity-context-openai-agents-sdk), and [LangChain](https://www.sanity.io/docs/ai/sanity-context-langchain).

## Next steps

- [Content access and security](https://www.sanity.io/docs/ai/sanity-context-security). How the token and the filter bound what an agent reads.
- [Context MCP tools](https://www.sanity.io/docs/ai/sanity-context-mcp-tools). Every tool the endpoint serves, by mode.

