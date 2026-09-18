<!-- Source: https://www.sanity.io/docs/ai/sanity-context (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Sanity Context

Sanity Context exposes the content kept in Sanity to your agents through a hosted, read-only MCP server, from your live dataset or from Knowledge Bases built ahead of time.

Sanity Context is a hosted Model Context Protocol (MCP) server that gives AI agents structured, read-only access to your content. It serves your live dataset in GROQ mode, or material you have indexed ahead of time in Knowledge Base mode.

With Sanity Context, you can:

- **Answer questions from your own content.** Build assistants that respond from your documentation or help center rather than from a model's training data.
- **Recommend from your catalog.** Give a shopping assistant schema-aware access to products so it filters on real fields instead of guessing at them.
- **Surface related work for editors.** Let an editorial helper find existing coverage before someone writes a duplicate.
- **Ground an agent in curated knowledge.** Build a Knowledge Base from datasets, websites, and files, and serve it as one indexed source.

[Connect your first agent](https://www.sanity.io/docs/ai/sanity-context-quick-start)
Go from nothing to a working agent in a few steps.

[Create a Knowledge Base](https://www.sanity.io/docs/ai/sanity-context-create-knowledge-base)
Build an index from your material and serve it to agents.

![Dark mode UI of a 'Context' application's overview page, displaying sections for 'MCP endpoints' and 'Knowledge bases' with lists of associated items and their statuses.](https://cdn.sanity.io/images/3do82whm/next/1ab1ef0b069bc1bbcebb78e50fe58b266f316dde-2450x1506.png)

## What Sanity Context provides, and what you bring

Sanity hosts Context MCP, the server your agent connects to. You bring:

- **An MCP-capable AI harness.** Your own application built with the Vercel AI SDK, or anything else that speaks MCP.
- **A Context MCP, created in the Context app in the Sanity Dashboard.** The configuration that defines what the agent can access, plus optional instructions that shape how it behaves.

Sanity Context provides the scoped, schema-aware window into your content. It does not run the agent loop itself, and it cannot write back to your dataset. If you need tools for an agent that creates or modifies content, see the [Sanity MCP server](https://www.sanity.io/docs/ai/mcp-server), which is a separate server, not a write mode of this one. If you want an editorial assistant with its own harness that runs in the Dashboard, on Slack, or through an API, see [Content Agent](https://www.sanity.io/docs/content-agent).

## Requirements

To set up Sanity Context, you'll need:

- **Context enabled for your organization.** An organization admin can enable it from the [Labs page](https://www.sanity.io/manage/org/labs) of your organization in Manage.
- **An organization API token with Context Viewer permissions.** Create it under Manage > API > Tokens at the organization level, and keep it server-side. Viewer is the least privilege that works; Editor also works.
- **A model and API key.** Simple schemas and questions work with small, fast models. If the agent picks the wrong tool or writes malformed GROQ, move to a more capable model.
- **Optionally, a frontend application to host the agent.** Next.js, for example.

GROQ mode additionally requires:

- **A Sanity project** with content.
- **Sanity Studio 5.1.0 or later** for server-side schema support.
- **A deployed schema.** Run `sanity schema deploy`, or open your hosted Studio once if you deploy with `sanity deploy`.

Knowledge Base mode additionally requires at least one Knowledge Base that your token can read.

## Core concepts

### Retrieval modes

Context serves content in one of two modes. GROQ mode queries your dataset at request time and suits structured, consistent content the schema can point an agent at. Knowledge Base mode serves an index built ahead of time and suits answers spread across prose from several sources. The mode determines which tools the endpoint serves. See [Context retrieval modes](https://www.sanity.io/docs/ai/sanity-context-retrieval-modes).

### Context MCPs

A Context MCP is the configuration an agent connects to: what content it can reach, and any instructions that shape its behavior. You create and manage MCPs in the Context app, so you can change what an endpoint serves without redeploying the agent. See [Configure an MCP](https://www.sanity.io/docs/ai/sanity-context-configure-mcp).

### Initial context

At the start of a conversation the agent orients itself through initial context, which is mode-aware: a compressed schema overview in GROQ mode, or the Knowledge Base outline in Knowledge Base mode. If you control the system prompt you can fetch it over HTTP and skip the tool call. See [Inline initial context into your system prompt](https://www.sanity.io/docs/ai/sanity-context-initial-context).

### Knowledge Bases

A Knowledge Base is a pre-built index over material you choose: datasets, websites, uploaded files. A build reads the material ahead of time, resolves conflicts between sources, and writes entries an agent can retrieve directly. See [Knowledge Bases](https://www.sanity.io/docs/ai/sanity-context-knowledge-bases) and [Knowledge Base source types](https://www.sanity.io/docs/ai/sanity-context-source-types). Once a Knowledge Base is live, you [keep it current](https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base) and [resolve the issues a build raises](https://www.sanity.io/docs/ai/sanity-context-resolve-issues).

### Content access

Access is decided when the agent connects: your organization token authorizes the connection, the MCP's sources decide what it serves, and a GROQ filter scopes dataset reads. Context MCP is read-only in both modes. See [Content access and security](https://www.sanity.io/docs/ai/sanity-context-security).

## Limitations

- Context MCP is read-only. It cannot create or update documents.
- It does not run the agent loop. You bring the harness and the model.
- Knowledge Bases are an opt-in beta feature, and limits may change before general availability. If you are on an Enterprise plan and need higher limits, talk to your Sanity representative.

## Next steps

- [Quick start: connect an agent to Sanity Context](https://www.sanity.io/docs/ai/sanity-context-quick-start). The shortest path to something working.
- [Context MCP](https://www.sanity.io/docs/ai/sanity-context-mcp). The reference for endpoints, parameters, and configuration.
- [Context MCP tools](https://www.sanity.io/docs/ai/sanity-context-mcp-tools). Which tools an endpoint serves in each mode, and what each one does.
- [Sanity Context patterns and best practices](https://www.sanity.io/docs/ai/sanity-context-patterns). Scoping, routing, and instructing agents once the basics work.
- [Add insights to Sanity Context](https://www.sanity.io/docs/ai/sanity-context-insights). Track and analyze agent conversations.



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity Context v2.0.0: Insights moves to the Context app, and the Studio plugin is deprecated](https://www.sanity.io/docs/changelog/context-pkg-Mi4wLjA.md) — September 3, 2026
- [Sanity Context v1.0.0: Sanity Studio v6 support](https://www.sanity.io/docs/changelog/context-pkg-MS4wLjA.md) — August 11, 2026
- [Sanity Context v0.5.0: Add opt-in telemetry for conversation classification insights](https://www.sanity.io/docs/changelog/agent-context-pkg-MC41LjA.md) — May 5, 2026
- [Sanity Context v0.4.0: Introducing Agent Context Insights for conversation tracking and analysis](https://www.sanity.io/docs/changelog/agent-context-pkg-MC40LjA.md) — May 4, 2026