<!-- Source: https://www.sanity.io/docs/app-sdk/sanity-ui-sdk (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Using Sanity UI with the App SDK

How to integrate @sanity/ui, or any other UI library, in your app.

The Sanity App SDK gives you complete freedom to craft your application’s design. Whether your preferred styling solution is [Sanity UI](https://www.sanity.io/ui), [Tailwind](https://www.sanity.io/docs/app-sdk/tailwind-sdk), vanilla CSS, or something else entirely, the SDK‘s headless approach allows you to style your app with the tools your team knows best, while benefiting from powerful React hooks that unlock Sanity platform capabilities.

## Use Sanity UI in a new app

If you know you’d like to use Sanity UI as your component library of choice when creating your custom app, you can choose to initialize your app with our Sanity UI template, which implements the work shown above for you.

Just initialize your app using the `app-sanity-ui` template instead of the usual `app-quickstart` template:

**npm**

```shell
npx sanity@latest init --template app-sanity-ui
```

**pnpm**

```shell
pnpm dlx sanity@latest init --template app-sanity-ui
```

**yarn**

```shell
yarn dlx sanity@latest init --template app-sanity-ui
```

**bun**

```shell
bunx sanity@latest init --template app-sanity-ui
```

## Add Sanity UI to an existing app

First, begin by installing Sanity UI:

**npm**

```shell
npm install @sanity/ui styled-components
```

**pnpm**

```shell
pnpm add @sanity/ui styled-components
```

**yarn**

```shell
yarn add @sanity/ui styled-components
```

**bun**

```shell
bun add @sanity/ui styled-components
```

Then, in your custom application’s `src/App.tsx`, instantiate Sanity UI’s ThemeProvider as usual:

**App.tsx**

```tsx
// App.tsx
import {SanityApp, type SanityConfig} from '@sanity/sdk-react'

// Sanity UI
import '@sanity/ui/styles.css'
import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'

import {ExampleComponent} from './ExampleComponent'

// Build the Sanity UI theme
const theme = buildTheme()

export function App() {
  // apps can access many different projects or other sources of data
  const config: SanityConfig[] = [
    {
      projectId: 'project-id',
      dataset: 'dataset-name',
    },
  ]

  return (
    <ThemeProvider theme={theme}>
      <SanityApp config={config} fallback={<div>Loading...</div>}>
        {/* add your own components here! */}
        <ExampleComponent />
      </SanityApp>
    </ThemeProvider>
  )
}

export default App
```

You can now use Sanity UI as expected within your custom application.

This approach can be used for other component libraries and styling solutions, as well — just be sure to set them up with `src/App.tsx`.

## Optional: faster styled components

We’re working to migrate Sanity UI off of styled components, but until then we recommend using our fork of the library to improve performance. 

Add the corresponding package for your project’s React version to your project.

**npm**

```shell
# React 18
npm install --save-exact styled-components@npm:@sanity/styled-components
# React 19
npm install --save-exact styled-components@npm:@sanity/css-in-js
```

**pnpm**

```shell
# React 18
pnpm add --save-exact styled-components@npm:@sanity/styled-components
# React 19
pnpm add --save-exact styled-components@npm:@sanity/css-in-js
```

**yarn**

```shell
# React 18
yarn add --exact styled-components@npm:@sanity/styled-components
# React 19
yarn add --exact styled-components@npm:@sanity/css-in-js
```

**bun**

```shell
# React 18
bun add --exact styled-components@npm:@sanity/styled-components
# React 19
bun add --exact styled-components@npm:@sanity/css-in-js
```

You can read the full explanation of why we forked `styled-components`, and what benefits it offers in [the blog post](https://www.sanity.io/engineering/cut-styled-components-into-pieces-this-is-our-last-resort).



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity UI v4.0.0: Smaller bundles, subpath imports, and a required stylesheet](https://www.sanity.io/docs/changelog/ff1da457-dce8-45b7-9431-3fce5265fa8b.md) — August 10, 2026