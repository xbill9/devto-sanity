<!-- Source: https://www.sanity.io/docs/ai/sanity-context-security (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Content access and security

How the organization token, the MCP's sources, and groqFilter decide what an agent connected to Context MCP can read.

What an agent can read is decided when it connects, not per query. Your organization token authorizes the connection, the MCP's sources decide what the endpoint serves, and a GROQ filter scopes reads within a dataset source. Context MCP is read-only in both modes and cannot write to your dataset.

## Authentication

Every request carries a bearer token in the Authorization header:

```text
Authorization: Bearer <SANITY_ORGANIZATION_TOKEN>
```

The endpoint needs an organization API token with Context Viewer permissions, created under Manage > API > Tokens at the organization level. Viewer is the least privilege that works; Editor also works. A project token is refused, however broad its project permissions. Keep the token server-side and never embed it in client code. For custom roles, the grant behind Context Viewer is `sanity.knowledge-base.read`.

## Access is checked once, at connect

Every check runs on the agent's first request and fails loudly there; an insufficient token never half-works and fails later in tool calls. For every Knowledge Base the endpoint serves, your token must hold read access to that Knowledge Base, and a denied one refuses the connection with a 403 naming it. A check that cannot be answered refuses with a 502 rather than falling open.

## Dataset reads run as Sanity, not as your token

Once connected, queries against a dataset source run under Sanity's own service credential, not your token. Attaching the dataset to the MCP is the standing authorization: the attach requires admin of the source project plus unrestricted read access to the dataset, and that decision vets the whole dataset for every consumer of the endpoint, drafts included. The `perspective` parameter is caller-choosable, so anyone who can connect can pass `perspective=drafts` or `perspective=raw`. If a dataset's unpublished content is sensitive, don't attach that dataset.

## groqFilter scopes dataset reads

For the connected agent, `groqFilter` is a hard boundary: it applies server-side, so nothing in the conversation can widen what the agent reads. The filter configured on the MCP is also a floor for callers: a `?groqFilter=` URL parameter narrows it, combining the two with `&&`, and never replaces it. With no filter set, the agent reads the entire attached dataset in the chosen perspective. Common scopings: public products only, articles in a published state only, customer-facing FAQs and guides.

```groq
_type == "product" && public == true
_type == "article" && status == "published"
_type in ["faq", "guide"] && audience == "customer"
```

## What agents can read in GROQ mode

- **Your schema.** Document types, field definitions, and references.
- **Your content.** Published documents by default; the `perspective` parameter switches to drafts, raw, or a release id for any caller who can connect.
- **References.** Agents can follow references between documents during a query.

## Access in Knowledge Base mode

In Knowledge Base mode, `groqFilter` does not apply. The agent can read everything in the Knowledge Bases the endpoint serves, so scope access by choosing which Knowledge Bases an MCP serves rather than by filtering within them. Every consumer's token must also hold read access to each Knowledge Base the endpoint serves.

## Authentication errors

**401 Unauthorized** means the token is missing or malformed. Confirm it exists in your environment, is read by your agent code, and is sent as `Authorization: Bearer <token>` rather than as a query parameter or a different header.

**403 Forbidden** with code `contextGrantRequired` means the token is not an organization API token with Context Viewer permissions; create one in [Manage](https://www.sanity.io/manage/org/api/tokens) under API > Tokens at the organization level. A 403 naming a Knowledge Base means your token lacks read access to a Knowledge Base the endpoint serves.

**502 Bad Gateway** means a permission check could not be answered. Nothing is granted on failure; retry the connection.

## Mutations

Context MCP cannot write to your dataset. If you need an agent that creates or updates documents, run those mutations server-side in your own code after the agent decides what to do. For an MCP-based write path, see the [Sanity MCP server](https://www.sanity.io/docs/ai/mcp-server).

