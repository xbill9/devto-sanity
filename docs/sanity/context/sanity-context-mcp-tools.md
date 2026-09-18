<!-- Source: https://www.sanity.io/docs/ai/sanity-context-mcp-tools (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Context MCP tools

Every tool Context MCP serves, by mode, with what each one returns and when an agent reaches for it.

Context MCP serves a different tool set depending on the mode the endpoint runs in. GROQ mode exposes tools for reading your schema and querying documents; Knowledge Base mode exposes tools for reading pre-built entries. The `initial_context` tool is served in both. Most agents use several over the course of a single conversation.

## GROQ mode tools

##### Tools served in GROQ mode

| Tool | Purpose |
| --- | --- |
| initial_context | Compressed schema overview plus instructions for querying your content. The /initial-context HTTP endpoint can replace it |
| schema_explorer | Returns detailed schema information for a specific type, including fields and references |
| groq_query | Executes a GROQ query against the dataset, subject to any groqFilter in effect |
| array_field_reader | Reads large array fields and Portable Text content from a single document |

## Knowledge Base mode tools

##### Tools served in Knowledge Base mode

| Tool | Purpose |
| --- | --- |
| initial_context | The outline of each Knowledge Base the endpoint serves. The /initial-context HTTP endpoint can replace it |
| knowledge_base_read | Reads the full content of one or more entries, by Knowledge Base id (the kb… value on the "Knowledge base id:" line above its outline in initial_context) and entry paths from the outline. Accepts up to 20 paths in one call |

