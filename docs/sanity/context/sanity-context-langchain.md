<!-- Source: https://www.sanity.io/docs/ai/sanity-context-langchain (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Connect Sanity Context with LangChain

Connect Sanity Context to a Python agent using LangChain and langchain-mcp-adapters.

This example connects [Sanity Context](https://www.sanity.io/docs/ai/sanity-context) to a Python agent using [LangChain](https://python.langchain.com) and [langchain-mcp-adapters](https://github.com/langchain-ai/langchain-mcp-adapters). The adapter library converts MCP tools to LangChain tools automatically.

## Before you start

You need a Sanity Context MCP endpoint. If you haven't set one up yet, start with [Sanity Context](https://www.sanity.io/docs/ai/sanity-context). You'll need:

- **MCP endpoint URL**: Shown on the MCP in the Context app in the Sanity Dashboard.
- **Organization API token**: create one in [Manage](https://www.sanity.io/manage/org/api/tokens) under API > Tokens at the organization level.
- **Anthropic API key**: `ChatAnthropic` reads it from `ANTHROPIC_API_KEY`.
- **Python 3.10 or later**.

## Install dependencies

**Terminal**

```sh
pip install langchain langchain-mcp-adapters langchain-anthropic httpx python-dotenv
```

## Set environment variables

Create a `.env` file next to `agent.py`. `load_dotenv()` reads it. Replace each placeholder with your own value:

**.env**

```sh
SANITY_CONTEXT_MCP_URL=YOUR_MCP_ENDPOINT_URL
SANITY_ORGANIZATION_TOKEN=YOUR_ORGANIZATION_TOKEN
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
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
from langchain.agents import create_agent
from langchain_anthropic import ChatAnthropic
from langchain_mcp_adapters.client import MultiServerMCPClient

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

    # 2. Connect to Sanity Context MCP and load tools
    mcp_client = MultiServerMCPClient({
        "sanity": {
            "transport": "http",
            "url": MCP_URL,
            "headers": {"Authorization": f"Bearer {API_TOKEN}"},
        },
    })
    tools = [t for t in await mcp_client.get_tools() if t.name != "initial_context"]

    # 3. Create the agent and call the LLM
    system_prompt = (
        "You are a helpful assistant.\n\n"
        "# Data reference\n\n"
        "Use this to understand what's available and write better queries.\n\n"
        + initial_context
    )

    llm = ChatAnthropic(model="claude-sonnet-4-6")
    agent = create_agent(llm, tools, system_prompt=system_prompt)

    result = await agent.ainvoke(
        {"messages": [("user", "What content do we have?")]}
    )
    print(result["messages"][-1].content)


asyncio.run(main())
```

## How it works

Every Sanity Context integration follows three steps:

1. **Fetch initial context** via the `/initial-context` HTTP endpoint and inject it into your system prompt. This gives the agent a compressed schema overview so it can write accurate queries from the start — and saves a tool call on every conversation.
2. **Connect to MCP and get tools**: Authenticate with your organization API token. `MultiServerMCPClient` handles the MCP-to-LangChain tool conversion. Filter out the `initial_context` tool since you've already fetched it.
3. **Create the agent and call the LLM** using `create_agent` from LangChain. The agent will make tool calls as it explores your content.

## Common errors

Three failures account for most first runs:

- `KeyError: 'SANITY_CONTEXT_MCP_URL'`: The `.env` file is missing, or isn't in the directory you run the script from. `load_dotenv()` returns without error when it finds no file.
- `httpx.HTTPStatusError: Client error '401 Unauthorized'` raised by `resp.raise_for_status()`: The value in `SANITY_ORGANIZATION_TOKEN` isn't a valid organization API token.
- `Anthropic authentication failed: no API key or authorization credentials were provided.`: Set `ANTHROPIC_API_KEY` in the `.env` file. `ChatAnthropic` constructs without a key and fails on the first call instead.

## Next steps

- [Sanity Context patterns and best practices](https://www.sanity.io/docs/ai/sanity-context-patterns): Production patterns for public assistants, personalized agents, and multi-backend setups.
- [Add insights to Sanity Context](https://www.sanity.io/docs/ai/sanity-context-insights): Track and analyze agent conversations.
- [AI shopping assistant walkthrough](https://www.sanity.io/agent-context-ecommerce): A full reference implementation using Next.js and the Vercel AI SDK.

