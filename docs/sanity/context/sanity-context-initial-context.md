<!-- Source: https://www.sanity.io/docs/ai/sanity-context-initial-context (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Inline initial context into your system prompt

Fetch initial context over HTTP and drop the tool from your agent to remove a round trip from every conversation.

Agents connected to a Context MCP endpoint call the `initial_context` tool first to orient themselves, which costs a round trip at the start of every conversation. If you control the system prompt (you're building a custom agent rather than plugging into a third-party client), you can fetch the same payload over HTTP, inline it, and drop the tool. This guide shows how.

## Prerequisites

- A configured Context MCP endpoint. See [Configure an MCP](https://www.sanity.io/docs/ai/sanity-context-configure-mcp).
- Your organization ID and the endpoint's URL name, both of which appear in the endpoint's URL.
- An organization API token with Context Viewer permissions, created under Manage > API > Tokens at the organization level. Viewer is the least privilege that works; Editor also works.
- A JavaScript or TypeScript agent whose system prompt you control, with `ai@^6`, `@ai-sdk/mcp@^1`, and `@ai-sdk/anthropic@^3` installed.

## What initial context contains

Initial context is mode-aware. In GROQ mode it returns a compressed schema overview along with instructions on how to query your content. In Knowledge Base mode it returns the outline of the Knowledge Bases the endpoint serves. Both modes also carry query-efficiency and grounding instructions plus a list of the tools the endpoint serves, so the text you inline contains behavioral instructions as well as data. Reconcile them with your own.

## Fetch initial context over HTTP

Append `/initial-context` to the MCP URL path, before any query parameters, using the same auth header:

**Terminal**

```sh
curl https://api.sanity.io/v1/context/organizations/YOUR_ORGANIZATION_ID/mcp/YOUR_ENDPOINT_NAME/initial-context \
  -H "Authorization: Bearer $SANITY_ORGANIZATION_TOKEN"
```

`YOUR_ORGANIZATION_ID` is your organization's ID. `YOUR_ENDPOINT_NAME` is the endpoint's URL name: the kebab-case name you gave it when you created it, which cannot be changed afterwards.

`SANITY_ORGANIZATION_TOKEN` holds the organization API token from the prerequisites. A project dataset-read token does not carry the organization-level permission this route requires, and the request fails with a 403. Keep the token server-side: it carries organization-level permissions, so never ship it in browser-visible code.

The response is `text/plain`. Its markdown headings are shifted down one level by default, so a top-level `#` arrives as `##` and nests under headings of your own. Pass `?heading_offset=0` to keep them as authored, or a higher number to nest them deeper.

## Inline the payload and drop the tool

Install the Vercel AI SDK packages first. All three share an internal provider dependency, so their majors have to match. Pairing `ai@6` with a newer `@ai-sdk/mcp` compiles to type errors on `model` and `tools` that name neither package, and look like a mistake in your own code.

**npm**

```shell
npm install ai@^6 @ai-sdk/mcp@^1 @ai-sdk/anthropic@^3
```

**pnpm**

```shell
pnpm add ai@^6 @ai-sdk/mcp@^1 @ai-sdk/anthropic@^3
```

**yarn**

```shell
yarn add ai@^6 @ai-sdk/mcp@^1 @ai-sdk/anthropic@^3
```

**bun**

```shell
bun add ai@^6 @ai-sdk/mcp@^1 @ai-sdk/anthropic@^3
```

Fetch the payload at startup, concatenate it with your own instructions into the `system` prompt, then remove `initial_context` from the tool set you hand over. With the Vercel AI SDK, the MCP client comes from `@ai-sdk/mcp`, which is a separate package from `ai`:

**index.ts**

```typescript
import {createMCPClient} from '@ai-sdk/mcp'
import {anthropic} from '@ai-sdk/anthropic'
import {generateText} from 'ai'

const endpoint =
  'https://api.sanity.io/v1/context/organizations/YOUR_ORGANIZATION_ID/mcp/YOUR_ENDPOINT_NAME'
const headers = {Authorization: `Bearer ${process.env.SANITY_ORGANIZATION_TOKEN}`}

// The same payload the curl command returned, fetched once at startup
const initialContext = await fetch(`${endpoint}/initial-context`, {headers}).then((res) =>
  res.text(),
)

const mcpClient = await createMCPClient({
  transport: {type: 'http', url: endpoint, headers},
})

const allMcpTools = await mcpClient.tools()
const {initial_context: _, ...mcpTools} = allMcpTools

const yourInstructions = 'You are a support agent for Acme safety equipment.'

const result = await generateText({
  model: anthropic('claude-sonnet-5'),
  system: `${yourInstructions}\n\n${initialContext}`,
  tools: mcpTools,
  prompt: 'Which glove grades are rated for solvent handling?',
})

console.log(result.text)
```

## Keep the inlined payload fresh

An inlined payload is a snapshot. It goes stale when your schema changes in GROQ mode, or when a build rewrites the outline in Knowledge Base mode. Refetch it on deploy at minimum, and after any Knowledge Base rebuild.

## Next steps

- [Context MCP tools](https://www.sanity.io/docs/ai/sanity-context-mcp-tools). The rest of the tools an endpoint serves.
- [Sanity Context patterns and best practices](https://www.sanity.io/docs/ai/sanity-context-patterns). Shaping agent behavior once the basics work.

