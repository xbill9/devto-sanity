<!-- Source: https://www.sanity.io/docs/app-sdk/installation-and-development (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Installation

Learn how to bootstrap a new custom application using the Sanity App SDK.

The Sanity App SDK is distributed as two separate npm packages: the core TypeScript SDK, and a ready-to-go React implementation.

- [@sanity/sdk](https://reference.sanity.io/_sanity/sdk/)
- [@sanity/sdk-react](https://reference.sanity.io/_sanity/sdk-react/)

You can use the core SDK on its own, but its main purpose is to power the React SDK. It also leaves room for other framework-specific implementations later. For now, the React SDK is the primary focus, and it’s what the bootstrapping process in this guide installs. This guide explains how to bootstrap a new App SDK application with the Sanity CLI.

## Prerequisites

- Some familiarity with JavaScript or TypeScript development.
- A terminal.
- [Node.js v22.12 or later](https://nodejs.org).
- An available project dataset. Many examples in these docs use the **Movies** template and data, which you can select when initializing a new studio. See the [Studio installation guide](https://www.sanity.io/docs/studio/installation).
- A Sanity account and an organization.

## Bootstrap a new app with the Sanity CLI

Use the [Sanity CLI](https://www.sanity.io/docs/apis-and-sdks/cli) to initialize a new application. The command creates a new React app with all the necessary dependencies and boilerplate:

**npm**

```shell
npx sanity@latest init --template app-quickstart
```

**pnpm**

```shell
pnpm dlx sanity@latest init --template app-quickstart
```

**yarn**

```shell
yarn dlx sanity@latest init --template app-quickstart
```

**bun**

```shell
bunx sanity@latest init --template app-quickstart
```

The CLI bootstraps your app and preconfigures it with your organization ID. If you have worked on a Sanity Studio project locally, the layout is familiar.

Before running your app locally, you need to add a small amount of configuration.

## Next steps

- Read the [App SDK quick start](https://www.sanity.io/docs/app-sdk/sdk-quickstart) to get up and running quickly.
- Read about the [Sanity CLI](https://www.sanity.io/docs/apis-and-sdks/cli).

