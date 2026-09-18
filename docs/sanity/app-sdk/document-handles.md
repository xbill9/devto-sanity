<!-- Source: https://www.sanity.io/docs/app-sdk/document-handles (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Document handles

Document handles are a central concept in the Sanity App SDK, and are important to understand when working with many of the SDK's React hooks.

In this article, you'll learn what document handles are, why they're useful, and how to work with them. For the full type definition, see the [DocumentHandle API reference](https://reference.sanity.io/_sanity/sdk/index/DocumentHandle/).

## Prerequisites

- `@sanity/sdk-react` 1.0.0 or later. The examples in this article import hooks and types from this package.
- A React application set up with the App SDK. To create one, follow the [App SDK quick start](https://www.sanity.io/docs/app-sdk/sdk-quickstart).

## What is a document handle?

In short, a `DocumentHandle` is a stub of a document — a small piece of metadata, encoded in a JavaScript object, that acts as a reference to a complete document in your dataset.

It looks like this:

**documentHandle.ts**

```typescript
const myDocumentHandle = {
  documentId: 'my-document-id',
  documentType: 'article'
}
```

This lightweight representation serves several important purposes:

- **Performance**: Loading only the handles instead of full documents reduces initial data transfer and improves application responsiveness.
- **Flexibility**: Handles can be passed to other hooks that load only the specific document data needed for a particular view or operation.
- **Real-time updates**: The SDK can efficiently track changes to documents by monitoring their handles.

A document handle may also contain optional information about the project and dataset it originates from; in that case, it would look like this:

**documentHandle.ts**

```typescript
const myDocumentHandle = {
  documentId: 'my-document-id',
  documentType: 'author',
  dataset: 'dataset-name',
  projectId: 'my-project-id'
}
```

Therefore, for a document in a given dataset that looks (in part) like this:

**result.json**

```json
{
  "_id": "123456-abcdef",
  "_type": "book",
  "title": "Into the Cool",
  "publisher": "The University of Chicago Press",
  "pages": 378,
  "…": "…"
}
```

For that document, the corresponding document handle looks like this:

**documentHandle.ts**

```typescript
{
  documentId: "123456-abcdef",
  documentType: "book"
}
```

## Why are document handles used?

Hooks like [useDocuments](https://reference.sanity.io/_sanity/sdk-react/exports/useDocuments/) and [usePaginatedDocuments](https://reference.sanity.io/_sanity/sdk-react/exports/usePaginatedDocuments/) can return potentially large numbers of documents matching your specified parameters. Returning every matching document in full is an expensive operation. It slows your application down and degrades the user experience. You may also not need each returned document in its entirety. Perhaps you want to render a document preview, one or two fields of a document, or a count of the documents matching your parameters.

This is where the concept of document handles comes in. By returning a small amount of metadata for each document instead of unfurling every returned document, hooks like `useDocuments` can respond as fast as possible, so your application stays responsive.

Unless you only need a count of the documents matching the parameters you pass to these hooks, document handles aren't useful on their own. This is by design — they’re only meant to serve as references to documents which can then be consumed by more specialized hooks, such as [useDocumentProjection](https://reference.sanity.io/_sanity/sdk-react/exports/useDocumentProjection/), [useDocument](https://reference.sanity.io/_sanity/sdk-react/exports/useDocument/), and many more hooks provided by the Sanity App SDK. These specialized hooks are designed to consume document handles and emit only the document content you request, which also delivers huge performance benefits. Other hooks, such as [useDocumentEvent](https://reference.sanity.io/_sanity/sdk-react/exports/useDocumentEvent/) and [useDocumentPermissions](https://reference.sanity.io/_sanity/sdk-react/exports/useDocumentPermissions/) have no need to know the contents of a document — instead, they use the provided document handle to reference a document and retrieve information pertaining to that document.

In short, document handles promote deferring the retrieval of document contents until such time as those contents are actually needed by your application.

## Use your own document handles

You’re not limited to using document handles returned by hooks like `useDocuments` — if it suits your use case (for example: if you know the document ID and type of the document you want to reference), you can write and use your own document handles.

A handle is any object that matches the `DocumentHandle` interface. Three forms work, and they differ only in how much type information TypeScript keeps:

**Plain object**

```tsx
import {useDocumentSyncStatus, type DocumentHandle} from '@sanity/sdk-react'

const myDocumentHandle: DocumentHandle = {
  documentId: 'my-document-id',
  documentType: 'book',
}

export function SyncIndicator() {
  const documentSynced = useDocumentSyncStatus(myDocumentHandle)

  return <span>{documentSynced ? 'Synced' : 'Saving…'}</span>
}
```

**createDocumentHandle**

```tsx
import {createDocumentHandle, useDocumentSyncStatus} from '@sanity/sdk-react'

const myDocumentHandle = createDocumentHandle({
  documentId: 'my-document-id',
  documentType: 'book',
})

export function SyncIndicator() {
  const documentSynced = useDocumentSyncStatus(myDocumentHandle)

  return <span>{documentSynced ? 'Synced' : 'Saving…'}</span>
}
```

**as const**

```tsx
import {useDocumentSyncStatus} from '@sanity/sdk-react'

// `as const` captures the literal type 'book' instead of widening it to string
const myDocumentHandle = {
  documentId: 'my-document-id',
  documentType: 'book',
} as const

export function SyncIndicator() {
  const documentSynced = useDocumentSyncStatus(myDocumentHandle)

  return <span>{documentSynced ? 'Synced' : 'Saving…'}</span>
}
```

While creating handles as plain objects works fine, using the `createDocumentHandle` helper (or similar helpers like `createDatasetHandle`) is recommended, **especially if you are using** [sanity typegen](https://www.sanity.io/docs/apis-and-sdks/sanity-typegen).

Why? When [using the SDK hooks with TypeGen](https://reference.sanity.dev/_sanity/sdk-react/Typescript_with_TypeGen_(experimental)/), the hooks can provide much richer type information if they know the *specific* literal type of the `documentType` (for example, knowing it's exactly `'book'`, rather than any `string`). The `createDocumentHandle` function helps TypeScript capture this literal type automatically.

Using either `createDocumentHandle` or `as const` ensures that subsequent hooks like `useDocument` or `useDocumentProjection` can correctly infer types based on the specific `documentType` provided in the handle when TypeGen is enabled.

## How handles flow between hooks

Handles connect two kinds of hook. A hook such as `useDocuments` returns handles for every document matching your parameters. In this example, every document of type `author`:

**AuthorList.tsx**

```tsx
import {useDocuments} from '@sanity/sdk-react'

export function AuthorList() {
  // `authors` holds document handles, not full author documents
  const {data: authors} = useDocuments({documentType: 'author'})

  return <p>{authors.length} authors</p>
}
```

Each entry in `authors` is a document handle. Because the query filters on the `author` document type, each one looks like this:

**documentHandle.ts**

```typescript
{ documentId: 'the-document-id', documentType: 'author' }
```

To read content from one of those documents, pass its handle to a hook that consumes handles, such as `useDocumentProjection`. The handle is [spread](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) into the hook's arguments:

**AuthorDetails.tsx**

```tsx
import {useDocumentProjection, type DocumentHandle} from '@sanity/sdk-react'

interface NameProjection {
  name: string
}

// The AuthorDetails component will accept a document handle for its `document` prop
export function AuthorDetails({document}: {document: DocumentHandle}) {
  const {data} = useDocumentProjection<NameProjection>({
    ...document,
    projection: '{ name }',
  })

  return <p>The author's name is {data?.name ?? 'Unknown'}</p>
}
```

Splitting the work across two hooks separates two concerns: identifying documents, and reading content from them. Your application stays fast no matter how many authors your dataset holds, or how many fields the `author` type defines. For a worked example that builds this pattern into a running app, see [Fetching and handling content](https://www.sanity.io/docs/app-sdk/fetching-and-handling-content).

## Next steps

Put document handles to work in your own app with these guides.

[Fetching and handling content](https://www.sanity.io/docs/app-sdk/fetching-and-handling-content)
Build a preview grid that turns document handles into rendered content.

[React hooks](https://www.sanity.io/docs/app-sdk/sdk-react-hooks)
Meet the App SDK hooks that produce and consume document handles.

[App SDK and TypeGen](https://www.sanity.io/docs/app-sdk/sdk-typegen)
Get typed results from your handles by generating types from your schema.



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity React App SDK v3.0.0: Background revalidation, simplified resource config, and new permission and mutation hooks](https://www.sanity.io/docs/changelog/sdk-react-My4wLjA.md) — August 25, 2026
- [Sanity React App SDK v2.5.0: Enhanced document actions and liveEdit document support](https://www.sanity.io/docs/changelog/4a06de37-7a35-4d59-8168-1b13fa4385d5.md) — December 31, 2025