<!-- Source: https://www.sanity.io/docs/ai/sanity-context-openai-agents-sdk (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Connect Sanity Context with OpenAI Agents SDK

Connect Sanity Context to a Python agent using the OpenAI Agents SDK with built-in MCP support.

This example connects [Sanity Context](https://www.sanity.io/docs/ai/sanity-context) to a Python agent using the [OpenAI Agents SDK](https://github.com/openai/openai-agents-python). The SDK has built-in MCP support and discovers tools automatically.

## Before you start

You need a Sanity Context MCP endpoint. If you haven't set one up yet, start with [Sanity Context](https://www.sanity.io/docs/ai/sanity-context). You'll need:

- **MCP endpoint URL**: Shown on the MCP in the Context app in the Sanity Dashboard.
- **Organization API token**: create one in [Manage](https://www.sanity.io/manage/org/api/tokens) under API > Tokens at the organization level.
- **OpenAI API key**: The SDK reads it from `OPENAI_API_KEY`.
- **Python 3.10 or later**: Required by `openai-agents`.

## Install dependencies

**Terminal**

```sh
pip install openai-agents httpx python-dotenv
```

## Set environment variables

Create a `.env` file next to `agent.py`. `load_dotenv()` reads it. Replace each placeholder with your own value:

**.env**

```sh
SANITY_CONTEXT_MCP_URL=YOUR_MCP_ENDPOINT_URL
SANITY_ORGANIZATION_TOKEN=YOUR_ORGANIZATION_TOKEN
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

## Full example

Connect to the MCP endpoint, fetch initial context, and run the agent:

**agent.py**

```python
import asyncio
import os
from urllib.parse import urlparse, urlunparse

import httpx
from dotenv import load_dotenv
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp, create_static_tool_filter

load_dotenv()

MCP_URL = os.environ["SANITY_CONTEXT_MCP_URL"]
API_TOKEN = os.environ["SANITY_ORGANIZATION_TOKEN"]


async def main():
    # 1. Fetch initial context via HTTP
    parsed = urlparse(MCP_URL)
    initial_context_url = urlunparse(
        parsed._replace(path=parsed.path.rstrip("/") + "/initial-context")
    )

    async with httpx.AsyncClient() as http:
        resp = await http.get(
            initial_context_url,
            headers={"Authorization": f"Bearer {API_TOKEN}"},
        )
        resp.raise_for_status()
        initial_context = resp.text

    # 2. Connect to Sanity Context MCP
    async with MCPServerStreamableHttp(
        name="sanity",
        params={
            "url": MCP_URL,
            "headers": {"Authorization": f"Bearer {API_TOKEN}"},
        },
        # The default is 5 seconds, which is tight for a large schema
        client_session_timeout_seconds=30,
        tool_filter=create_static_tool_filter(
            blocked_tool_names=["initial_context"],
        ),
    ) as server:
        # 3. Create the agent and run it
        agent = Agent(
            name="Assistant",
            instructions=(
                "You are a helpful assistant.\n\n"
                "# Data reference\n\n"
                "Use this to understand what's available and write better queries.\n\n"
                + initial_context
            ),
            mcp_servers=[server],
        )

        result = await Runner.run(agent, "What content do we have?")
        print(result.final_output)


asyncio.run(main())
```

## How it works

Every Sanity Context integration follows three steps:

1. **Fetch initial context** via the `/initial-context` HTTP endpoint and inject it into your system prompt. This gives the agent a compressed schema overview so it can write accurate queries from the start — and saves a tool call on every conversation.
2. **Connect to MCP** using `MCPServerStreamableHttp`. The SDK discovers tools automatically when you pass `mcp_servers` to the agent. Use `create_static_tool_filter` to block the `initial_context` tool since you've already fetched it.
3. **Create the agent and run it** with `Runner.run`. The agent will make tool calls as it explores your content. Without a `model` argument, `Agent` uses the SDK's default model, and credentials come from `OPENAI_API_KEY`, so a missing key fails at this step, after the MCP connection has already succeeded.

## Common errors

Three failures account for most first runs:

- `KeyError: 'SANITY_CONTEXT_MCP_URL'`: The `.env` file is missing, or isn't in the directory you run the script from. `load_dotenv()` returns without error when it finds no file.
- `httpx.HTTPStatusError: Client error '401 Unauthorized'` raised by `resp.raise_for_status()`: The value in `SANITY_ORGANIZATION_TOKEN` isn't a valid organization API token.
- `openai.OpenAIError: Missing credentials. Please pass an `api_key`, `workload_identity`, `admin_api_key`, or set the `OPENAI_API_KEY` or `OPENAI_ADMIN_KEY` environment variable.`: This surfaces at `Runner.run`, after the MCP connection and the initial-context fetch have already succeeded.

## Next steps

- [Sanity Context patterns and best practices](https://www.sanity.io/docs/ai/sanity-context-patterns): Production patterns for public assistants, personalized agents, and multi-backend setups.
- [Add insights to Sanity Context](https://www.sanity.io/docs/ai/sanity-context-insights): Track and analyze agent conversations.
- [AI shopping assistant walkthrough](https://www.sanity.io/agent-context-ecommerce): A full reference implementation using Next.js and the Vercel AI SDK.

