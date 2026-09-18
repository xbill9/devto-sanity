<!-- Source: https://www.sanity.io/docs/ai/get-started (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Get started

Set up the Sanity Agent Toolkit and MCP server to help AI assistants generate high-quality Sanity code that follows established best practices.

> [!NOTE]
> Just want to get started?
> If you want an agent to set up a Sanity project for you, start with [Quickstart: AI coding agents](https://www.sanity.io/docs/getting-started/ai-coding-agents) or [Quickstart: AI app builders](https://www.sanity.io/docs/getting-started/ai-app-builder-quickstart). This page goes deeper on the AI tooling itself.

AI tools can dramatically accelerate Sanity development, but without proper guidance, they often produce generic code that fails to leverage Sanity's full capabilities.

This guide will help you:

- Set up AI tools to generate high-quality Sanity code.
- Avoid common pitfalls of AI-generated configurations.
- Implement best practices from Sanity into your AI workflow.

## Configure the MCP server

The fastest way to connect your AI tools to Sanity is with the [Sanity MCP server](https://www.sanity.io/docs/ai/mcp-server). Run the following command to automatically detect and configure the MCP server for Cursor, Claude Code, and VS Code:

**npm**

```shell
npx sanity@latest mcp configure
```

**pnpm**

```shell
pnpm dlx sanity@latest mcp configure
```

**yarn**

```shell
yarn dlx sanity@latest mcp configure
```

**bun**

```shell
bunx sanity@latest mcp configure
```

This detects and configures the MCP server automatically. See the [MCP server documentation](https://www.sanity.io/docs/ai/mcp-server) for manual configuration options and troubleshooting. If you’re starting a new project with `sanity init`, the CLI will help you set up the MCP server as part of the setup steps. 

## Add Sanity skills and plugins

The [Sanity Agent Toolkit](https://github.com/sanity-io/agent-toolkit) is a collection of resources to help AI agents build better with Sanity.

It includes:

- **Agent skills** covering Sanity best pracitces, AEO/SEO, content modelling and personalisation.
- **Claude Code plugin** with slash commands and interactive skills for common workflows.
- **Cursor plugin** with automatic MCP setup, slash commands and agent skills all included

You can also install skills directly by running the following command from your project directory:

**npm**

```shell
npx skills add sanity-io/agent-toolkit
```

**pnpm**

```shell
pnpm dlx skills add sanity-io/agent-toolkit
```

**yarn**

```shell
yarn dlx skills add sanity-io/agent-toolkit
```

**bun**

```shell
bunx skills add sanity-io/agent-toolkit
```

## Leveraging documentation content

The Sanity documentation has several ways you can use AI to get the job done:

- **For quick, specific reference**: Use the **Copy article** button on all articles that puts the markdown version of the content on your clipboard. You can also add `.md` at the end of any article URL to get the markdown version.
- **For comprehensive context**: You can point LLMs to `/docs/llms.txt` and `/docs/llms-full.txt` to access all the links and the full corpus as markdown formatted content.
- **For interactive queries**: Use the [MCP server](https://www.sanity.io/docs/ai/mcp-server)'s `search_docs` and `read_docs` tools.
- **For CLI-based work**: You can even tell LLMs to use `sanity docs search` and `sanity docs read` to find docs articles.

In tools like Cursor that support local docs, you can add the Sanity Docs and Learn materials directly by typing `@Docs` in their agent chats.

## Leveraging Sanity Learn content

All course and lesson material on [Sanity Learn](https://www.sanity.io/learn) is also available in the LLM-friendly `llms.txt` standard. You can read [how we made this](https://www.sanity.io/blog/improving-the-agent-experience-for-sanity-learn) on our blog.

There are two different sizes you can import into your IDE:

- `/llms.txt` is an abbreviated index of all the content with links.
- `/llms-full.txt` is the complete content (sometimes optimized to fit within the context window limits).



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity Studio v5.12.0: Enhanced object dialog becomes default, AI CLI detection added, and breadcrumb issues fixed](https://www.sanity.io/docs/changelog/studio-NS4xMS4w.md) — February 24, 2026