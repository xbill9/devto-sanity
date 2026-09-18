<!-- Source: https://www.sanity.io/docs/app-sdk/sdk-configuration (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Configuration

Learn how to connect your custom app to your Sanity content

App SDK apps have two separate configuration files. The **CLI configuration** (`sanity.cli.ts`) controls your project setup, build tooling, and deployment. The **runtime configuration** (`SanityConfig`) connects your app to one or more Sanity projects at runtime.

## CLI configuration

The `sanity.cli.ts` file at the root of your project defines how the Sanity CLI builds, serves, and deploys your app. Pass your configuration to `defineCliConfig`:

**sanity.cli.ts**

```typescript
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    organizationId: 'your-org-id',
    entry: './src/App.tsx',
  },
  deployment: {
    appId: 'your-app-id',
  },
})
```

### App icon and title

You can customize how your app appears in the Sanity dashboard by setting an icon and a display title in the app object of your sanity.cli.ts file.

Use `app.icon` to provide a path to an SVG file, and `app.title` to set a default display name for your app.

**sanity.cli.ts**

```typescript
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    organizationId: 'your-org-id',
    entry: './src/App.tsx',
    icon: './path/to/icon.svg',
    title: 'Default Title',
  },
  deployment: {
    appId: 'your-app-id',
  },
})
```

> [!TIP]
> SVG files only
> The icon field accepts a relative path to an SVG file from the project root. Other image formats are not supported.

### Control Dashboard visibility

Set `app.visibility` to control whether your app appears in the Dashboard sidebar. It defaults to `default` when omitted:

- `default`: listed in the Dashboard sidebar and opens in the Dashboard when selected.
- `unlisted`: hidden from the sidebar, but still opens in the Dashboard when someone follows a direct link.

> [!WARNING]
> Unlisted apps are not private
> `unlisted` only hides the app from the sidebar. It does not restrict access. Anyone with the link can still open it. Use it to share work in progress, not to secure an app.

Set the value in `sanity.cli.ts`. The CLI applies it when you deploy:

**sanity.cli.ts**

```typescript
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    organizationId: 'your-org-id',
    entry: './src/App.tsx',
    visibility: 'unlisted',
  },
  deployment: {
    appId: 'your-app-id',
  },
})
```

Setting visibility from the CLI requires the `sanity` package v6.6.0 or later. `sanity.cli.ts` is the source of truth. A redeploy re-applies `app.visibility`, so change it in config and redeploy when or if you need to make it visible (`default`) again. For apps not managed through the CLI, the [Applications API reference](https://www.sanity.io/docs/http-reference/applications-api) exposes the same field.

## Runtime configuration

The runtime configuration connects your app to Sanity projects. Define one or more `SanityConfig` objects, each with a `projectId` and `dataset`, and pass them to the `SanityApp` provider component:

**src/App.tsx**

```tsx
import {SanityApp, type SanityConfig} from '@sanity/sdk-react'

export function App() {
  const config: SanityConfig[] = [
    {
      projectId: 'YOUR_PROJECT_ID',
      dataset: 'YOUR_DATASET',
    }
  ]
  return (
    <div className="app-container">
      <SanityApp config={config} fallback={<div>Loading...</div>}>
        {/* add your own components here! */}
      </SanityApp>
    </div>
  )
}

export default App
```

### Properties

- `projectId`: the Sanity project ID to connect to. Your app needs this value to fetch content.
- `dataset`: the dataset name to query. Your app needs this value to fetch content.
- `studio`: configuration for connecting to a specific Sanity Studio instance. Additional properties include `auth` for custom authentication.

The CLI configuration file supports the following properties:

- `app.organizationId` (required): the Sanity organization ID that owns this app.
- `app.entry` (optional): the file path to your app's entry point. Defaults to `./src/App`.
- `deployment.appId` (optional): a unique identifier for your deployed app. Set automatically on first deploy.
- `server.port` and `server.hostname` (optional): local development server settings. Defaults to `localhost:3333`.

### `SanityApp` component

The `SanityApp` component wraps your application and provides all child components with the context needed to use SDK hooks and methods. It uses React Suspense internally. Props:

- `config`: an array of `SanityConfig` objects. Each needs a `projectId` and `dataset`. Required for standalone apps. Optional when running inside Sanity Studio (zero-config mode).
- `fallback` (optional): a React node to display while the SDK initializes.

Place `SanityApp` at the root of your component tree. All SDK hooks must be called from components rendered inside `SanityApp`.

## Environment variables

Environment variables prefixed with `SANITY_APP_` are automatically picked up by the Sanity CLI tool, development server, and bundler.

Any found environment variables are available as `process.env.SANITY_APP_VARIABLE_NAME`—even in browser code.

By requiring this `SANITY_APP_` prefix, we prevent unrelated (and potentially sensitive) environment variables from getting exposed to the browser bundle. You can learn more about environment variables in the [Studio documentation](https://www.sanity.io/docs/studio/environment-variables).

#### Next steps

[Document handles](https://www.sanity.io/docs/app-sdk/document-handles)
Document handles are a central concept in the Sanity App SDK, and are important to understand when working with many of the SDK's React hooks.

[React Hooks](https://www.sanity.io/docs/app-sdk/sdk-react-hooks)
Meet some of the most important hooks from the React SDK package.

[Fetching and handling content](https://www.sanity.io/docs/app-sdk/fetching-and-handling-content)
Learn about the central concepts and hooks for pulling content from your Sanity project into your custom app.

## App metadata

When you deploy your app for the first time with `npx sanity deploy`, the CLI prompts you for an app identifier. You can manage your deployed app's settings in **Manage**.

## Run your SDK app locally

In your app directory, run the dev command:

**npm**

```shell
npm run dev
```

**pnpm**

```shell
pnpm run dev
```

**yarn**

```shell
yarn run dev
```

**bun**

```shell
bun run dev
```

You should get a confirmation like the one displayed below.

**Terminal**

```sh
Dev server started on port 3333
View your app in the Sanity dashboard here:
https://www.sanity.io/@[ORGANIZATION-ID]?dev=http%3A%2F%2Flocalhost%3A3333
```



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity React App SDK v2.14.0: Expanded auth logging with automatic redaction](https://www.sanity.io/docs/changelog/043415cf-d7e2-42df-b9e8-d934399d1216.md) — June 12, 2026