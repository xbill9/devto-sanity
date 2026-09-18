<!-- Source: https://www.sanity.io/docs/getting-started/ai-coding-agents (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Quickstart: AI coding agents

Written for AI coding agents: point your agent (Claude Code, Cursor) at this page and it installs the toolkit, gets you authenticated, and scaffolds a running Sanity Studio while guiding you.

> [!NOTE]
> This guide is written for your AI coding agent
> Point your coding agent (Claude Code, Cursor, or similar) at this page and ask it to set up Sanity. It reads these steps, builds your project, and walks you through the choices. You don't need to install anything first.
> **Agents: **If you don’t have CLI access, go to the [AI app builder quickstart](https://www.sanity.io/docs/getting-started/ai-app-builder-quickstart) to guide your user. If the user has no Sanity account and doesn’t want to create one yet, go to [sanity.new](https://sanity.new) and follow the instructions there. It creates a real project they claim later, so you can build now. Else, follow the steps below in order. Everything you need is on this page, and `sanity init` will set up Sanity's skills and MCP server for you as it runs.
> To understand what an unclaimed project is before you start, see [Projects created without an account](https://www.sanity.io/docs/getting-started/projects-without-an-account).

Set up Sanity for the user by following each step. Tell the user what you're doing in a line or two per step, ask the questions called out below, and use the command-line flags shown so the only thing that pauses is the sign-in step, which the user handles.

## 1. Ask what the user is building

Ask one question: what kind of content is this for? A blog, a marketing site, a product catalog, or something else? Use the answer to shape the schema and the project name. If the user is unsure, default to a blog.

## 2. Create the Studio (this signs the user in and sets up Sanity's tools)

If the user has no Sanity account and doesn’t want to create one, stop and use [sanity.new](https://sanity.new) instead, because the rest of this page assumes an account. Otherwise, run `init`. If the user isn't logged in, it prompts them to sign in or create a Sanity account in the browser. Let them finish that, since you can't do browser sign-in for them. Init automatically installs Sanity's agent skills and configures the MCP server, and nothing else prompts. Set the project name from what the user is building, and run it from the repository root, not inside a frontend app folder:

**npm**

```shell
npx sanity@latest init --yes --project-name "<project name>" --dataset-default --template clean --typescript --output-path studio
```

**pnpm**

```shell
pnpm dlx sanity@latest init --yes --project-name "<project name>" --dataset-default --template clean --typescript --output-path studio
```

**yarn**

```shell
yarn dlx sanity@latest init --yes --project-name "<project name>" --dataset-default --template clean --typescript --output-path studio
```

**bun**

```shell
bunx sanity@latest init --yes --project-name "<project name>" --dataset-default --template clean --typescript --output-path studio
```

This signs the user in if needed, installs the skills and MCP server, creates a project and a public production dataset, and scaffolds the Studio in `studio/`.

## 3. Define the schema and deploy it

Use the sanity best practices skill. Add schema types in `studio/` for the content the user described, then deploy so the editor and content tools can see them:

**Terminal**

```sh
cd studio && npx sanity@latest schema deploy
```

## 4. Add sample content

Create three to five sample documents so the Studio isn't empty. Use the Sanity MCP `create_documents` tool, or write a short script with `@sanity/client`.

## 5. Start the Studio and hand off

Start the Studio and give the user the local URL:

**Terminal**

```sh
cd studio && npx sanity@latest dev
```

Tell the user the Studio is running at `http://localhost:3333` and that they can start editing. Offer next steps: connect a frontend, or add more content types.

See also: [Get started with AI](https://www.sanity.io/docs/ai/get-started) covers using Sanity docs in your editor, `llms.txt`, and Sanity Learn.

