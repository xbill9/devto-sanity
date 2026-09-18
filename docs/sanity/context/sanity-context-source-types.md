<!-- Source: https://www.sanity.io/docs/ai/sanity-context-source-types (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Knowledge Base source types

Dataset, website, and file sources for a Knowledge Base: what each accepts, how it is scoped, and which file formats a file source reads.

> [!WARNING]
> Beta
> Knowledge Bases are available as an opt-in beta feature. Features and limits may change before general availability. If you are on an Enterprise plan and need higher limits, talk to your Sanity representative.



A Knowledge Base draws on three kinds of source. A dataset source reads documents from a Sanity dataset, a website source crawls from a starting URL, and a file source ingests uploaded documents. One Knowledge Base can combine all three kinds, and it needs at least one source. Dataset and website sources are re-checked on the Knowledge Base's refresh schedule. That schedule is one setting for the whole Knowledge Base rather than a setting per source, and uploaded files are never re-checked.

## Dataset sources

Documents from a Sanity dataset, selected with a complete GROQ query such as `*[_type == "article"]`. Add a projection to control what each document carries, as in `*[_type == "article"]{title, body}`. The query has to select documents from the dataset, so a bare filter such as `_type == "article"` is rejected. Start with a narrow query; you can widen it later.

A Knowledge Base binds one dataset. To point at a different dataset, remove the dataset source and add a new one; the query itself stays editable. Website and file sources can be added repeatedly. A dataset source reads published documents only, and a query that matches nothing is rejected. Connecting one takes a role on the source project that can create datasets, which among the default roles means Administrator or Developer, plus unrestricted read access to the dataset itself. A role whose read grant is filtered to a subset of documents is not enough. One dataset source matches at most 5,000 documents, so narrow the query if you exceed that.

## Website sources

A crawl starting from a URL. Crawls respect `robots.txt`. Use the most specific URL you can. A docs section is usually more useful than a whole domain.

## File sources

Uploaded files never re-sync. To update one, delete the import and upload the new version; deleting an import removes every source it produced. Archives are expanded and their contents ingested individually, each by its own format.

A file source reads the formats below, subject to the size limits shown.

##### File formats and size limits

| Format | Maximum size |
| --- | --- |
| PDF | 500 MB |
| DOCX | 100 MB |
| PPTX | 100 MB |
| XLSX | 50 MB |
| HTML | 25 MB |
| PNG, JPEG, WebP, TIFF | 25 MB. Images under 50 KB skip text extraction. |
| AsciiDoc | 25 MB |
| Markdown, plain text | Ingested directly |
| Source code, JSON, XML, CSV, TSV, YAML, and other plain-text formats | Ingested verbatim |
| ZIP, TAR, and TAR.GZ archives | Expanded, then each file ingested by its own format |

Around forty further text formats are ingested verbatim in the same way, so the table is not the full list of what a file source reads. A file in a format with no handler is not rejected: it is recorded with its metadata, but its contents are not read. Every upload is capped at 5 GiB, and for the formats listed above the per-format limit applies first.

## Choosing between connecting and uploading

If the material changes regularly, connect it as a dataset or website source rather than uploading a snapshot. Uploads are right for material that is fixed, or that has no addressable source, such as a signed policy PDF or an export from a system Context cannot reach.

## Next steps

- [Create a Knowledge Base](https://www.sanity.io/docs/ai/sanity-context-create-knowledge-base). Add a source and run the first build.
- [Keep a Knowledge Base current](https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base). Which sources refresh, and how often.

