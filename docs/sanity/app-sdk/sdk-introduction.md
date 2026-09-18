<!-- Source: https://www.sanity.io/docs/app-sdk/sdk-introduction (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# App SDK introduction

Get a high-level introduction to the Sanity App SDK.

The Sanity Application Software Development Kit, or **App SDK** for short, is a robust set of tooling that lets you create fully custom apps that interface and interact with your Sanity content. It brings the powerful real-time capabilities and content management features you know from Sanity Studio to your own custom React applications. With a comprehensive set of React hooks and data stores, you can build applications that work seamlessly with your Sanity content across multiple projects and datasets.

This introduction covers the core concepts and patterns behind the App SDK, how to retrieve and change documents, and how to build interfaces that stay in sync with your content.

By the end of this guide, you'll understand:

- How document handles enable efficient document operations.
- When to use different hooks for retrieving and updating content.
- Best practices for building performant real-time applications.
- How to work with content across multiple projects and datasets.

## What is the App SDK?

The App SDK is a toolkit for building custom React applications that interact with your Sanity content. It provides React hooks and data stores for real-time content operations across multiple projects and datasets, and it leaves your interface entirely up to you.

### Purpose and key features

With the App SDK, you can:

- Build fully custom applications that work with Sanity content.
- Enable real-time content operations and live updates.
- Work across multiple projects and datasets.
- Create tailored user experiences beyond what Sanity Studio offers.

### SDK apps and Sanity Studio

![An SDK app and a studio showing different ways to interact with the same content](https://cdn.sanity.io/images/3do82whm/next/34ec1da769de3803cffabb9eb01b0fe5c6dd70a0-600x306.png)
*Sometimes you need a different perspective on your content*

Sanity Studio is a full content management application, and for many Sanity users, Sanity Studio *is* Sanity. Or, in other words, their studio is the main interface through which they interact with the Sanity platform. The ambition of the App SDK is to enable you to build apps that work beyond the scope of a single studio, project, and dataset, unlocking opportunities for new content workflows and operations — all while letting you control your application's UI and UX completely.

### Similarities between SDK apps and Sanity Studio

- Real-time content operations
- Live updates and collaboration features
- Access to Sanity's content platform
- Authentication and permissions handling

### Differences between SDK apps and Sanity Studio

- **Multiple projects and datasets:** While studios can work with a single project and dataset at a time, SDK apps can be configured to work with as many of your organization's projects and datasets as you like.
- **Complete UI freedom**: Unlike the studio's structured interface, you control every aspect of the UI.
- **Custom workflows**: Build exactly the workflow your users need.
- **Focused feature set**: No built-in validation or form building — bring your favorite UI components with you, and shape the functionality just as you want it.

## Technical implementation

### Technology stack

- [TypeScript](https://www.typescriptlang.org/) for type safety and developer experience
- [React](https://react.dev/) for application framework and hooks
- React [Suspense](https://react.dev/reference/react/Suspense) and Transitions for data loading states

## Requirements

The App SDK requires:

- React v19 or later
- Node.js v22.12 or later
- The `@sanity/sdk-react` package
- A Sanity Dashboard to host your app

## What's included

The App SDK includes:

- React hook based interface, taking advantage of modern React patterns like [Suspense](https://react.dev/reference/react/Suspense) and [Transitions](https://react.dev/reference/react/useTransition)
- Document retrieval and content rendering, all live by default
- Optimistic, local-first document editing, ready for collaborative interfaces
- Batchable document actions
- Permissions checking with detailed outputs
- Support for [Sanity Typegen](https://www.sanity.io/docs/apis-and-sdks/sanity-typegen)

### Not included

The App SDK does not include:

- UI components or design system

The App SDK pairs nicely with [Sanity UI](https://www.sanity.io/ui) for building applications that are visually consistent with other Sanity apps.

- Router
- Form validation
- Schema validation

These aspects are left to your implementation, giving you complete control over the user experience while the SDK handles the complex data operations underneath.

## Limitations

During development, SDK apps may experience connection issues in the Safari browser. This is caused by the way Safari handles mixed content, and how Sanity loads your local app in the Sanity Dashboard. To get around this limitation, use another browser during development. **This does not affect deployed SDK applications.**



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity Studio v6.10.0: Studio SDK integration, CLI asset uploads and token expiry, and presentation and Vision fixes](https://www.sanity.io/docs/changelog/studio-Ni45LjI.md) — August 18, 2026
- [Sanity React App SDK v2.11.1: Fix for apps hanging after token refresh](https://www.sanity.io/docs/changelog/3427a27e-797c-4875-a96d-b21227e1c89e.md) — May 13, 2026
- [Sanity React App SDK v2.7.0: Zero-config Studio integration and perspective-aware projections](https://www.sanity.io/docs/changelog/62c7139c-6ae2-4dd2-b79d-4ad7d2a24a5e.md) — February 13, 2026
- [Sanity React App SDK v2.4.0: Support for initial values in document creation and new agent capabilities](https://www.sanity.io/docs/changelog/0b7cfb5d-3bd5-4937-918d-ebdaa7ca6463.md) — December 16, 2025