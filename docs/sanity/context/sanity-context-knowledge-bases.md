<!-- Source: https://www.sanity.io/docs/ai/sanity-context-knowledge-bases (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Knowledge Bases

A Knowledge Base is a pre-built index over material you choose, attached as sources and served to agents through Context MCP. 

> [!WARNING]
> Beta
> Knowledge Bases are available as an opt-in beta feature. Features and limits may change before general availability. If you are on an Enterprise plan and need higher limits, talk to your Sanity representative.



A Knowledge Base belongs to an organization and can draw on sources from more than one project. Instead of reading and reconciling sources at query time, a build reads them ahead of time, resolves conflicts, and writes a set of entries an agent can retrieve from directly.

An agent is only as good as the knowledge it can find. Information spread through prose is the hard case (documents in a Sanity dataset, website subfolders, PDFs, and other files). A Knowledge Base raises that ceiling by reconciling it ahead of time rather than on every question. For when to reach for one instead of GROQ mode, see [Context retrieval modes](https://www.sanity.io/docs/ai/sanity-context-retrieval-modes). To build one, see [Create a Knowledge Base](https://www.sanity.io/docs/ai/sanity-context-create-knowledge-base).

An organization admin can enable Context Knowledge Bases from the [Labs page](https://www.sanity.io/manage/org/labs) of your organization in Manage.

## The purpose

Every Knowledge Base has a purpose: one or two sentences describing who it serves and what it should help with. You write it when you create the Knowledge Base, and it works at both ends of the pipeline.

During a build, the purpose steers the outline. The tree of topics is designed against it, and it decides how central each entry is: subjects the purpose names come out tagged `[core]`, supporting material is standard, and content that merely arrived with the sources is tagged `[peripheral]`.

Agents read the purpose too. It heads the outline in initial context, right after the title, so it frames what the Knowledge Base is for before the agent chooses what to read.

## The outline

The outline is the pre-generated index for a Knowledge Base. It contains every entry path and a one-line summary of what the entry covers. Entries that are more or less central to the purpose carry a `[core]` or `[peripheral]` tag.

**Outline**

```text
## Acme product knowledge — Product specs, shipping, and support policies
4 entries.

products/latex/gloves [core]
  Glove grades, sizes, and what each is rated for
  topics: Grades, Sizing, Ratings

products/latex/industrial [peripheral]
  Industrial latex specs and tolerances

shipping/import-routes
  Customs paperwork and lead times by region
  related: support/returns

support/returns
  Return windows, exceptions, and who pays the freight
```

The outline is small enough for an agent to hold in context for an entire conversation. When a question arrives, the agent checks the outline, selects the entries most likely to contain the answer, and fetches those entries. Asked about return windows, it goes straight to `support/returns`.

Context MCP serves the outline through the `initial_context` tool, the orientation step at the start of a conversation. Every path in the outline is a readable entry; the hierarchy lives in the slash-delimited paths rather than in separate grouping rows. See [Context MCP tools](https://www.sanity.io/docs/ai/sanity-context-mcp-tools).

## Entries

Each entry is a Markdown document written from the Knowledge Base's sources, with citations back to the original source.

Entries belong to a build. Every build can rewrite them, and they cannot be edited by hand. To change what a Knowledge Base says, update the source or add an instruction.

## Issues

The same fact often appears in more than one place, and the copies drift. A help center says returns are accepted within 30 days; a product page says 45. Leaving the decision until query time asks the agent to reconcile the conflict every time someone asks.

A Knowledge Base detects conflicts during the build and raises an issue. The issue shows the claims side by side with where each came from, and you resolve it by choosing which claim is ground truth. Issues also flag structural problems: a topic the outline misses, an entry whose sources are gone, or one that has grown to cover two subjects. You apply those rather than resolving them. Coverage gaps are recorded but not surfaced for review. For how to work through the issues you can act on, see [Resolve Knowledge Base issues](https://www.sanity.io/docs/ai/sanity-context-resolve-issues).

## Instructions

Instructions are standing decisions. Use them for anything Context should remember between builds, such as which source to trust when claims differ or how to describe a policy. Each instruction is tied to one or more sources, which is what lets a build retire it when those sources change. Resolving a conflict produces one.

You can also write instructions yourself in the **Instructions** view of the Context app: state the rule in plain language and choose the sources it anchors to. A rule shapes every entry that cites its sources, and it applies when those entries are next written, so rebuilding an entry from the outline applies a new rule right away. When you save a rule, Context checks the entries citing its sources and flags any that contradict it.

Building from Sanity data also gives you somewhere to apply corrections. When an issue comes from conflicting content, fix the content in the dataset. The next build inherits the correction, and an instruction the updated sources no longer support is archived automatically and surfaced for you to review.

## What a build does

A build reads the sources, creates a tree of topics, writes each entry, and checks the result. Contradictions and structural problems surface as issues for you to review.

The tree follows what the sources are about rather than folder structure, URL paths, or file names. Three overlapping PDF manuals and a documentation site can become one set of topics. Each fact should have one home, and everything the sources cover should appear somewhere in the tree.

This work happens during the build. When an agent receives a question, the outline is ready and ambiguities have already been handled.

## Next steps

- [Create a Knowledge Base](https://www.sanity.io/docs/ai/sanity-context-create-knowledge-base): build one from your sources and review the result.
- [Knowledge Base source types](https://www.sanity.io/docs/ai/sanity-context-source-types): what datasets, websites, and files each accept.
- [Keep a Knowledge Base current](https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base): refresh schedules and rebuilds.

