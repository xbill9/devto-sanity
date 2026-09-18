<!-- Source: https://www.sanity.io/docs/ai/sanity-context-vercel-ai-sdk (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Connect Sanity Context with Vercel AI SDK

Connect Sanity Context to a TypeScript agent using the Vercel AI SDK and Anthropic.

This example connects [Sanity Context](https://www.sanity.io/docs/ai/sanity-context) to a TypeScript agent using the [Vercel AI SDK](https://sdk.vercel.ai). It fetches initial context for schema awareness, connects to the MCP endpoint, and runs an agent that can query your content.

## Before you start

You need a Sanity Context MCP endpoint. If you haven't set one up yet, start with [Sanity Context](https://www.sanity.io/docs/ai/sanity-context). You'll need:

- **MCP endpoint URL**: Shown on the MCP in the Context app in the Sanity Dashboard.
- **Organization API token**: create one in [Manage](https://www.sanity.io/manage/org/api/tokens) under API > Tokens at the organization level.
- **Anthropic API key**: The AI SDK reads it from `ANTHROPIC_API_KEY`.
- **Node.js 22.18 or later**: Runs TypeScript files directly. Earlier versions need `npx tsx` and a package such as `dotenv`.

## Install dependencies

**npm**

```shell
npm install @ai-sdk/mcp @ai-sdk/anthropic ai
npm install -D typescript @types/node
```

**pnpm**

```shell
pnpm add @ai-sdk/mcp @ai-sdk/anthropic ai
pnpm add -D typescript @types/node
```

**yarn**

```shell
yarn add @ai-sdk/mcp @ai-sdk/anthropic ai
yarn add --dev typescript @types/node
```

**bun**

```shell
bun add @ai-sdk/mcp @ai-sdk/anthropic ai
bun add --dev typescript @types/node
```

All three packages are ESM-only. Set the module type in `package.json` so the top-level `await` calls in the example compile:

**package.json**

```json
{
  "type": "module"
}
```

## Set environment variables

Create a `.env` file next to `agent.ts`. Replace each placeholder with your own value:

**.env**

```sh
SANITY_CONTEXT_MCP_URL=YOUR_MCP_ENDPOINT_URL
SANITY_ORGANIZATION_TOKEN=YOUR_ORGANIZATION_TOKEN
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
```

## Full example

Connect to the MCP endpoint, fetch initial context, and run the agent:

**agent.ts**

```typescript
import {createMCPClient} from '@ai-sdk/mcp'
import {anthropic} from '@ai-sdk/anthropic'
import {generateText} from 'ai'

const MCP_URL = process.env.SANITY_CONTEXT_MCP_URL!
const API_TOKEN = process.env.SANITY_ORGANIZATION_TOKEN!

// 1. Fetch initial context via HTTP — gives the agent schema awareness upfront.
// Append to the path, not the whole URL, so any query parameters survive.
const initialContextUrl = new URL(MCP_URL)
initialContextUrl.pathname = `${initialContextUrl.pathname.replace(/\/$/, '')}/initial-context`

const initialContext = await fetch(initialContextUrl, {
  headers: {Authorization: `Bearer ${API_TOKEN}`},
}).then((r) => r.text())

// 2. Connect to Sanity Context MCP and get tools
const mcpClient = await createMCPClient({
  transport: {
    type: 'http',
    url: MCP_URL,
    headers: {Authorization: `Bearer ${API_TOKEN}`},
  },
})

const {initial_context: _, ...tools} = await mcpClient.tools()

// 3. Call the LLM with tools and initial context in the system prompt
const systemPrompt = [
  'You are a helpful assistant.',
  '',
  '# Data reference',
  '',
  'Use this to understand what\'s available and write better queries.',
  '',
  initialContext,
].join('\n')

const {text} = await generateText({
  model: anthropic('claude-sonnet-4-6'),
  system: systemPrompt,
  tools,
  prompt: 'What content do we have?',
})

console.log(text)
```

## Run the agent

Node reads the `.env` file with `--env-file`:

**CLI**

```sh
node --env-file=.env agent.ts
```

## How it works

Every Sanity Context integration follows three steps:

1. **Fetch initial context** via the `/initial-context` HTTP endpoint and inject it into your system prompt. This gives the agent a compressed schema overview so it can write accurate queries from the start — and saves a tool call on every conversation.
2. **Connect to MCP and get tools**: Authenticate with your organization API token. Remove the `initial_context` tool from the set since you've already fetched it.
3. **Call the LLM** with the tools and system prompt. The agent will make tool calls as it explores your content.

## Common errors

Three failures account for most first runs:

- `error TS1309: The current file is a CommonJS module and cannot use 'await' at the top level`: Set `"type": "module"` in `package.json`.
- `TypeError: Cannot read properties of undefined (reading 'replace')`: The environment variables aren't loaded. The `!` assertions are erased at runtime, so a missing value surfaces at first use rather than at startup.
- `Anthropic API key is missing. Pass it using the 'apiKey' parameter or the ANTHROPIC_API_KEY environment variable.`: Add `ANTHROPIC_API_KEY` to the `.env` file.

## Next steps

- [Sanity Context patterns and best practices](https://www.sanity.io/docs/ai/sanity-context-patterns): Production patterns for public assistants, personalized agents, and multi-backend setups.
- [Add insights to Sanity Context](https://www.sanity.io/docs/ai/sanity-context-insights): Track and analyze agent conversations.
- [AI shopping assistant walkthrough](https://www.sanity.io/agent-context-ecommerce): A full reference implementation using Next.js and the Vercel AI SDK.

