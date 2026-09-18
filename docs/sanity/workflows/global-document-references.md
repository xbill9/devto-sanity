<!-- Source: https://www.sanity.io/docs/workflows/global-document-references (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Global document references

Why every document pointer in a workflow carries its location, and how resource aliases keep deployed definitions portable across environments.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



A workflow’s own [documents](https://www.sanity.io/docs/content-lake/documents) (the instance, its guards) live in one place, but the content it governs often lives somewhere else: another [dataset](https://www.sanity.io/docs/content-lake/datasets), another [project](https://www.sanity.io/docs/platform-management/projects-organizations-and-billing), sometimes [Canvas](https://www.sanity.io/docs/canvas/introduction-to-canvas) or the [Media Library](https://www.sanity.io/docs/media-library/introduction). A normal [Sanity reference](https://www.sanity.io/docs/studio/reference-type) (`_ref`) only points within a single dataset, so it cannot cross that boundary. The engine works across a whole [organization](https://www.sanity.io/docs/platform-management/projects-organizations-and-billing), so everywhere it points at a document it uses a *global document reference*, a GDR: a reference that carries both which document and where it lives.

## One workflow across resources

A workflow can keep its data in one resource while the content it coordinates stays in others: editorial documents in another project, campaign assets in a Media Library. The workflow stores references rather than copies, so the content stays where its own editors and permissions already are. [Coordinate content across projects and datasets](https://www.sanity.io/docs/workflows/cross-resource-workflows) sets one up end to end: choosing the resources, binding aliases per environment, routing foreign resources to their own clients, and proving the routing before you rely on it.

## The GDR shape

A GDR is a small object, an `id` and a `type`:

```typescript
import {refDataset} from '@sanity/workflow-engine'

// an article in the "production" dataset of project "yourprojectid"
const subject = refDataset({
  projectId: 'yourprojectid',
  dataset: 'production',
  documentId: 'article-1',
  type: 'article',
})
// → { id: 'dataset:yourprojectid:production:article-1', type: 'article' }
```

That `id` is not a bare document ID. Everywhere else in Sanity a reference is bare: a document’s `_id` or the `_ref` inside a reference, like `"article-1"`. A GDR’s `id` carries the resource prefix, because the engine has to know which project and dataset (or which Canvas, Media Library, or [Dashboard](https://www.sanity.io/docs/dashboard/dashboard-introduction) resource) holds the document. The scheme leads:

```typescript
// A GDR id is a typed URI:
//   dataset:<projectId>:<dataset>:<documentId>
//   canvas:<resourceId>:<documentId>
//   media-library:<resourceId>:<documentId>
//   dashboard:<resourceId>:<documentId>
export type GdrScheme = 'dataset' | 'canvas' | 'media-library' | 'dashboard'
export type GdrUri = `${GdrScheme}:${string}`
```

The `type` is the document’s [schema type](https://www.sanity.io/docs/studio/schema-types), carried so a reader knows what it points at without a second lookup.

Build one with the per-scheme constructors (`refDataset`, `refCanvas`, `refMediaLibrary`, `refDashboard`), and call `extractDocumentId` to get the bare `_id` back when you need it (for a `*[_id == $id]` query, for example). If you pass a bare ID where a GDR belongs, TypeScript rejects it, so an ID with no location can never reach a filter or a stored field. There is one deliberate exception: a literal `initialValue` seed in a definition may name a bare ID, and the engine roots it at the workflow’s home resource when the instance resolves the field.

## Use stable dataset document IDs

A dataset GDR identifies the logical document. Pass its stable ID, such as article-1. Do not pass drafts.article-1 or versions.<release>.article-1. The workflow perspective selects the draft, published document, or release version to read.

## Where you meet a global document reference

You meet global document references wherever a workflow names a document: the subject passed at start, doc.ref and doc.refs fields, release.ref, and the ancestor chain. A start.filter reads the loaded candidate document. Start requirements read the caller-supplied input fields.

Compare global document references directly. Do not build resource-qualified strings yourself. Use a single-subject start requirement when only one unfinished run of the same definition may exist for a subject. See Conditions for start filters, requirements, and their available values.

In the rendered scope the instance refers to itself as `$self`, its own GDR. That location-carrying `id` is also what lets a workflow read content it does not live next to: when a filter dereferences a subject in another dataset, the engine routes the read to a [client](https://www.sanity.io/docs/apis-and-sdks/js-client-getting-started) for that GDR’s resource. A `resourceClients` resolver you give `createEngine` takes priority whenever it returns a client. Otherwise the engine derives a sibling client from the workflow client’s own credentials. A single-dataset setup never notices any of this, and a cross-dataset or cross-project one works with no extra wiring, as long as you have an organization-capable [token](https://www.sanity.io/docs/content-lake/http-auth). A client that cannot derive siblings makes a foreign GDR fail loudly instead of reading the wrong place.

The same shape flows into effects. When you bind a referenced id into an effect (`bindings: {assetId: '$fields.asset._id'}`), the value the handler receives is that document’s GDR URI. Turn it into a bare ID with `extractDocumentId`. And `$fields.asset._id` resolves from the stored reference itself, so identity reads never load the referenced document at all. Content reads (`$fields.asset.title`, for example) dereference into the loaded document. The engine reaches the Media Library by deriving a sibling client from the workflow client’s own credentials. Wire `resourceClients` when that resource needs different credentials. To make a Media Library ref a write target, you must also serve the resource.

The engine exposes GDRs directly because it is organization-wide by design. Writing a `doc.ref` value or wiring up `resourceClients` means working with GDRs explicitly.

## What a runtime ref may target

Reading and writing allow different sets of resources. A read can reach a resource through the derived-sibling fallback. A write cannot. Writes are limited to the workflow’s own resource, plus every resource `resourceClients` returns a client for. Nothing else counts, so a read-only derived sibling never becomes a write target. That is the second reason to add `resourceClients`: to give a foreign resource different credentials, and to make it a legal write target.

Runtime-supplied refs are checked against that declared surface before they enter field state. A `doc.ref`, `doc.refs`, or `release.ref` value can arrive from a start `initialFields` value, an action’s param-sourced op value, an `editField` value, or an effect-completion op. It must target the workflow’s own resource or a resource `resourceClients` serves. A ref to any other resource aborts the commit with `RefResourceUndeclaredError`, and nothing is written. Refs the deployed definition already carries are exempt, because deploy already checked them: literal `initialValue` seeds, `type: 'query'` texts, spawn `with` projections, and an op value that binds no parameter. Like every engine check, this one is advisory, and the Content Lake is the only enforcement point. What it buys you is that a misdirected ref fails at the write that introduces it, rather than at a later read.

## Resource aliases

A global document reference is physical: it names an exact project and dataset, or an exact resource. If you deploy the same definition to more than one environment, you rarely want that baked into the source. A resource alias is the way around it. A definition references content as `@<alias>:<documentId>`, each deployment binds the alias to a real resource, and deploy expands every alias into a physical reference. The deployed definition holds only physical references, so nothing has to resolve an alias while a workflow runs. Bare IDs and physical references are unaffected, and a single-resource setup needs no aliases at all. [Coordinate content across projects and datasets](https://www.sanity.io/docs/workflows/cross-resource-workflows) shows the per-environment bindings.

## Next steps

- [Workflows](https://www.sanity.io/docs/workflows/introduction): the core model these references plug into.
- [Coordinate content across projects and datasets](https://www.sanity.io/docs/workflows/cross-resource-workflows): run one workflow over content in other resources, start to finish.
- [Effects and runtimes](https://www.sanity.io/docs/workflows/effects-and-runtimes): how GDR-valued bindings reach effect handlers.
- [Reference](https://www.sanity.io/docs/workflows/reference): every construct spelled out exactly, each field, type, default, and option.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



