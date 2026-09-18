<!-- Source: https://www.sanity.io/docs/ai/sanity-context-retrieval-modes (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Context retrieval modes

How GROQ mode and Knowledge Bases differ, when each one fits, and where dataset embeddings bridge the two.

Sanity Context has two retrieval modes, and they solve different problems. GROQ mode queries your dataset at request time. Knowledge Base mode serves an index built from your material ahead of time. The mode determines which tools Context MCP serves and how an agent finds an answer.

## When GROQ mode fits

Use GROQ mode when the content is structured and consistent, and the schema tells the agent where to look. "Size L latex gloves, under $200 a pallet" is a filter over product documents. It stays exact across hundreds of thousands of records, with no build step and nothing else to keep in sync.

If the content model is simple and you give the agent good schema hints, even a small model can be good at this.

One prerequisite comes with it: an MCP with a dataset source needs a deployed schema for that project and dataset (run `sanity schema deploy` from a Studio on v5.1.0 or later), since that is where the GROQ tools read the schema. An MCP with only Knowledge Base sources doesn't.

## When Knowledge Base mode fits

Use a Knowledge Base when locating the answer is the hard part. "Is this industrial latex food-safe?" may depend on a specification, a compliance memo, and a support article. The pre-generated index gives the agent a strong hypothesis about where the answer lives before it starts reading.

Building from Sanity data also gives you somewhere to apply corrections. When an issue comes from conflicting content, fix the content in the dataset. The next build inherits the correction. See [Knowledge Bases](https://www.sanity.io/docs/ai/sanity-context-knowledge-bases).

## Content that sits between the two

Use GROQ mode for tabular data and Knowledge Bases for knowledge. For cases in between, such as a catalog where useful details live in prose fields, enable [dataset embeddings](https://www.sanity.io/docs/content-lake/dataset-embeddings) and stay in GROQ mode. GROQ can then combine structured filters with semantic similarity in the same query.

Enabling embeddings is how you cover that middle ground, not mixing source types. An MCP serves one source type: if you attach both a dataset source and Knowledge Base sources, the dataset source wins and the Knowledge Base sources are ignored. The agent gets the GROQ tools, no way to read the Knowledge Bases, and no error explaining why.

## When to enable embeddings

Enable embeddings when your agent needs to query content and won't be able to guess accurately the words or phrases to search for. Product catalogs, help content, and editorial articles are good candidates. Dataset embeddings carry their own costs and quotas; see [Dataset Embeddings](https://www.sanity.io/docs/content-lake/dataset-embeddings) for details.

> [!NOTE]
> Semantic search only ranks; it doesn't filter
> The `text::semanticSimilarity()` function is only valid as an argument to `score()`. Used anywhere else it returns an error. Narrow the candidate set with a filter first, then rank what's left.

## Switching modes

You don't set the mode directly. An MCP's sources determine it: attach a dataset source and the endpoint serves GROQ mode; attach only Knowledge Base sources and it serves Knowledge Base mode. Changing the sources changes what the endpoint serves without touching the agent. To override the mode for a single connection, add `?mode=groq` or `?mode=knowledge_base` to the endpoint URL. See [Configure an MCP](https://www.sanity.io/docs/ai/sanity-context-configure-mcp).

> [!WARNING]
> A skipped source can flip the mode
> Because the mode is derived from sources, a source that doesn't resolve changes what the endpoint serves. A dataset source id must be `<projectId>.<datasetName>`; a malformed id is skipped, and an MCP with no other dataset source becomes a Knowledge Base mode endpoint. The GROQ tools are gone, and if there are no Knowledge Base sources either, the connection is refused with `Mode is set to "knowledge_base" but no knowledge bases are configured. Add knowledge-base sources to the MCP endpoint, or switch mode to "groq".`

## Next steps

- [Configure an MCP](https://www.sanity.io/docs/ai/sanity-context-configure-mcp). Create an endpoint and attach the sources that set its mode.
- [Context MCP tools](https://www.sanity.io/docs/ai/sanity-context-mcp-tools). Which tools each mode serves.
- [Knowledge Bases](https://www.sanity.io/docs/ai/sanity-context-knowledge-bases). What a Knowledge Base holds and how it gets built.

