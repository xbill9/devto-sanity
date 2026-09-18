<!-- Source: https://www.sanity.io/docs/content-lake/live-content-api (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Live Content API

The Live Content API is perfect for fast-moving events like sports, news, and commerce. Deliver real-time experiences at scale.

The Live Content API allows you to deliver live, dynamic experiences to your users without the complexity and scalability challenges that typically come with building real-time functionality. It is available on all plans, including free plans. See the [pricing page for usage details](https://www.sanity.io/pricing#compare-plans).

![Distribute real-time updates to your applications](https://cdn.sanity.io/images/3do82whm/next/053e032a2de083d666a0815b7634dd302490638d-1200x675.png)

With the Live Content API, you can:

- **Subscribe to changes** and receive notifications whenever documents are created, updated, or deleted.
- **Efficiently query** for the exact content you need, and only receive updates for that content.
- **Scale** to handle high volumes of live updates, even during peak traffic periods.

## When to use the Live Content API

The Live Content API is designed to integrate into your existing application. It provides an interface for subscribing to content changes and receiving real-time updates.

Most sites and applications benefit from a mix of live and static content. For example, a news organization may want their homepage to use live content while article pages remain statically generated. In other cases, you may want islands of dynamic content to use the Live Content API in an otherwise statically generated application.

The Live Content API requires API version `v2021-03-25` or later.

> [!NOTE]
> Usage limits and live connections
> Live connections are part of the [Live Content API usage](https://www.sanity.io/pricing#compare-plans), but new requests contribute to your API usage quota.
> Live connections don't request data, but instead listen for targeted updates in your dataset data. Your application relies on these tags to make new requests.
> The Live Content API holds on to old events and can replay them to clients when they reconnect, up to a retention window of 15 minutes on Free and Growth plans. Enterprise plans have custom retention. See [Live Content API pricing](https://www.sanity.io/pricing#compare-plans) for current limits.
> Use site-wide caching techniques to minimize unnecessary requests and prevent unexpected usage spikes. The `next-sanity` library handles this caching for you in Next.js apps.

## How Live Content works

Taking advantage of the Live Content API is a two-stage process, plus an optional third stage when you serve content through a CDN:

1. Clients listen for content identifiers we call sync tags. They map to specific requests, so changes in your dataset only trigger new tags for requests on the new content.
2. Clients query your data, listen for changes, and update content only when it changes.
3. Optional: If you serve content through a CDN, set up a [Sanity Function to invalidate the cache](https://www.sanity.io/docs/functions/sync-tag-function-quickstart) to allow for live updates.

Our client libraries handle this process for you and provide helpers for building on top of the API. In Next.js, `next-sanity` also manages caching. By default it revalidates cached routes in the background, so some visitors keep seeing the previous content until that revalidation finishes. To guarantee that every visitor gets the update, deploy an Invalidate Sync Tags Function and set `waitFor="function"` on `<SanityLive>`. To start building, see [Add live content to your application](https://www.sanity.io/docs/developer-guides/live-content-guide). For more on the underlying API, see the [Live Content API reference](https://www.sanity.io/docs/http-reference/live) and our example implementations.

> [!WARNING]
> Dataset aliases
> The Live Content API does not support dataset aliases. Use the *real dataset name* in all requests.

## Get started

Start implementing the Live Content API by following one of our guides or experimenting with an example project.

[Set up live content in your app](https://www.sanity.io/docs/developer-guides/live-content-guide)
Enable real-time updates and live content in your applications.

[Clean Next.js + Sanity Starter](https://www.sanity.io/templates/nextjs-sanity-clean)
A clean starter project with Next.js 16 and loads of Sanity features including the Live Content API.

[Sanity Learn: Content-driven web application foundations](https://www.sanity.io/learn/course/content-driven-web-application-foundations/)
Learn the latest best practices for modern web applications, including Live Content concepts, with this Sanity Learn course.

## Additional resources

[Live Content API reference](https://www.sanity.io/docs/http-reference/live)
Reference documentation for implementing the API.

[Live content examples on GitHub](https://github.com/sanity-io/lcapi-examples)
A collection of examples for multiple frameworks and the API.



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Content Lake v2021-03-25: Live Content API query parameter includes system document updates](https://www.sanity.io/docs/changelog/627b0123-4493-4865-ac7e-6cbec855dd0a.md) — January 5, 2026