Paths in the outline may carry a `[core]` or `[peripheral]` tag marking how central the entry is; untagged entries are standard. Read paths back verbatim. When several entries look relevant, read them in one call rather than sequentially. See [Knowledge Bases](https://www.sanity.io/docs/ai/sanity-context-knowledge-bases) for how a Knowledge Base is built and what the outline is.

## Tool parameters

Each tool takes its arguments as a JSON object. A call that omits a required parameter is rejected before the tool runs. Optional parameters fall back to the defaults below.

### `initial_context`

Takes no parameters. The endpoint's mode, its sources, and any `groqFilter` already determine what it returns.

### `groq_query`

#### Properties

**query** (string, required)

GROQ query to execute against the dataset. The endpoint's groqFilter is applied before the query runs.

A query that fails to parse comes back as an error result with the parser message included, not as a thrown exception. A successful response is an object with a `meta` block — `executedQuery`, `perspective`, `resultCount`, `returnedCount`, and, when content was cropped, `warnings` and `hint` — alongside `result`. Large arrays inside the returned documents are cropped individually rather than truncating the whole response; read the full field with `array_field_reader`.

### `schema_explorer`

#### Properties

**type** (string, required)

Schema type name, for example post.

**path** (string)

Navigate to a field within the type instead of returning the whole type, which is the default. Dot notation reaches nested objects (metadata.tags); content[] lists every item type in an object array and content[].language reaches one field across them; of[0] and content.of[0] index into an array type definition. Do not use brackets for reference arrays — query the referenced type directly with type instead.

Above 50 KB of JSON the tool returns a navigator to page through rather than the raw schema. It errors when the endpoint resolves no workspace, when the workspace has no schema, and when that schema declares no types.

### `array_field_reader`

#### Properties

**mode** ("range" | "filter" | "continue" | "outline", required)

range reads content by index, filter finds items matching criteria, outline returns a structural overview, and continue resumes an item a previous call cropped. There is no default; name one.

**documentId** (string, required)

The _id of the document to read from.

**field** (string, required)

Name of the array field to read, for example body or content.

**range** (object)

Used by range mode. startIndex is an integer, inclusive, defaulting to 0; endIndex is an integer, exclusive, defaulting to the array length. Both are clamped to the array's bounds rather than erroring, so an out-of-range index returns whatever exists.

**filter** (object)

Used by filter mode. Its fields are listed below.

**continue** (object)

Required by continue mode, which errors without it. blockIndex and offsetBytes are required integers and path is an optional string. Take all three from the continuationToken on the cropped response you are resuming.

The `filter` object accepts:

#### Properties

**textContains** (string)

Item text must contain this substring, case-insensitive.

**textContainsAny** (string[])

Item text must contain at least one of these substrings.

**textContainsAll** (string[])

Item text must contain all of these substrings.

**blockType** (string)

Match items by _type, for example block, image, or code.

**customType** (string)

Alias for blockType, for custom object types.

**hasImage** (boolean)

When true, the item must contain an image.

**key** (string)

Match a single item by its _key.

**minTextLength** (integer)

Minimum text length. No default.

**maxTextLength** (integer)

Maximum text length. No default.

**matchMode** ("any" | "all")

How multiple filters combine. Defaults to all, meaning every filter must match.

**context** (object)

Context window around each match: before and after, both integers defaulting to 0. Neighbouring items come back alongside the matches, deduplicated and in document order.

**limitBlocks** (integer)

Soft maximum number of items to return. Defaults to 50 and is capped at 50, so a larger value has no effect.

**pte** (object)

Filters specific to Portable Text blocks. styles is a string array matching blocks by style, such as h1 or h2; marksInclude is a string array where every listed mark must be present on at least one span.

`range` mode returns at most 30 items and crops each to 5,000 bytes; `filter` mode returns at most 50 items and crops each to 8,000 bytes. A cropped response carries a continuation token to pass back through `continue`. The tool errors when the document is not found, when the field is null or absent, and when the field is not an array of objects — which includes an empty array.

### `knowledge_base_read`

#### Properties

**knowledgeBase** (string, required)

The Knowledge Base to read from, identified by its id: the kb… value on the Knowledge base id: line above its outline in initial_context.

**paths** (string[], required)

One or more entry paths, taken verbatim from the outline. Minimum 1, maximum 20, and no path may be empty.

An id that matches no Knowledge Base on the endpoint errors with the list of ids that do match. Paths that resolve to nothing are reported in a note under the entries that did resolve, so a partly wrong call still returns content; only a call where every path misses is an error. Reading from an endpoint with no Knowledge Base attached errors outright.

The `arguments` object for each tool. Replace `DOCUMENT_ID` and `KNOWLEDGE_BASE_ID` with your own values; a Knowledge Base public id begins with `kb`.

**initial_context**

```json
{}
```

**groq_query**

```json
{
  "query": "*[_type == \"post\"][0...5]{_id, title}"
}
```

**schema_explorer**

```json
{
  "type": "post",
  "path": "content[]"
}
```

**array_field_reader**

```json
{
  "mode": "range",
  "documentId": "DOCUMENT_ID",
  "field": "body",
  "range": {"startIndex": 0, "endIndex": 20}
}
```

**knowledge_base_read**

```json
{
  "knowledgeBase": "KNOWLEDGE_BASE_ID",
  "paths": ["groq/functions", "studio/configuration"]
}
```

## Serve a subset of the tools

The `tools` URL parameter takes a comma-separated allowlist, for example `groq_query,schema_explorer`. Omitting it enables every tool the endpoint's mode serves. A name that is not a Context MCP tool is rejected with JSON-RPC error `-32602`. A valid tool name that the current mode does not serve is dropped silently, so an allowlist that names only out-of-mode tools yields an endpoint with no tools.

## List the tools on an endpoint

**Terminal**

```sh
curl -X POST https://api.sanity.io/v1/context/organizations/$ORGANIZATION_ID/mcp/$MCP_ENDPOINT_NAME \
  -H "Authorization: Bearer $SANITY_ORGANIZATION_TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

A successful response returns a JSON object with a `result.tools` array listing the tools available on that endpoint. A 401 means the token is missing or malformed. A 403 `contextGrantRequired` means the token is not an organization API token with Context Viewer permissions. Create one under Manage > API > Tokens at the organization level. See [Content access and security](https://www.sanity.io/docs/ai/sanity-context-security). An empty `result.tools` array means the `tools` allowlist named only tools the endpoint's mode does not serve. Drop the `tools` parameter to see everything the endpoint offers.

