<!-- Source: https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Keep a Knowledge Base current

Set refresh schedules for dataset and website sources, respond to change detection, and decide when to rebuild.

> [!WARNING]
> Beta
> Knowledge Bases are available as an opt-in beta feature. Features and limits may change before general availability. If you are on an Enterprise plan and need higher limits, talk to your Sanity representative.



Your sources keep changing after you build. Dataset and website sources can refresh on a schedule; uploaded files stay as they are until you replace them. This guide covers keeping a built Knowledge Base in step with its sources.

## Prerequisites

A Knowledge Base with at least one completed build. See [Create a Knowledge Base](https://www.sanity.io/docs/ai/sanity-context-create-knowledge-base).

## Set a refresh schedule

Website sources and connected datasets can refresh on a schedule. In **Settings**, set **Refresh interval** to **Weekly**, **Monthly**, or **Off**. New Knowledge Bases default to **Weekly**, and the setting saves as soon as you select it. The field appears only when the Knowledge Base has a website or a dataset source.

A refresh does not rewrite your entries. It recrawls the sources, compares them against the last build, and files issues describing what needs to change. Your entries change when you apply those issues, so a schedule on its own does not keep a Knowledge Base current. While issues are open, the Knowledge Base sits in **Review** and keeps serving the entries from the last build.

## Respond to detected changes

When the material changes, the Knowledge Base overview shows **Changes detected**. Click it to see what changed in each source, or click **Check for changes** to run a refresh now instead of waiting for the next scheduled run. Applying the issues a refresh files keeps unchanged entries where they are: the outline changes only where the material has changed shape.

Agents receive refreshed content through the same outline, so no change is needed on the agent side. If you have inlined initial context into a system prompt, refetch it after a rebuild. See [Inline initial context into your system prompt](https://www.sanity.io/docs/ai/sanity-context-initial-context).

## Replace an uploaded file

Uploaded files remain unchanged until you replace them. If a document is revised regularly, connect its source instead of uploading a snapshot so refreshes pick the change up on their own.

## Decide between a refresh and a full rebuild

A refresh files issues; applying them updates only the entries the changed material affects. A full rebuild reruns the whole pipeline over the current sources and replaces the outline. Every entry is written again, so anything the previous build decided is reconsidered.

Rebuild when the Knowledge Base overview shows a **Rebuild required** callout, when you have changed the Knowledge Base's purpose, when the overview reports that pipeline improvements are available, or when the Knowledge Base has only uploaded files and so has no refresh path. A purpose change is the one case nothing else flags: the refresh compares sources only, so **Check for changes** reports nothing after you edit the purpose. Adding a source does not need a rebuild, since new material arrives as issues once the upload finishes ingesting.

A build you regret is not final. In **Entries**, open an earlier version of the outline and select **Restore this version** to republish that build's entries. The restore holds until the next build overwrites it, so use it to buy time while you fix the purpose, sources, or instructions that caused the bad build.

## Next steps

- [Resolve Knowledge Base issues](https://www.sanity.io/docs/ai/sanity-context-resolve-issues). Handle the conflicts a refresh or a rebuild surfaces.
- [Knowledge Base source types](https://www.sanity.io/docs/ai/sanity-context-source-types). Which sources can refresh and which cannot.

