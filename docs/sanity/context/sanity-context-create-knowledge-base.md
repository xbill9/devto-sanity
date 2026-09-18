<!-- Source: https://www.sanity.io/docs/ai/sanity-context-create-knowledge-base (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Create a Knowledge Base

Create a Knowledge Base, add its first source, run a build, and review the entries and issues it produces.

> [!WARNING]
> Beta
> Knowledge Bases are available as an opt-in beta feature. Features and limits may change before general availability. If you are on an Enterprise plan and need higher limits, talk to your Sanity representative.



A Knowledge Base turns material you already have (a dataset, a website, a set of files) into an index an agent can retrieve from. This guide takes you from an empty Knowledge Base to a built one you have reviewed and connected to an agent.

## Prerequisites

- **Context enabled for your organization.** An organization admin can enable it from the [Labs page](https://www.sanity.io/manage/org/labs) of your organization in Manage.
- **Material to build from:** a website, files, or documents in a Sanity dataset. See [Knowledge Base source types](https://www.sanity.io/docs/ai/sanity-context-source-types) for what each accepts.
- **Room on your plan:** your organization's plan caps how many Knowledge Bases it can hold. Creating one beyond that cap fails with a plan-limit error.

## Title the Knowledge Base and write a purpose

In the Sanity Dashboard, open **Context** and click **New knowledge base**. Enter a short, human-readable **Title** such as `Vandelay support`, then a **Purpose** of one or two sentences describing the audience and the job it should help with.

Click **Create knowledge base**. Sanity creates the Knowledge Base and opens it so you can add sources.

The purpose is the starting point for the outline, before Context has read any material. "Customer-facing support Knowledge Base for Vandelay Industries. Covers importing, exporting, product specs, ordering, and returns" gives the build more to work with than "Vandelay docs." The purpose also decides which entries the build tags as core, and agents read it at the head of the outline.

## Add a first source

A Knowledge Base needs at least one source. Click **Add source** and choose **Dataset**, **Website**, or **Files**.

For the first build, use a focused set of current material you trust. This makes the result easier to review and leaves stale duplicates out of the build. If the material changes regularly, connect it as a dataset or website source rather than uploading a snapshot. Your organization's plan also caps how many sources a Knowledge Base can hold, enforced when you build.

## Build the entries

Click **Build entries** after adding the material. Larger builds take longer.

The build is done when the status line reads **Entries up to date**. If it reads **Build failed** or reports that no sources could be processed, remove the failed sources or add new ones, then build again.

## Review what the build produced

When the build finishes, open **Entries** to see the tree and what was written. Check that the topics you expected are present and that the summaries describe them accurately. **Issues** contains conflicts and other questions that need a decision. Start with the ones that could change important answers. See [Resolve Knowledge Base issues](https://www.sanity.io/docs/ai/sanity-context-resolve-issues).

![A screenshot of entries from a knowledge base, showing the entries structure and the contents of a single entry.](https://cdn.sanity.io/images/3do82whm/next/b485b4a7c6cea69177fd24fdd105d843abf00e0c-2776x1800.png)

Then test the Knowledge Base through an agent with questions people will actually ask. "What is the return window on bulk orders?" gives you something specific to check. "Tell me about Vandelay" does not.

## Serve a Knowledge Base to an agent

Agents read Knowledge Bases through Context MCP. Two query parameters switch the endpoint to Knowledge Base mode:

- `mode=knowledge_base` serves Knowledge Base tools instead of GROQ tools.
- `knowledgeBases=KNOWLEDGE_BASE_ID` selects a Knowledge Base by its public id, which begins with `kb`. Separate several ids with commas.

For a deployed application, add the Knowledge Base as a source on the MCP in the Context app instead of passing these in the URL. An endpoint whose sources are all Knowledge Bases serves Knowledge Base tools automatically, and you can change what it serves without updating the agent configuration. An endpoint that also has a dataset source serves GROQ tools and ignores its Knowledge Base sources. See [Configure an MCP](https://www.sanity.io/docs/ai/sanity-context-configure-mcp).

The endpoint needs an organization API token with Context Viewer permissions, created under **Manage > API > Tokens** at the organization level, not a project read token. Test the connection with specific questions whose answers you already know.

## Next steps

- [Keep a Knowledge Base current](https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base). Refresh schedules, change detection, and rebuilds.
- [Knowledge Bases](https://www.sanity.io/docs/ai/sanity-context-knowledge-bases). How the outline, entries, and instructions fit together.

