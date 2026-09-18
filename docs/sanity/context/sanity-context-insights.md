<!-- Source: https://www.sanity.io/docs/ai/sanity-context-insights (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Add insights to Sanity Context

Sanity Context insights tracks and analyzes your agent conversations

Sanity Context Insights captures conversations between your users and your AI agent and classifies them with an LLM. Once set up, Insights appears in the Context app in the Sanity Dashboard, showing where the agent succeeds, where it struggles, and what content is missing. Use this data to improve the agent over time.

![A screenshot of the Context insights dashboard showing trends, scores, sentiments, recent conversations, activity and KPIs.](https://cdn.sanity.io/images/3do82whm/next/2bc26893a293ea0c5c3a22ba82c14587bbe88a87-2460x1692.png)

## How it works

Sanity Context insights has two parts that work together:

- **Telemetry**: saves conversations from your chat application to your organization's Context store.
- **Classification**: a scheduled function that analyzes saved conversations with AI, extracting success scores, sentiment, and content gaps.

Telemetry alone stores raw conversations. Classification populates Insights in the Context app. You need both.

## Classification metrics

##### Classification metrics

| Metric | Type | Description |
| --- | --- | --- |
| successScore | 1–10 | How well the agent resolved the user's needs |
| sentiment | positive / neutral / negative | Overall user tone |
| contentGaps | string[] | Topics where the agent lacked information |

## Prerequisites

- **Code running Sanity Context**: [Follow the setup instructions](https://www.sanity.io/docs/ai/sanity-context). The code examples below will add to your existing implementation.
- Your **organization ID**: find it in [Manage](https://www.sanity.io/manage/org/settings) or in your organization's URL.
- An **organization API token**, created under Manage > API > Tokens at the organization level. Conversations are saved to your organization's Context store, not to a project dataset, so no dataset write token is involved. Keep the token server-side.
- **LLM API key**: For classifying conversations, you'll need an API key from an LLM provider (Anthropic, OpenAI, etc.).

## Setup

### Step 1: Enable telemetry integration

#### AI SDK

Add `sanityInsightsIntegration` to your existing `streamText` calls:

**chat/route.ts**

```typescript
import {createClient} from '@sanity/client'
import {sanityInsightsIntegration} from '@sanity/context/ai-sdk'
import {streamText} from 'ai'

// Org-scoped client. Keep the token server-side only.
const client = createClient({
  apiVersion: 'v2025-11-27',
  token: process.env.SANITY_API_TOKEN,
  context: {organizationId: process.env.SANITY_ORGANIZATION_ID},
  useCdn: false,
  useProjectHostname: false,
})

const result = streamText({
  model: yourModel,
  messages,
  experimental_telemetry: {
    isEnabled: true,
    integrations: [
      sanityInsightsIntegration({
        client,
        threadId: chatId, // Any unique string per conversation
        // The well-known mcpEndpoints key tags the conversation with an MCP endpoint name
        metadata: {mcpEndpoints: process.env.SANITY_CONTEXT_ENDPOINT_NAME ?? []},
      }),
    ],
  },
})
```



#### Custom integration

If you're not using Vercel's AI SDK, save the transcript directly with `client.context.conversations.save`. Call it after each turn with the full conversation history; repeated saves with the same `threadId` update the same conversation.

**chat/route.ts**

```typescript
import {createClient} from '@sanity/client'

const client = createClient({
  apiVersion: 'v2025-11-27',
  token: process.env.SANITY_API_TOKEN, // Keep server-side only
  context: {organizationId: process.env.SANITY_ORGANIZATION_ID},
  useCdn: false,
  useProjectHostname: false,
})

await client.context.conversations.save({
  threadId: chatId, // Any unique string per conversation
  messages: [
    {role: 'user', content: 'How do I return an item?'},
    {role: 'assistant', content: 'You can return items within 30 days...'},
  ],
  // Optional: tag with the MCP endpoint name(s) the agent used
  metadata: {mcpEndpoints: ['support-agent']},
})
```



The `metadata` option tags a conversation with your own dimensions: up to 20 keys, each holding a string or an array of strings, such as plan, environment, or app version. The `mcpEndpoints` key is well-known: set it to the name of the MCP endpoint the agent used, and the endpoint filter in the Context app groups the conversation under that endpoint.

### Step 2: Deploy the classification function

The classification function is a scheduled job that runs outside your app using [Sanity Functions](https://www.sanity.io/docs/functions/scheduled-function-quickstart). It finds unclassified conversations and analyzes them with an LLM of your choice. The classification interval, how often the function runs, is up to you. You may want it to run once a day to accommodate daily updates, or more frequently if your agent receives more traffic.

Here's an example function:

**functions/classify-conversations/index.ts**

```typescript
import {anthropic} from '@ai-sdk/anthropic'
import {createClient} from '@sanity/client'
import {classifyConversations} from '@sanity/context/insights'
import {scheduledEventHandler} from '@sanity/functions'

export const handler = scheduledEventHandler(async () => {
  const client = createClient({
    apiVersion: 'v2025-11-27',
    token: process.env.SANITY_API_TOKEN,
    context: {organizationId: process.env.SANITY_ORGANIZATION_ID},
    useCdn: false,
    useProjectHostname: false,
  })

  const result = await classifyConversations({
    client,
    // Optional: only classify conversations tagged with this MCP endpoint
    mcpEndpoint: process.env.SANITY_CONTEXT_ENDPOINT_NAME,
    model: anthropic('claude-haiku-4-5'),
  })

  console.log(
    `Classified ${result.successCount}/${result.totalFound} conversations${result.errorCount > 0 ? ` (${result.errorCount} failed)` : ''}`,
  )
})
```

For blueprint configuration, deployment, and token setup, see the [Sanity Functions documentation](https://www.sanity.io/docs/functions/scheduled-function-quickstart).

## Primitives reference

##### Primitives reference

| Primitive | Import | Purpose |
| --- | --- | --- |
| sanityInsightsIntegration | @sanity/context/ai-sdk | AI SDK telemetry integration |
| client.context.conversations.save | @sanity/client | Save a conversation transcript directly |
| getConversationsToClassify | @sanity/context/insights | Fetch conversations ready for classification |
| getPreviousContentGaps | @sanity/context/insights | Fetch known content gaps to avoid duplicates |
| classifyConversation | @sanity/context/insights | Classify a conversation and write results back |
| classifyConversations | @sanity/context/insights | Classify all pending conversations and write results back. Wraps the three primitives above. |

## Telemetry sharing

You can opt in to share conversation telemetry with Sanity. Both levels are off by default. Set `sharing` where you save conversations, on the telemetry integration or on direct saves:

- `metrics`: shares classification metrics (scores, sentiment, content-gap and message-shape counts), model info, and token usage. No conversation content is included.
- `conversations`: also shares full transcripts, and implies metrics. Provide a contact so the team can reach out and help dial in your agent.

**chat/route.ts**

```typescript
sanityInsightsIntegration({
  client,
  threadId: chatId,
  sharing: {
    metrics: true,
    conversations: true,
    contact: 'you@company.com',
  },
})
```



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity Context v2.0.0: Insights moves to the Context app, and the Studio plugin is deprecated](https://www.sanity.io/docs/changelog/context-pkg-Mi4wLjA.md) — September 3, 2026
- [Sanity Context v0.6.0: Simplified conversation classification with new wrapper function](https://www.sanity.io/docs/changelog/agent-context-pkg-MC42LjA.md) — May 13, 2026
- [Sanity Context v0.4.0: Introducing Agent Context Insights for conversation tracking and analysis](https://www.sanity.io/docs/changelog/agent-context-pkg-MC40LjA.md) — May 4, 2026