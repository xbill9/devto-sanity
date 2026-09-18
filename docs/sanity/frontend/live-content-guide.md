<!-- Source: https://www.sanity.io/docs/developer-guides/live-content-guide (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Add live content to your application

Learn to use the Live Content API with Next.js or your own integration for real-time content updates in your app.

The Live Content API lets you deliver live content experiences without the complexity and infrastructure requirements traditionally found in real-time apps.

The `next-sanity` library wraps the Live Content API for Next.js apps. The JavaScript client offers helper utilities to get you started, but you'll need to build additional functionality.

This guide shows two ways to add live content to an application: with `next-sanity` in a Next.js app, and with the JavaScript client in any other framework.

## Add live content with next-sanity

Enable live content with only a few lines of code with `next-sanity`.

#### Next.js + Sanity + Visual Editing
If you plan to set up Next.js, Sanity, Visual Editing, and the Live Content API, see the Next.js Visual Editing guide for a complete implementation.
[Set up Next.js, live content, and Visual Editing](https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router)

### Prerequisites

- A new or existing Sanity project.
- Add your frontend or deployment target's origin to the project's [CORS origins](https://www.sanity.io/docs/content-lake/cors). This is found in the project's API section at [sanity.io/manage](https://sanity.io/manage).
- A Next.js application built with the [app router architecture](https://nextjs.org/docs/app/getting-started/layouts-and-pages). The Live Content features in `next-sanity` do not support apps built with the pages router.
- This guide assumes `next-sanity` v13 or later, which requires Next.js 16, React 19.2 or later, and `@sanity/client` 7.26.1 or later.

### Install and configure the client

You can install, set up, and configure Sanity in your existing Next.js project with `init`:

**npm**

```shell
npx sanity@latest init
```

**pnpm**

```shell
pnpm dlx sanity@latest init
```

**yarn**

```shell
yarn dlx sanity@latest init
```

**bun**

```shell
bunx sanity@latest init
```

Alternatively, install the package or update it to the latest version:

**npm**

```shell
npm install next-sanity@latest
```

**pnpm**

```shell
pnpm add next-sanity@latest
```

**yarn**

```shell
yarn add next-sanity@latest
```

**bun**

```shell
bun add next-sanity@latest
```

Next, confirm that you have an existing Sanity client configured:

**src/sanity/lib/client.ts**

```typescript
import { createClient } from "next-sanity";

import { dataset, projectId } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-03-01",
  useCdn: true
});
```

### Create the live utilities

Create a live utility file and configure the `sanityFetch` helper and `SanityLive` component by passing in your local Sanity client and a token. `defineLive` requires a browser and server token to fetch draft content when using Draft Mode. If you aren't using Visual Editing or draft previews, set `serverToken: false` and `browserToken: false` to opt out and silence the development warnings:

**src/sanity/lib/live.ts**

```typescript
import { defineLive } from "next-sanity/live";
// import your local configured client
import { client } from "@/sanity/lib/client";

// set your viewer token
const token = process.env.SANITY_API_READ_TOKEN
if (!token) {
  throw new Error("Missing SANITY_API_READ_TOKEN")
}

// export the sanityFetch helper and the SanityLive component
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  browserToken: token,
})
```

> [!NOTE]
> Tokens
> Tokens passed to `defineLive` need [viewer access rights](https://www.sanity.io/docs/user-guides/roles) to fetch draft content.
> The token for `serverToken` and `browserToken` can be the same. The `browserToken` is only used when Draft Mode is enabled and initiated by Presentation Tool or Vercel Toolbar.

### Fetch your queries

Whenever you need to query data in your Sanity dataset, import the `sanityFetch` helper and call it as you would any Sanity client by passing in a GROQ query and any query parameters:

**app/page.tsx**

```typescript
import { sanityFetch } from "@/sanity/lib/live"
import { POST_QUERY } from "./queries"

const {data: post} = await sanityFetch({query: POST_QUERY, params: {}})
```

In this example, the `data` response is destructured to `post` and `sanityFetch` receives a GROQ query and an optional `params` object.

### Enable the SanityLive component

The final step to enable the Live Content API is adding the `SanityLive` React component. It listens for changes in your data and works with your `sanityFetch` queries to efficiently update content. Include it in your application so it renders on any page that needs live content.

> [!WARNING]
> Embedded studios
> This section adds the SanityLive component to the root layout. If you're using an embedded studio—one that renders on a route in your Next.js app—include the SanityLive and VisualEditing components only in your content layouts.
> Including `SanityLive` in your studio route can cause unexpected reloads.

In this example, it lives just before the closing body tag in the `RootLayout` component:

**app/layout.tsx**

```tsx
import { SanityLive } from "@/sanity/lib/live"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
      </body>
    </html>
  )
}
```

> [!NOTE]
> Make updates instant in next-sanity v13
> In `next-sanity` v13, `<SanityLive>` revalidates with a stale-while-revalidate profile by default, so a published change is *eventually consistent* — some connected visitors may need to navigate or refresh before they see it. To make updates instant for every visitor (and to invalidate caches that sit in front of Next.js, such as a CDN), pair `<SanityLive>` with a [Sync Tag Invalidate Function](https://www.sanity.io/docs/functions/sync-tag-function-quickstart) and set `waitFor="function"`. The quick start covers the function; the migration guide's [Opting in to guaranteed live content updates](https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v12-to-v13.md#opting-in-to-guaranteed-live-content-updates) section shows the matching Next.js revalidation route and `waitFor` wiring.

### Next steps

- To learn more about the `next-sanity` toolkit and how it fits together with Visual Editing and caching, see the [Next.js overview](https://www.sanity.io/docs/nextjs/introduction).
- Level up with [Work-ready Next.js](https://www.sanity.io/learn/track/work-ready-next-js) on Sanity Learn.
- Dive into [the Clean Next.js + Sanity starter](https://www.sanity.io/templates/nextjs-sanity-clean).
- For instant updates across CDNs and many statically generated routes, drive revalidation from a [Sync Tag Invalidate Function](https://www.sanity.io/docs/functions/sync-tag-function-quickstart) and set `waitFor="function"` on `<SanityLive>`. The quick start covers the function; the migration guide's [Opting in to guaranteed live content updates](https://github.com/sanity-io/next-sanity/blob/main/packages/next-sanity/MIGRATE-v12-to-v13.md#opting-in-to-guaranteed-live-content-updates) section shows the matching revalidation route and `<SanityLive>` wiring.

## Create your own integration

If there isn't an official library for your framework that enables live content, you need to create your own integration to use the Live Content API. The Live Content API Examples repository on GitHub collects example projects and is a good starting point for custom implementations.

[Live Content API Examples](https://github.com/sanity-io/lcapi-examples)
A collection of example projects using live content

The minimal example in this section uses the [Sanity JavaScript client](https://www.sanity.io/docs/apis-and-sdks/js-client-getting-started).

### Prerequisites

- API version `v2021-03-25` or later. Older versions omit `syncTags` from query responses and throw `The live events API requires API version 2021-03-25 or later.`
- The real dataset name. The Live Content API does not support dataset aliases.
- A new or existing Sanity project.
- Add your frontend or deployment target's origin to the project's [CORS origins](https://www.sanity.io/docs/content-lake/cors). This is found in the project's API section at [sanity.io/manage](https://sanity.io/manage).

### Install and configure the client

First, install the latest version of the client:

**npm**

```shell
npm install @sanity/client@latest
```

**pnpm**

```shell
pnpm add @sanity/client@latest
```

**yarn**

```shell
yarn add @sanity/client@latest
```

**bun**

```shell
bun add @sanity/client@latest
```

Configure your `@sanity/client` with your project settings and the latest API version:

**src/sanity/lib/client.ts**

```typescript
import { createClient } from "@sanity/client"

export const client = createClient({
  projectId: "YOUR_PROJECT_ID",
  dataset: "YOUR_DATASET",
  apiVersion: "2026-03-01",
  useCdn: true
})
```

### How it works

Here's a high-level overview of how the Live Content API works:

1. Every response from Content Lake includes *sync tags*. Your application stores the tags for the content it needs to keep up to date in real time.
2. It subscribes to a stream of live updates with the `client.live.events()` method, which returns an Observable that emits an event whenever content in the dataset changes.
3. When an event arrives, it checks whether any of the event tags match the stored sync tags.
4. If there's a match, it refetches the content, passing the event ID as the `lastLiveEventId` argument to `client.fetch` so the CDN returns the latest version of the content instead of stale data.

### Minimal example

Here is a minimal example running in the console. It keeps a single, predefined document in sync using sync tags:

**live-example.ts**

```typescript
import { createClient } from "@sanity/client"

// Create the client instance
const client = createClient({
  projectId: "YOUR_PROJECT_ID",
  dataset: "YOUR_DATASET",
  apiVersion: "2026-03-01",
  useCdn: true
})

const query = '*[_type == "post" && slug.current == $slug][0]'
const slug = "were-doing-it-live"

let syncTags = []

function render(lastLiveEventId?: string) {
  // Query the content lake
  client.fetch(
    query,
    { slug },
    { filterResponse: false, lastLiveEventId }
  ).then(
    (res) => {
      // Store the syncTags and "render" the data
      syncTags = res.syncTags
      const data = res.result
      console.log(data)
    })
}

// Kick off initial render
render()

// Subscribe to live updates
const subscription = client.live.events().subscribe(
  (event) => {
    // Check if incoming tags match saved sync tags
    if (event.type === "message" && event.tags.some((tag) => syncTags.includes(tag))) {
      // Refetch with ID to get latest data
      render(event.id)
    }
    if (event.type === "restart") {
      // A restart event is sent when the `lastLiveEventId` we've been given earlier is no longer usable
      render()
    }
})

// Later, unsubscribe when no longer needed (such as on unmount)
// subscription.unsubscribe()
```

In this example:

1. The example creates a Sanity client instance with the necessary configuration.
2. It defines a query to fetch posts and executes it, setting `filterResponse: false` to get the `syncTags` along with the result.
3. It stores the returned syncTags and renders the initial data.
4. It subscribes to live updates using `client.live.events()`.
5. Whenever an update event arrives, it checks whether any of the event's tags match the stored syncTags.
6. If there's a match, it refetches the data, passing the event ID as `lastLiveEventId` to get the latest version.
7. It updates the stored syncTags and re-renders with the fresh data.
8. Finally, it unsubscribes from the live updates when they're no longer needed.

This pattern keeps your application's content in sync with the latest changes in your Sanity dataset. For additional examples, including listening for drafts, see the [JavaScript client documentation](https://www.sanity.io/docs/apis-and-sdks/js-client-getting-started).

### Next steps

- Learn more about sync tags and the underpinnings of the [Live Content API](https://www.sanity.io/docs/content-lake/live-content-api).
- For reference details when interacting directly with the API, check the [Live reference docs](https://www.sanity.io/docs/http-reference/live).

## Troubleshooting

`client.live.events()` reports failures as an error on the observable rather than throwing, so pass an error handler to `subscribe` to see them at all.

### Origin not allowed by CORS

An unlisted origin makes the connection fail without a usable reason, so the client checks the project's CORS configuration and reports a `CorsOriginError`. In a browser, the message ends with a link that pre-fills the origin: `The current origin is not allowed to connect to the Live Content API. Add it here:` followed by the URL. On a server, where no origin is available, it reads `The current origin is not allowed to connect to the Live Content API. Change your configuration here:` followed by the project's API settings URL.

The stream errors and doesn't retry. The client only reports this error when it can confirm the rejection, so an ambiguous check surfaces the underlying connection error instead. Add the origin in the project's API settings at sanity.io/manage.

In a Next.js app, `SanityLive` logs a warning instead of failing the render: `Sanity Live is unable to connect to the Sanity API as the current origin - ORIGIN - is not in the list of allowed CORS origins for this Sanity Project.` Set `onError="throw"` to surface it to the nearest error boundary instead.

### Connection rejected by the API

A rejected token produces `EventSource connection failed` on the observable, with the HTTP status on the error's `status` property. Any 4xx other than 408 and 429 is fatal: the client stops and doesn't reconnect. A 5xx, a 408, or a 429 is retried, and the stream emits a `reconnect` event first.

The `status` property is only populated where the `eventsource` package provides the connection. Native browser and Node implementations expose no status, so the client can't tell a rejected token from a dropped network and retries instead. A silent reconnect loop with no error is the symptom of an authentication problem in those environments.

A token used to read drafts needs viewer rights or lower. Requesting drafts with no token throws before any request is made: `The live events API requires a token or withCredentials when 'includeDrafts: true'. Please update your client configuration. The token should have the lowest possible access role.`

### Respond to a restart event

A `restart` event means the `lastLiveEventId` you hold is no longer usable. Its payload carries only two fields, `type` and `id`, and no sync tags.

Handle it in three parts:

- Refetch every query, and don't pass the event's ID as `lastLiveEventId`.
- Discard the sync tags you've stored. They can no longer be matched against incoming events.
- Treat `reconnect` the same way. Both events invalidate buffered tags.

In a Next.js app, `SanityLive` calls `router.refresh()` on restart by default, so server components re-render with fresh data.

### Draft content missing from results

Querying with the `published` perspective returns published content only, and nothing tells you that's what happened. There's no error and no console message, and the response looks identical to one from a dataset with no drafts. Since API version `v2025-02-19`, `published` is the default.

Set `perspective: 'drafts'` and supply a token to read drafts. In Next.js, `defineLive` pins its internal client to `published`, so pass a `serverToken` to read drafts on the server and a `browserToken` for live preview in the browser. Without them, `defineLive` warns in development only.



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [next-sanity v13.0.0: Cache Components support, cleaner APIs, and better error handling](https://www.sanity.io/docs/changelog/1b810aef-7d2e-4422-bece-dc317bbd2995.md) — May 21, 2026
- [next-sanity v11.0.0: Moves VisualEditing, defineLive, and isCorsOriginError exports to subpaths](https://www.sanity.io/docs/changelog/2dd87093-666a-432f-b561-16cb3cff7751.md) — September 10, 2025