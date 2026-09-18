<!-- Source: https://www.sanity.io/docs/ai/sanity-context-patterns (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Sanity Context patterns and best practices

Production patterns and best practices for building agents with Sanity Context.

Sanity Context gives an AI agent schema-aware, read-only access to your content through a hosted MCP server. This guide skips installation and prerequisites and focuses on the patterns that matter once you build for production: a public assistant, a personalized assistant for signed-in users, and an agent that uses Sanity Context alongside other backends. For setup, the MCP endpoint shape, and the tools Sanity Context exposes, see [Sanity Context](https://www.sanity.io/docs/ai/sanity-context).

## Best practices

These tips apply to every Sanity Context implementation, whether your users are logged out or logged in.

1. **Configure through an MCP in the Context app, not just URL query params.** The MCP holds `title`, `name`, `sources`, `instructions`, and `groqFilter`. Storing config in the Context app lets your team tune agent behavior without a deploy. Reserve query params for runtime overrides.
2. **Write a real instructions field.** This is the domain knowledge the schema can't express: misleading field names, filters that should always apply, non-obvious relationships, and good query patterns. The schema tells the agent what fields exist. The instructions tell it how your business actually uses them.
3. **Write a focused system prompt of roughly 200 to 400 words.** Cover audience, tone, boundaries, and fallback behavior, such as "if you can't find it, say so, don't guess." Keep retrieval guidance in the instructions field and behavior and voice in the system prompt. Don't mix the two.
4. **Render structured results as UI, not prose.** Results come back as structured data, so stream them into real components such as product cards, order rows, and document links instead of letting the model re-narrate them. This keeps prices and inventory exact and avoids re-hallucination. The [agent-directives](https://www.npmjs.com/package/@sanity/agent-directives) package can help with this.
5. **Prefer the initial context endpoint over the tool. **If you control the system prompt, you should include the initial context in your prompt to save a tool call for every conversation. This reduces user-facing latency.
6. **Use Agent Insights to close the loop.** The toolkit logs and classifies conversations for success score, sentiment, and content gaps. Use the gaps to improve your content and instructions over time.

### Security rules that are non-negotiable

- Pass the organization API token as a Bearer token, server-side only. Never ship it to the browser.
- The browser talks to your server, which talks to the MCP. The client never holds the MCP URL or token.
- `groqFilter` is your access-control boundary. Treat any user-scoped value in it as trusted and server-derived only, taken from the session, never from client input.

## The public assistant pattern (logged-out)

Use this pattern for a support-and-browse assistant on a public marketing or storefront site. Every visitor is anonymous, so everyone sees the same scope of content. The filter is static and contains nothing sensitive.

### Configure the Context document

Store the scope and the domain knowledge in the Context document so editors can tune it without a deploy.

**MCP configuration**

```text
title:        "Public Site Assistant"
name:         "public-assistant"
sources:      your project's production dataset
groqFilter:   _type in ["product", "article", "faq"] && status == "published"
instructions: |
  You answer questions about our catalog and help docs.
  - "price" is the list price in USD. Use `salePrice` when `onSale == true`.
  - Stock lives on `inventory.available` (a number). 0 means out of stock, say so.
  - A product's brand is a reference: dereference with brand->{name}.
  - For "similar to X" or vibe-based queries, rank with
    text::semanticSimilarity() over title + description.
  - Never invent SKUs, prices, or stock. If a query returns nothing, say you
    couldn't find a match and suggest broadening.
```

`groqFilter` is a filter expression, not a full query: `_type == "product"`, not `*[_type == "product"]`. Published documents are visible by default, so the `status == "published"` clause here is your own editorial flag, not the perspective control.

### Add the server route

The token and the MCP URL stay server-side. The browser only ever talks to this route.

**app/api/assistant/route.ts**

```typescript
// app/api/assistant/route.ts
import {createMCPClient} from '@ai-sdk/mcp'
import {streamText, convertToModelMessages} from 'ai'
import {anthropic} from '@ai-sdk/anthropic'

const MCP_URL =
  'https://api.sanity.io/v1/context/organizations/' +
  `${process.env.SANITY_ORGANIZATION_ID}/mcp/public-assistant`

const SYSTEM_PROMPT = `
You are the assistant for Acme's public website. You help anonymous visitors
find products and answer support questions from our published content.

Audience: prospective customers, no account, varying technical level.
Tone: friendly, concise, never pushy.

Rules:
- Answer only from retrieved content. Use the tools for every factual claim
  about products, prices, stock, or policies.
- If retrieval returns nothing, say you couldn't find it and offer to broaden
  the search. Do not guess or invent details.
- When you list products, return them as structured data for the UI to render
  as cards, do not re-describe prices in prose.
- Don't discuss anything outside Acme's catalog and help content.
`.trim()

export async function POST(req: Request) {
  const {messages} = await req.json()

  // Token and URL stay server-side. The browser never sees either.
  const mcp = await createMCPClient({
    transport: {
      type: 'http',
      url: MCP_URL,
      headers: {Authorization: `Bearer ${process.env.SANITY_ORGANIZATION_TOKEN}`},
    },
  })

  const tools = await mcp.tools()

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools,
    stopWhen: ({steps}) => steps.length >= 8, // allow multi-step tool use
    onFinish: () => mcp.close(),
  })

  return result.toUIMessageStreamResponse()
}
```

That's the whole logged-out pattern: one static document, one server route, and a token that never leaves the server. Visitors are interchangeable.

## The personalized assistant pattern (logged-in)

Use this pattern when a signed-in user asks something like "what should I wear for a winter trail run?" You want recommendations from your catalog, which Sanity owns, tailored to this user: their sizes, the brands and categories they buy, what they already own, and their budget tier.

Here is the architectural point. Sanity is not where the user's orders or profile live. Those belong to your commerce or order management system and your CRM. So the logged-in pattern is not "scope Sanity to the user's private records." Instead, use the session to gather user signals from the systems that own them, then feed those signals into the Sanity agent as context that shapes catalog queries and ranking. Sanity stays the catalog layer, and personalization rides on top.

### Where each signal comes from

##### Signal sources

| Signal | Source (owns it) | How the agent uses it |
| --- | --- | --- |
| Identity | Auth session | Trusted key to look up the rest, never from client input |
| Past purchases, owned SKUs | Commerce / OMS | Exclude owned items, infer taste |
| Sizes, preferred brands | CRM / profile service | Hard filters on catalog queries |
| Budget tier, loyalty status | CRM | Bias price range and perks |
| The catalog itself | Sanity (Sanity Context) | Source of recommendable products |

### Configure the Context document

There is no per-user scoping here, because the catalog is public content. Reuse the public catalog document or keep a recommendations-tuned one.

**MCP configuration**

```text
title:        "Recommendations Assistant"
name:         "recommendations-assistant"
sources:      your project's production dataset
groqFilter:   _type == "product" && status == "published" && inStock == true
instructions: |
  You recommend products from the catalog. Personalization signals about the
  current shopper are provided in the system prompt, treat them as inputs.
  - Respect any stated size: filter on variants[].size.
  - Exclude SKUs the shopper already owns (provided as a list).
  - For taste-based queries, rank with text::semanticSimilarity() over
    title + description using the shopper's taste summary.
  - Stay within the shopper's budget tier unless they ask to see more.
```

### Enrich the session, then inject the signals

Identify the user from the verified session, pull their signals from the systems that own them, then inject those signals into the system prompt as inputs the model uses to form catalog queries.

**app/api/recommendations/route.ts**

```typescript
// app/api/recommendations/route.ts
import {createMCPClient} from '@ai-sdk/mcp'
import {streamText, convertToModelMessages} from 'ai'
import {anthropic} from '@ai-sdk/anthropic'
import {auth} from '@/lib/auth'
import {getUserSignals} from '@/lib/commerce' // talks to OMS/CRM, NOT Sanity

const MCP_URL =
  'https://api.sanity.io/v1/context/organizations/' +
  `${process.env.SANITY_ORGANIZATION_ID}/mcp/recommendations-assistant`

export async function POST(req: Request) {
  // 1. Identify the user from the verified session (not the request body).
  const session = await auth(req)
  if (!session?.user?.id) return new Response('Unauthorized', {status: 401})

  // 2. Pull signals from the systems that OWN them. Sanity is not involved here.
  const {sizes, ownedSkus, preferredBrands, budgetTier, tasteSummary} =
    await getUserSignals(session.user.id)

  const {messages} = await req.json()

  // 3. Connect to the public catalog. No per-user groqFilter needed,
  //    personalization is about shaping queries, not hiding data.
  const mcp = await createMCPClient({
    transport: {
      type: 'http',
      url: MCP_URL,
      headers: {Authorization: `Bearer ${process.env.SANITY_ORGANIZATION_TOKEN}`},
    },
  })
  const tools = await mcp.tools()

  // 4. Inject the signals as context the model uses to form catalog queries.
  const system = `
You are Acme's personal shopping assistant for a signed-in customer.
Recommend products from the catalog (via the Sanity tools), tailored to the
shopper profile below. Order and account questions are not yours, defer those.

Shopper profile (server-provided, trusted):
- Sizes: ${sizes.join(', ') || 'unknown'}
- Preferred brands: ${preferredBrands.join(', ') || 'none on file'}
- Budget tier: ${budgetTier}
- Taste summary: ${tasteSummary}
- Already owns (exclude these SKUs): ${ownedSkus.join(', ') || 'none'}

Rules:
- Use the shopper's sizes and brands as filters; exclude owned SKUs.
- For "something like X" or vibe requests, rank by semantic similarity to the
  taste summary.
- Recommend only real catalog items returned by the tools, never invent.
- Render results as product cards for the UI.
`.trim()

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system,
    messages: convertToModelMessages(messages),
    tools,
    stopWhen: ({steps}) => steps.length >= 8,
    onFinish: () => mcp.close(),
  })

  return result.toUIMessageStreamResponse()
}
```

### What changed from scoping Sanity to the user

- **Sanity stays the catalog layer.** It's queried for recommendable products, not for the user's private records, which it doesn't hold.
- **Signals flow in as context, not as access scope.** Personalization shapes which catalog queries the agent writes and how it ranks, rather than restricting what it can see.
- **Privacy lives at the app layer.** Purchase history and profile are sensitive, so they're handled server-side and injected into the prompt. They never reach the client and shouldn't be written to verbose logs. There's no Sanity-side data-leakage boundary to fail closed, because the catalog is public.

**When does per-user visibility scoping apply?** If you genuinely store user-owned documents in Sanity, such as saved items, personalized landing pages, or a SaaS where each customer's content lives in the dataset, then a per-request `groqFilter` scoped to a session-derived ID is the right tool. Add a fail-closed base filter like `_id == "never-matches"`, and take the ID only from the verified session. For the common ecommerce case, the enrichment-driven personalization above is the better fit.

## Sanity Context in a multi-backend agent

Most real agents talk to more than one backend: Sanity Context for structured content, plus a commerce API for live inventory, a payments system, a support-ticket tool, internal microservices, web search, and so on. The first thing to understand is how the agent decides which one to call.

### There is no built-in router

Every backend you connect exposes its capabilities as tools, and all of those tools land in one flat list that the model sees on each turn. The model chooses which tool to call by matching each tool's name and description against the conversation. That's the whole mechanism. There is no layer underneath that inspects a question and routes it to the right system. You are the router, and you express routing through tool descriptions, the system prompt, and how you scope each backend.

This matters specifically for Sanity Context because its three tools, `groq_query`, `schema_explorer`, and `initial_context`, are intentionally generic. They describe a query mechanism, not a domain. Sanity Context will never advertise itself as "the product catalog." So if you also connect a commerce MCP with a `search_products` tool, the model now sees two plausible ways to find products and will route inconsistently unless you disambiguate. The fix is to supply the domain framing the generic tools lack.

### Decide ownership first

Before writing any prompt, write down which system is the source of truth for each kind of data. This table is the thing you'll encode everywhere else.

##### Source-of-truth ownership

| Data | Source of truth | Why |
| --- | --- | --- |
| Catalog, articles, help/FAQ, marketing copy | Sanity (Sanity Context) | Structured, editorially owned, queryable |
| Live inventory, order status, shipping | Commerce / OMS API | Real time, changes by the second |
| Payments, refunds | Billing system | System of record, side-effecting |
| Support tickets | Helpdesk tool | Owns the conversation history |

The rule of thumb: Sanity owns "what is this thing and how do we describe it." Operational systems own "what is its live state right now." Keep that split clean and most routing questions answer themselves.

### Four levers, cheapest to most powerful

1. **A routing table in the system prompt.** This is the highest-leverage, do-it-first move. Turn the ownership table into explicit instructions:

```text
Data ownership, pick the right tool:
- Catalog, articles, help/FAQ content -> Sanity tools (groq_query, etc.)
- Live order status and inventory counts -> Commerce API tools
- Refunds and billing -> Billing tools
- Support tickets -> Helpdesk tools

When a question spans systems, get canonical IDs and descriptions from
Sanity first, then look up live state in the system of record.
Never answer about live inventory or order status from Sanity content.
```

1. **Make the boundaries real, not just described.** Use Sanity Context's `groqFilter` so Sanity cannot return things it shouldn't own, and use the instructions field to say what isn't in the dataset ("live stock is not stored here, use the inventory tool"). Now a misroute to Sanity returns nothing and the model self-corrects. Structural scoping beats prompt instructions because it fails safe: the agent can't leak across a boundary that doesn't physically exist.
2. **Shape the tool set in your app before handing it to the model.** `mcp.tools()` returns a plain object keyed by tool name. You can subset it, merge backends deliberately, and, because the keys and descriptions are just data, give Sanity Context's generic tools clearer, domain-loaded framing:

```typescript
const sanityTools = await sanityMcp.tools()
const commerceTools = await commerceMcp.tools()

// Re-describe the generic Sanity tools so the model knows their domain.
const tools = {
  ...commerceTools, // live order/inventory tools, already domain-named
  query_content: {
    ...sanityTools.groq_query,
    description:
      'Query the CONTENT catalog (products, articles, help docs) in Sanity. ' +
      'Use for descriptions, specs, copy, and canonical IDs, NOT live stock or orders.',
  },
  explore_content_schema: sanityTools.schema_explorer,
}
// streamText({ tools, system, messages, ... })
```

Fewer, more distinct tools route better than many overlapping ones.

1. **For real complexity, don't use one mega-agent.** Two patterns scale better than dumping every MCP into a single loop. With pre-classification, a cheap first model call decides the domain ("content," "orders," or "billing"), and you expose only that backend's tools for the actual answer. With a supervisor plus sub-agents, a router agent delegates to a Sanity sub-agent and a commerce sub-agent, each holding only its own tools. Small, unambiguous tool lists improve accuracy and cut cost, because every connected MCP adds its tool definitions to the token bill on every turn.

### Cross-system answers are a feature

The handoff is the point, not just a hazard to avoid. The clean pattern resolves a canonical ID and editorial detail from Sanity, then hands off to the operational system for live state:

```text
User: "Is the Trailblazer jacket in stock in medium, and what's it made of?"

1. Sanity (query_content):   find the jacket -> { sku: "TJ-001", material: "recycled nylon", ... }
2. Commerce API (get_stock): live inventory for SKU "TJ-001", size M -> 4 in stock
3. Agent composes:           material from Sanity, stock count from the live system
```

Sanity Context is well suited to being the "what is this thing" layer that resolves a canonical ID and editorial detail, then hands off to the operational system for live state. Guide the agent to do exactly that ordering in the prompt.

### Routing checklist

- Keep the tool count per agent low. Split into sub-agents before the list gets long.
- Give every tool a description that names its domain and its boundary ("...not live stock").
- Encode the source-of-truth table in the system prompt verbatim.
- Scope each backend so overlap is physically impossible, not just discouraged.
- Test the ambiguous cases explicitly. The classic trap is "where's my order?" when both a CMS order archive and a live order API exist.
- Watch latency and token cost. Each connected MCP is paid for on every turn.

## Next steps

If you haven’t already, follow the setup guide for [Sanity Context](https://www.sanity.io/docs/ai/sanity-context). To scaffold a project, the Context helper skills set up the MCP configuration, an agent, a chat UI, and walk you through writing the instructions field and the system prompt:

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





## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity Context v2.0.0: Insights moves to the Context app, and the Studio plugin is deprecated](https://www.sanity.io/docs/changelog/context-pkg-Mi4wLjA.md) — September 3, 2026