<!-- Source: https://www.sanity.io/docs/getting-started/projects-without-an-account (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Projects created without an account

How an AI coding agent can create a Sanity project before you sign up, what works before you claim it, and what changes when you do.

`sanity.new` is a set of instructions written for AI coding agents. You give your agent the URL, it fetches the page, and it follows what it finds there to build you a working Sanity project. No account, no login, and nothing for you to configure while it works.

The page serves markdown to agents explaining how they can set up a full Sanity project, with content schema, content, and a Studio, as well as a small Next.js app to render this content. A full end-to-end slice. You can then claim this project in your Sanity account and continue to iterate on your app.

#### Start here

[sanity.new](https://sanity.new)
The landing page for this experience. Includes the agent prompt and the markdown delivered to your agent.

## Requirements

You need a coding agent that can run commands in a terminal, and Node.js 22.12 or newer. You do not need a Sanity account, or any credentials.

If your agent cannot run terminal commands, use the [AI app builders quickstart](https://www.sanity.io/docs/getting-started/ai-app-builder-quickstart) instead. That path creates an account as part of connecting.

## What your agent does

1. **Creates the project.** `npx sanity@latest new` calls Sanity's provisioning API without authenticating. It returns a project, a dataset, a token scoped to that project, and a claim link that expires in 72 hours.
2. **Scaffolds the folders.** A Studio in `sanity/` and a Next.js frontend in `web/`. The project token is written to `sanity/.env.local`. The frontend gets `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` in `web/.env.local`, not the token. Run it inside an app you already have and it creates only `sanity/`, leaving your app alone.
3. **Asks what you are building.** Unless it already knows from your conversation, it stops and asks in one sentence what kind of content site you are building. The answer shapes the schema, so a blog and a product catalog come out differently.
4. **Builds an end-to-end slice.** Schema types for two or three document types, real content published to the dataset, and pages in the frontend that query it with GROQ and render it. Narrow and working, rather than broad and half-finished.
5. **Verifies and hands over.** It queries the content back and loads the page that renders it before telling you it is done, and it gives you the claim link.

From there it is an ordinary Sanity project, and your agent builds on it the way it would build on any other.

## Doing it yourself

None of this needs an agent. You can run `npx sanity@latest new` from a terminal to provision a project without an account.

If you want a more bespoke setup, we recommend signing up, or creating the project in an account you already have. That skips the claim step and the limitations covered below, and lets you choose your own template and framework. Provisioning without signing up is most useful for agents.

## Core concepts

### The 72-hour window

An unclaimed project expires 72 hours after it is created. When it expires, the project and its content are deleted and cannot be recovered.

Claiming is free and takes about a minute. You can claim at any point in the window, and claiming early costs you nothing. It does not interrupt your agent or change what it is building. There is no reason to wait until the end.

### The claim link

The claim link is a credential. Anyone who opens it and signs in becomes the owner of the project. Treat it the way you would treat a password: keep it out of shared channels, issue trackers, and version control.

The link works once. After a project is claimed, the link reports that the project is already claimed rather than transferring it again.

If you lose the link, your agent can recover it. Running `sanity projects unclaimed` lists every unclaimed project created on this machine, each with its claim link and expiry. The CLI also prints a reminder before other commands until the project is claimed.

Your agent should give you the claim link early rather than at the end. You can claim the project while it is still working.

### The project token

An unclaimed project has no members, so your agent acts as the project itself rather than as a person. It does that with a project token, written to `sanity/.env.local`.

The token writes, publishes, and reads drafts. Published documents are public, so the frontend does not need it. The token stays valid after you claim the project, so nothing breaks at the moment you claim. Once you have signed in as yourself, you can remove it.

## Limitations before you claim

An unclaimed project is a real project. The content you create is real content, the Studio is a real Studio, and none of it is throwaway. A few things are held back while the project has no owner.

**You cannot deploy a hosted Studio.** `sanity deploy`, which publishes a Studio to a `sanity.studio` address, needs an owner and fails until the project is claimed. Running the Studio locally works throughout, and that is where your agent does its work.

**A local Studio signs in with the token.** There is no account and no browser session yet, so the Studio authenticates from the token rather than from a login. Your agent handles this. CORS is set for two origins: `http://localhost:3333` for the Studio, and `http://localhost:3000` for a frontend app. No other CORS origins are set, so a Studio or app on a different port cannot connect from the browser. After you claim, you can add and remove origins in project settings.

> [!WARNING]
> Keep the project token on the server
> The token can write to your project, so it belongs in server-side environment variables only. Never put it in a variable your framework sends to the browser, which means anything prefixed `NEXT_PUBLIC_`, `PUBLIC_`, `VITE_`, or `SANITY_STUDIO_`. The token remains valid after you claim, but you will not need it to open the Studio. You can sign in with your account instead.

**Image and file uploads are unavailable.** Your agent uses external image URLs while it builds. Once the project is claimed, you can upload real assets.

**You cannot add datasets, tokens, or CORS origins.** An unclaimed project has one dataset and one token. The rest of project settings opens up once the project is yours.

**There is no user account yet.** You act as the project rather than as a person, so `sanity login` is not part of this flow.

When your agent fetches `sanity.new`, it knows about these limitations and how to work around them.

## What happens when you claim

The project transfers to your Sanity account when you open the claim link. Sign in with an account you already have, or create one as part of claiming.

You choose which organization the project lands in. If you do not have one yet, Sanity creates it for you, and you can rename it later in settings. You can move the project to a different organization at any point after claiming.

Claiming also does the following:

- You become an administrator of the project.
- The project moves onto our free growth trial plan.
- Everything your agent built comes with it, including content, schema, and history.
- The project token keeps working.

## After you claim

The project is yours and works as it is. However, you can clean a few things up after claiming.

1. To act as yourself rather than as the project, run `sanity login`.
2. To stop commands in that directory authenticating as the project, remove the `SANITY_AUTH_TOKEN` line from `sanity/.env.local`.

Optionally, you can also do the following:

- Host the Studio at a `sanity.studio` address with `sanity deploy`.
- Upload real images. Uploading works as soon as the project is claimed, from the Studio or with `client.assets.upload()`. To render them, add `@sanity/image-url` to build display URLs from the stored asset references.
- Connect your editor to Sanity directly with `sanity mcp configure`.

## Next steps

- [Quickstart: AI coding agents](https://www.sanity.io/docs/getting-started/ai-coding-agents) for the full setup path with Claude Code, Cursor, and similar agents.
- [Get started with AI](https://www.sanity.io/docs/ai/get-started) for using Sanity docs in your editor, `llms.txt`, and Sanity Learn.



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity Studio v6.10.0: Studio SDK integration, CLI asset uploads and token expiry, and presentation and Vision fixes](https://www.sanity.io/docs/changelog/studio-Ni45LjI.md) — August 18, 2026
- [Sanity Studio v6.9.2: Sanity New, Content Releases fixes, and Studio UI improvements](https://www.sanity.io/docs/changelog/studio-Ni45LjE.md) — August 11, 2026