<!-- Source: https://www.sanity.io/docs/app-sdk/sdk-react-hooks (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# React Hooks

Meet some of the most important hooks from the React SDK package.

The Sanity App SDK comes with a range of hooks available for interacting with your content. A full reference is available for your perusal here:

- [Sanity React App SDK Reference Docs](https://reference.sanity.io/_sanity/sdk-react/)

While visiting every hook, type and component is beyond the scope of this article, a few of the most important hooks are briefly introduced below to give you a sense of how you'll be interacting with your Sanity content using the App SDK. 

For the sake of legibility, assume that examples handling single documents are invoked with a proper [DocumentHandle](https://reference.sanity.io/_sanity/sdk-react/Introducing_Document_Handles/), which is a valid combination of a document ID and document type, and an optional project ID and dataset name indicating the source of the document. Examples that fetch multiple documents usually return an array of `DocumentHandle`s.

**DocumentHandle.tsx**

```
import {type DocumentHandle} from '@sanity/sdk-react'

const documentHandle: DocumentHandle = {
  documentId: 'document-id',
  documentType: 'book',
  projectId: 'project-id',
  dataset: 'production',
}

<OrderLink documentHandle={documentHandle} />
```

## Data Retrieval Hooks

### [useDocuments](https://reference.sanity.io/_sanity/sdk-react/exports/useDocuments/) - Getting collections of documents

The `useDocuments` hook is your primary tool for retrieving collections of documents from your Sanity dataset. It returns Document Handles for documents matching your specified document type (and optional filters and parameters), making it ideal for building document lists and overviews. 

**index.tsx**

```tsx
const {data, hasMore, isPending, loadMore} = useDocuments({
 documentType: 'movie',
 batchSize: 10,
 orderings: [{ field: '_createdAt', direction: 'desc' }]
})
```

`useDocuments` accepts: `documentType` (string, required), `batchSize` (number, optional: how many handles to load per batch, defaulting to a built-in value), and `orderings` (optional, array of `{field, direction: 'asc' | 'desc'}`). It returns:

- `data`: an array of `DocumentHandle`s for the matching documents
- `hasMore`: `true` while more documents remain beyond the current batch
- `isPending`: `true` while the next batch is loading
- `loadMore`: call this (e.g. from a "Load more" button) to append the next batch to `data`

Use these for infinite-scroll or "load more" lists; for numbered pages use `usePaginatedDocuments`.

### [usePaginatedDocuments](https://reference.sanity.io/_sanity/sdk-react/exports/usePaginatedDocuments/) - Paginated document lists

The `usePaginatedDocuments` hook provides a more traditional pagination interface compared to the infinite scroll pattern of `useDocuments`. This makes it ideal for building interfaces with discrete pages of content and explicit navigation controls:

**index.tsx**

```tsx
const { 
  data, 
  isPending,
  currentPage, 
  totalPages,
  nextPage, 
  previousPage,
  hasNextPage,
  hasPreviousPage
} = usePaginatedDocuments({ 
  documentType: 'movie',
  pageSize: 10,
  orderings: [{ field: '_createdAt', direction: 'desc' }]
})
```

`usePaginatedDocuments` accepts `documentType` (string, required), `pageSize` (number of documents per page), and `orderings` (array of `{field, direction}`). It returns:

- `data`: the `DocumentHandle`s for the current page
- `isPending`: `true` while a page is loading
- `currentPage` / `totalPages`: the current page index and total page count
- `nextPage` / `previousPage`: functions to move between pages
- `hasNextPage` / `hasPreviousPage`: booleans for enabling/disabling navigation controls

### [useDocument](https://reference.sanity.io/_sanity/sdk-react/exports/useDocument/) - Reading individual documents

The `useDocument` hook provides real-time access to individual document content. It's designed for reading and subscribing to a document's state, incorporating both local and remote changes:

**index.tsx**

```tsx
// Get the full document
const {data: movie} = useDocument({...movieHandle})

// Get a specific field
const {data: title} = useDocument({
  ...movieHandle,
  path: 'title',
})
```

The hook automatically handles displaying local-first, optimistic updates made via the `useEditDocument` hook, making it ideal for building collaborative editing interfaces that need to stay synchronized with remote changes. However, for static displays where local-first, optimistic updates aren't needed, consider using `useDocumentProjection` (which still return content that's live by default).

### [useDocumentProjection](https://reference.sanity.io/_sanity/sdk-react/exports/useDocumentProjection/) - Accessing specific document fields

The `useDocumentProjection` hook allows you to efficiently retrieve specific fields from a document using GROQ projections:

**index.tsx**

```
const {data: { title, authorName }} = useDocumentProjection({
  ...documentHandle,
  projection: `{
    title,
    'authorName': author->name
  }`
})
```

Alongside a `DocumentHandle`, `useDocumentProjection` accepts `projection` (a GROQ projection string, e.g. `{title, 'authorName': author->name}`) and an optional `ref` (a React ref to an element; the hook won't resolve while that element is offscreen). It returns `{data, isPending}`, where `data` holds the projected fields. Because it fetches via Suspense, call it inside a component wrapped in a `<Suspense>` boundary, typically one rendered per `DocumentHandle` from `useDocuments`.

Putting these together, `useDocuments` for the list, a per-item `<Suspense>` boundary, and `useDocumentProjection` for the titles:

**MovieList.tsx**

```tsx
import {Suspense} from 'react'
import {
  useDocuments,
  useDocumentProjection,
  type DocumentHandle,
} from '@sanity/sdk-react'

function DocumentTitle({documentHandle}: {documentHandle: DocumentHandle}) {
  const {data} = useDocumentProjection({
    ...documentHandle,
    projection: `{title}`,
  })
  return <li>{data.title}</li>
}

export function MovieList() {
  const {data, hasMore, isPending, loadMore} = useDocuments({
    documentType: 'movie',
    batchSize: 10,
    orderings: [{field: '_createdAt', direction: 'desc'}],
  })

  return (
    <>
      <ul>
        {data.map((documentHandle) => (
          <Suspense key={documentHandle.documentId} fallback={<li>Loading…</li>}>
            <DocumentTitle documentHandle={documentHandle} />
          </Suspense>
        ))}
      </ul>
      {hasMore && (
        <button onClick={() => loadMore()} disabled={isPending}>
          {isPending ? 'Loading…' : 'Load more'}
        </button>
      )}
    </>
  )
}
```

## Document Manipulation Hooks

### [useEditDocument](https://reference.sanity.io/_sanity/sdk-react/exports/useEditDocument/) - Modifying documents

This hook is particularly useful for building forms and collaborative editing interfaces. It provides a simple way to update document fields in real-time:

**index.tsx**

```tsx
const editTitle = useEditDocument({
  ...movieHandle, 
  path: 'title',
})

function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
  editTitle(e.currentTarget.value)
}
return (
 <input 
   type="text"
   value={title || ''}
   onChange={handleTitleChange}
 />
)
```

### [useApplyDocumentActions](https://reference.sanity.io/_sanity/sdk-react/exports/useApplyDocumentActions/) - Document operations

The `useApplyDocumentActions` hook provides a way to perform document operations like publishing, unpublishing, creating, and deleting documents:

**index.tsx**

```tsx
import {
  useApplyDocumentActions,
  publishDocument,
  unpublishDocument,
} from '@sanity/sdk-react'

const apply = useApplyDocumentActions()

function MovieActions({ movieHandle }) {
  return (
    <div>
      <button onClick={() => apply(publishDocument(movieHandle))}>
        Publish
      </button>
      <button onClick={() => apply(unpublishDocument(movieHandle))}>
        Unpublish
      </button>
    </div>
  )
}
```

### [useDocumentEvent](https://reference.sanity.io/_sanity/sdk-react/exports/useDocumentEvent/) - Handling document events

The `useDocumentEvent` hook allows you to subscribe to document events like creation, deletion, and updates. This is useful for building features that need to react to changes in your content:

**index.tsx**

```tsx
import {useDocumentEvent, type DocumentEvent} from '@sanity/sdk-react'

const eventCallback = (event) => {
  if (event.type === DocumentEvent.DocumentDeletedEvent) {
    console.log(`Document ${event.documentId} was deleted`)
  } else if (event.type === DocumentEvent.DocumentEditedEvent) {
    console.log(`Document ${event.documentId} was edited`)
  }
})

useDocumentEvent({
  ...documentHandle,
  onEvent: eventCallback,
})
```

This hook is particularly valuable when building interfaces that need to maintain consistency with document state changes, such as notification systems or live collaboration features.

Here's an example of using `useDocumentEvent` to build a simple notification system that alerts users when documents are modified:

**index.tsx**

```tsx
function DocumentChangeNotifier({ documentHandle }) {
  const [notifications, setNotifications] = useState<string[]>([])

  const eventCallback = (event) => {
    switch (event.type) {
      case DocumentEvent.DocumentEditedEvent:
        setNotifications(prev => [
          `Document ${event.documentId} was just edited`,
          ...prev
        ])
        break
      case DocumentEvent.DocumentPublishedEvent:
        setNotifications(prev => [
          `Document ${event.documentId} was published`,
          ...prev
        ])
        break
    }
  }

  useDocumentEvent({
    ...documentHandle,
    onEvent: eventCallback,
  })

  return (
    <div className="notifications">
      {notifications.map((msg, i) => (
        <div key={i} className="notification">{msg}</div>
      ))}
    </div>
  )
}
```





## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity React App SDK v3.0.0: Background revalidation, simplified resource config, and new permission and mutation hooks](https://www.sanity.io/docs/changelog/sdk-react-My4wLjA.md) — August 25, 2026
- [Sanity React App SDK v2.2.0: Enhancements to the useProjects hook and resolved paper cuts.](https://www.sanity.io/docs/changelog/16326557-f6e2-4ef9-8697-93803a1d94a7.md) — September 5, 2025
- [Content Lake v2025-02-19: Content Releases APIs and new perspective defaults](https://www.sanity.io/docs/changelog/676aaa9d-2da6-44fb-abe5-580f28047c10.md) — February 24, 2025