<!-- Source: https://www.sanity.io/docs/app-sdk/sdk-authentication (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Authentication with the App SDK

Learn about the mechanisms that enable authentication when building with the App SDK.

The App SDK has two authentication mechanisms and automatically uses the appropriate one based on the context in which it's running. This article provides technical information about each of these mechanisms.

> [!WARNING]
> Advanced/experimental usage ahead
> This guide is intended for developers who want to deeply understand the management of authentication within custom apps built with the App SDK. It covers both typical use cases for the App SDK (custom apps in the Sanity Dashboard), as well as more advanced or experimental implementations (such as using the App SDK within Studio).
> **In most cases, developers should not need to know the following information to successfully build with the App SDK.** However, the curious among you are welcome to follow along!

## Overview

Authentication in the SDK is primarily managed by an `authStore`, which tracks the user's [authentication state](https://reference.sanity.io/_sanity/sdk/index/AuthState/) (`LoggedIn`, `LoggedOut`, `LoggingIn`, `Error`). It determines the initial state based on the environment the application is running in — that is, one of: 

- A [Sanity Dashboard](https://www.sanity.io/docs/dashboard) iframe
- [Sanity Studio](https://www.sanity.io/docs/studio)

API client instances, managed by a `clientStore`, will automatically use the current authentication token from the `authStore` for requests. The `clientStore` also handles differentiating between clients configured for 'global' endpoints (such as `api.sanity.io`) and 'default' (project-specific) endpoints (such as `<projectId>.api.sanity.io`).

## Tokens

Several different types of [authentication tokens](https://www.okta.com/identity-101/access-token/) are referred to in the course of this article:

### Global tokens

Global tokens are not tied to a specific project, but instead to a [Sanity user](https://www.sanity.io/docs/content-lake/roles-concepts). They include access to all of the user’s [organizations and projects](https://www.sanity.io/docs/platform-management/projects-organizations-and-billing). Global tokens are required for accessing global Sanity APIs (e.g., project management), and are used when `clientStore` configures a client with `scope: 'global'` or without a `projectId`.

### Project tokens

Project tokens are scoped to a single project (and any of a single project’s datasets). They are used in the Studio mode (described below), and can also be provided manually. These tokens only allow access to project-specific endpoints (e.g. `<projectId>.api.sanity.io`.

### Stamped tokens

Tokens obtained via the `sanity.io/login` authentication flow (and thus also from the Sanity Dashboard) are 'stamped' tokens (`type=stampedToken`). These tokens are refreshed by the App SDK’s `refreshStampedToken` function. Non-stamped tokens, however, will not be refreshed by the App SDK.



## Dashboard mode (default)

### At a glance

The [Sanity Dashboard](https://www.sanity.io/docs/dashboard) enables the default and preferred mode of authentication within custom applications, with the Dashboard providing an authentication token to custom applications built with the App SDK. This results in a seamless experience for the end-user.

This mechanism applies to both third-party custom apps and Sanity’s own applications built with the App SDK.

> [!NOTE]
> In most cases, this is the best authentication method to rely on. It is intended for use when building a custom application running within the Sanity Dashboard.

### In detail

In Dashboard mode, the Sanity Dashboard loads the custom app’s iframe with with an authentication token hash (`#token=…`) in the iframe’s `src` URL. When the custom app is initialized, the `getAuthCode` function (invoked by the App SDK via the `SanityApp` component) will retrieve and validate this token. If for some reason the token is invalid, the `getAuthCode` function will request a new token from the Dashboard, and this new token will be used instead. Once a token is validated, it will be stored in the the `authStore`. No user interaction is required during this exchange — everything is handled automatically, and the process should be completely invisible to an end user.

> [!NOTE]
> This flow presumes a Sanity user is already authenticated within the host Dashboard. If this is not the case, the Dashboard will redirect to `sanity.io/login` in order to first authenticate the user.

With the token thus stored in the application’s `authStore`, it will be used as part of all API client calls made via the App SDK’s hooks, effectively using the current user’s active Dashboard session. This token will be a global, stamped token that is refreshed every 12 hours.

## Studio mode

> [!WARNING]
> The studioMode option is removed
> The studioMode option was deprecated in 2.7.0 and removed in 3.0.0. You can still use the SDK within a Studio; no configuration is needed, since it's picked up automatically from the Studio context. You can still override this for programmatic control by [setting the config](https://reference.sanity.io/_sanity/sdk/index/SanityConfig/#studio).

### At a glance

This authentication mode leverages the studio’s own auth context (via a token or cookie). It’s used when the App SDK is used with the [Sanity Studio](https://www.sanity.io/docs/studio) codebase (not the Dashboard iframe) — for example, within custom input components, tools, or plugins integrated directly into the Studio application.

### In detail

Studio mode is enabled automatically. The Studio wraps its component tree in `SDKStudioContext.Provider`, and `SanityApp` reads the workspace handle from that context to derive the `projectId`, `dataset`, and a reactive auth token source. An explicit `config` prop takes precedence over the Studio context.

```tsx
// Inside a Studio, SanityApp auto-configures from the workspace context
<SanityApp fallback={<Loading />}>
  <MyComponent />
</SanityApp>
```

In this mode, the `authStore` subscribes to the workspace's token source — the Studio stays the single authority for auth and handles token refresh. If the Studio doesn't expose a token source, the `authStore` falls back to one of two methods.

First, the `getStudioTokenFromLocalStorage` function will look for an authentication token specific to the Studio session, which will be stored in local storage under the key `__sanity_auth_token_${projectId}`. This token is project-specific.

If this token is not found, the function `checkForCookieAuth` is called. This function attempts a request to a Studio backend endpoint to check if a valid HTTP-only session cookie exists. If it does, subsequent API requests managed by the App SDK client will rely on this cookie for authentication.

> [!NOTE]
> When this authentication method is used, only project-level endpoints will be work. Any calls made to global endpoints will fail.





## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity React App SDK v2.14.0: Expanded auth logging with automatic redaction](https://www.sanity.io/docs/changelog/043415cf-d7e2-42df-b9e8-d934399d1216.md) — June 12, 2026
- [Sanity React App SDK v2.11.1: Fix for apps hanging after token refresh](https://www.sanity.io/docs/changelog/3427a27e-797c-4875-a96d-b21227e1c89e.md) — May 13, 2026
- [Sanity React App SDK v2.7.0: Zero-config Studio integration and perspective-aware projections](https://www.sanity.io/docs/changelog/62c7139c-6ae2-4dd2-b79d-4ad7d2a24a5e.md) — February 13, 2026
- [Sanity React App SDK v2.3.0: Improved CORS error handling and authentication fixes](https://www.sanity.io/docs/changelog/805d1641-51ba-4925-bbc4-7e24f08e5409.md) — October 15, 2025