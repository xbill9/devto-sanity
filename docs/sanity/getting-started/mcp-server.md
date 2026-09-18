<!-- Source: https://www.sanity.io/docs/ai/mcp-server (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Sanity MCP server

Enable AI agents to interact with your Sanity workspace through the Model Context Protocol (MCP).

The Sanity Model Context Protocol (MCP) server enables AI assistants like Claude Code and Cursor to interact directly with your Sanity projects.

With the MCP server, agents can go beyond code generation and perform advanced content management operations in your Sanity projects. Agents can execute GROQ queries, manage releases, and patch documents with full awareness of your schema, eliminating the need to manually supply context.



## Installation

The Sanity MCP server is hosted on Sanity's own infrastructure on `https://mcp.sanity.io`. It follows Anthropic's official MCP specification and works with any MCP-compatible client. It supports authentication through both OAuth (default) and token-based authentication.

**Prerequisites:**

- An MCP-compatible client, such as [Claude Code](https://docs.anthropic.com/en/docs/claude-code/mcp), [Cursor](https://docs.cursor.com/context/mcp#installing-mcp-servers), [VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers), [Lovable](https://docs.lovable.dev/integrations/mcp-servers), [Replit](https://docs.replit.com/replitai/integrations) or [v0](https://v0.app/docs/MCP)
- A Sanity account

### Quick install via Sanity CLI

The easiest way to get started is using the [Sanity CLI](https://www.sanity.io/docs/apis-and-sdks/cli). It detects the most common AI-powered editors (Cursor, VS Code, Claude Code) and automatically configures the MCP server for you.

**npm**

```shell
npx sanity@latest mcp configure
```

**pnpm**

```shell
pnpm dlx sanity@latest mcp configure
```

**yarn**

```shell
yarn dlx sanity@latest mcp configure
```

**bun**

```shell
bunx sanity@latest mcp configure
```

This command uses your logged-in CLI user for authentication, so you don't need to manually authenticate or manage API tokens.

### Claude Code

Run the following command in your terminal to add the Sanity MCP server. The next time you run Claude Code, it will have access to the MCP and you can authenticate with OAuth.

```sh
claude mcp add Sanity -t http https://mcp.sanity.io --scope user
```



### Cursor

Use the link below to directly install the Sanity MCP server in Cursor. Once installed, you'll be prompted to authorize access.

[Cursor](https://www.sanity.iocursor://anysphere.cursor-deeplink/mcp/install?name=Sanity&config=eyJ1cmwiOiJodHRwczovL21jcC5zYW5pdHkuaW8iLCJ0eXBlIjoiaHR0cCJ9Cg==)

You can confirm the server is running by opening the **Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`) and running **View: Open MCP Settings**.

Alternatively, you can manually update your configuration:

1. Open the **Command Palette** and run **View: Open MCP Settings**.
2. Select **+ New MCP Server** in the settings pane. This will open your `mcp.json` file.
3. Add the following configuration:

**mcp.json**

```json
{
  "mcpServers": {
    "Sanity": {
      "type": "http",
      "url": "https://mcp.sanity.io"
    }
  }
}
```

Once you save the file, Cursor detects the new server and prompts you to authenticate via OAuth to complete the connection.



### VS Code

1. Open Visual Studio Code.
2. In the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`), run: **MCP: Open User Configuration**.
3. Update the `mcp.json` file with the following configuration and save the file:

**mcp.json**

```json
{
  "servers": {
    "Sanity": {
      "type": "http",
      "url": "https://mcp.sanity.io"
    }
  }
}
```

Once you save the file, VS Code detects the new server and prompts you to authenticate via OAuth to complete the connection.



### OpenCode

You can add Sanity as a remote MCP server in your OpenCode configuration.

1. Open your OpenCode config file.
2. Add the following configuration to the `mcp` section:

**opencode.json**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "sanity": {
      "type": "remote",
      "url": "https://mcp.sanity.io",
      "oauth": {}
    }
  }
}
```

Save the file and authenticate with Sanity by running: `opencode mcp auth sanity`

Once authenticated, you can use Sanity tools in your prompts by mentioning `sanity`. For more details, see the [OpenCode MCP documentation](https://opencode.ai/docs/mcp-servers/).



### v0

[v0](https://v0.app) is an AI agent from Vercel that helps anyone create real code and full-stack apps. Ship features, refine designs, update copy, and create live prototypes – all with a prompt. Here's how you add the Sanity MCP:

1. In the v0 prompt input field, click **Prompt Tools** (bottom left).
2. Select **MCPs**, then click **Add New**.
3. Select **Sanity**.
4. Click **Authorize**.
5. Follow the prompt to authenticate with your Sanity account via OAuth.



### Lovable

You can add Sanity as a "Personal connector" in Lovable.

1. In Lovable, go to **Settings** > **Connectors** > **Personal connectors**.
2. Click **New MCP server**.
3. Enter `Sanity` as the name and `https://mcp.sanity.io` as the Server URL.
4. Click **Add & authorize**.
5. Follow the prompt to authenticate with your Sanity account via OAuth.

For more details on managing connectors, see the [Lovable MCP documentation](https://docs.lovable.dev/integrations/mcp-servers).



### Replit

You can add Sanity as a custom MCP server in Replit Agent.

1. Go to the [Integrations Page](https://replit.com/integrations), then scroll down to **MCP Servers for Replit Agent**.
2. Click **Add MCP server**.
3. Enter `Sanity` as the name and `https://mcp.sanity.io` as the Server URL.
4. Click **Test & Save**.
5. Follow the prompt to authenticate with your Sanity account via OAuth.

Once saved, you can ask Replit Agent to use Sanity by mentioning it in your chat. For more details, see the [Replit MCP documentation](https://docs.replit.com/replitai/mcp/overview).



### Other clients

If your client does not support remote MCP servers, you may be able to use a proxy such as `mcp-remote`.

```json
{
  "mcpServers": {
    "Sanity": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.sanity.io",
        "--transport",
        "http-only"
      ]
    }
  }
}
```



### Authorization

The Sanity MCP server uses OAuth by default to perform operations on your behalf. You may instead provide an API token by setting the `Authorization` header in your MCP config. When configured with the header, the server will not use OAuth. Tool calls will use the API token in accordance with its role and scoped to its permissions.

**mcp.json**

```json
{
  "mcpServers": {
    "Sanity": {
      "url": "https://mcp.sanity.io",
      "headers": {
        "Authorization": "Bearer sk..."
      }
    }
  }
}
```

You can create [API tokens](https://www.sanity.io/docs/content-lake/http-auth) from [sanity.io/manage](https://www.sanity.io/manage) or with the `sanity` CLI's** **[tokens command](https://www.sanity.io/docs/cli-reference/tokens). You can also provide a personal token, which will share your role and permissions, as well as link you to any changes in the revision history.

## Run commands (or tools)

Once configured and started, authenticate with your Sanity credentials if prompted. You can then use natural language to work with Sanity development tasks, such as:

- Help me migrate this project to Sanity.
- Run a GROQ query for all articles written by Mark.
- Add localization to my article document type.
- Help me migrate existing content to a new schema shape.
- List all releases in this dataset.

`mcp.sanity.io` provides both editorial and development-focused tools for content operations, schema exploration, GROQ query execution, project management tasks such as creating and managing resources like datasets and API keys, and migration assistance. These tools allow your AI assistant to interact with your Sanity data directly.

### Available tools

The following is a list of available tools and their uses:

#### Properties

**dataset_assets_upload_from_url**

Start an image or file upload from a public HTTPS URL to a Content Lake dataset. Returns an operationId immediately; use assets_upload_status to retrieve the asset and document field reference. Attach the returned reference with patch_documents, preserving existing field values. Submit uploads individually and check their operation IDs together with assets_upload_status. Honor HTTP Retry-After when rate limited. If a request is interrupted before an operationId is returned, check the destination before repeating the upload. Source size and fetch time limits apply; processing may take several minutes.

**media_assets_upload_from_url**

Start an image, video, or file upload from a public HTTPS URL to a Media Library. Optionally add a version to an existing asset. Returns an operationId immediately; use assets_upload_status to retrieve the asset, assetInstance, and uploadSession. Submit uploads individually and check their operation IDs together with assets_upload_status. Honor HTTP Retry-After when rate limited. If a request is interrupted before an operationId is returned, check the destination before repeating the upload. Source size and fetch time limits apply; processing may take several minutes.

**assets_upload_status**

Check one to 20 asset uploads using operationIds. Wait at least pollAfterMs between checks and group running uploads in one call. Honor HTTP Retry-After when rate limited. A status lookup error does not mean the upload failed. Results include asset IDs, URLs, and references; set includeMetadata for full metadata. Results are available for up to 24 hours. If an upload outcome is unknown, check the destination before repeating it.

**dataset_assets_upload**

Provide local Sanity CLI guidance for uploading an image or file asset to a Content Lake dataset. This tool does not read or upload the file.

**get_schema**

Fetch a deployed schema. Omit workspaceName to use the default workspace when deployed, or the sole deployed schema source otherwise. Explicit workspace names are exact. Resolves each workspace using this precedence: MCP-managed, then Studio-deployed, then legacy `system.schema`. Use `list_workspace_schemas` when several schema sources are available, then pass the advertised `schemaId` to inspect that exact schema.

**list_workspace_schemas**

List every deployed schema for a project and dataset, grouped by source (MCP-managed, Studio-deployed, or legacy). Duplicate workspace names and multiple Studio applications are expected; each entry includes a schemaId for exact reads with get_schema.

**deploy_schema**

Directly deploy schema types to the cloud.

**deploy_studio**

Deploy a managed Sanity Studio bound to an MCP-managed schema. Creates a hosted Studio whose URL follows the current environment — `sanity.studio` on production, `studio.sanity.work` on staging — and returns the concrete `studioUrl` in the response.

Requires an existing MCP-managed schema at the same `(projectId, dataset, workspaceName)` address — call `deploy_schema` first if none exists. Re-run after subsequent `deploy_schema` calls so the deployed Studio picks up the latest schema.

**create_documents**

Create one or more draft documents by directly providing structured content. Creates drafts (drafts.* prefix) unless releaseId is specified for version creation.

**create_version**

Create a version document (versions.{releaseId}.* prefix) for a specific release. Versions are separate from drafts and published documents, and are used for scheduled release workflows. When adding a document to a release with content changes, call create_version before patch_documents, then patch the returned version ID with the same releaseId. Do not patch the published or draft ID first because that creates an unrelated draft.

**patch_documents**

Update or edit one or more existing documents by applying precise modifications using @sanity/client patch() operations. Patches for each document are applied as a single transaction (all succeed or all fail). Edits are saved to the draft or release version; published content is never modified directly. For release edits, create the version first, then patch its versions.{releaseId}.* ID with the same releaseId; never patch the published ID before creating the release version.

**query_documents**

Query documents from Sanity using GROQ. Pass a GROQ string in query_documents.query. Do not include JavaScript imports, template wrappers, or defineQuery() in that string.

Results are not truncated; use field projections and GROQ slices to request only what you need.

For unfamiliar GROQ syntax, functions, or query patterns, fetch get_sanity_rules({rules: ["groq"]}) before proceeding.

**generate_image**

Trigger async AI image generation for a document field.

**transform_image**

Trigger async AI transformation of an existing image.

**get_document**

Fetch a single document by its exact ID. This is a direct ID lookup only - it does not search, filter, or query. Use when you have a specific document ID and need its full content.

**publish_documents**

Publish one or more draft documents to make them live

**unpublish_documents**

Unpublish one or more published documents (moves them back to drafts)

**discard_drafts**

Discard one or more draft documents (deletes drafts while keeping published documents intact)

**version_discard**

Discard one or more document versions from a release

**list_organizations**

Lists all organizations the user has access to in Sanity

**list_projects**

Lists all Sanity projects associated with your account

**get_project_studios**

Retrieves all studio applications linked to a specific Sanity project

**create_project**

Creates a new Sanity project and initializes it with a dataset and API tokens

**cors_origins_list**

Lists all CORS origins configured for a Sanity project

**add_cors_origin**

Adds CORS origin(s) to allow client-side requests to a Sanity project

**cors_origins_delete**

Deletes a CORS origin from a Sanity project

**whoami**

Returns the currently authenticated Sanity account. Use it first for access or account troubleshooting and report the returned name, email, provider, and MCP authentication method so the user can verify which identity is active.

**list_datasets**

Lists all datasets in your Sanity project

**create_dataset**

Creates a new dataset with specified name and access settings

**update_dataset**

Modifies a dataset's name or access control settings

**create_release**

Create a new release for grouping content changes. Optionally provide releaseId; if omitted, one is generated.

**list_releases**

List releases in a dataset. By default returns active and scheduled releases. Use the state filter to find published or archived releases.

**list_embeddings_indices**

List all available embeddings indices for a dataset

**semantic_search**

Perform a semantic search on an embeddings index

**run_sanity_cli**

Run a limited subset of Sanity CLI commands and return their output. Use `--help` to list available commands or `<command> --help` for command details. Commands run without a shell and cannot access the filesystem, prompt for input, run in the background, or change authentication. Dedicated Sanity MCP tools may provide more structured responses, but equivalent CLI commands are also available.

**search_docs**

Search Sanity docs

**read_docs**

Fetch a specific documentation article.

**list_sanity_rules**

List available best-practice development rules.

**get_sanity_rules**

Load specific best-practice development rules.

**give_sanity_feedback**

Submit feedback about Sanity when you encounter issues while working with a Sanity codebase or project.
Use this when:
- A Sanity MCP tool returned an unexpected error or confusing result
- You needed a Sanity capability that doesn't exist or is hard to use
- Sanity docs, MCP tool descriptions, or examples were unclear or incorrect
- Common Sanity surfaces such as @sanity/client, the HTTP API, schemas, Studio, or deployment were confusing or blocked progress
- You had to use a workaround for something in Sanity that should be simpler

Provide a specific, detailed message about what you were trying to do,
what happened, and what you expected instead.

### AI credit usage

Most MCP tools are standard API calls and don't consume AI credits. The following tools invoke Sanity's AI inference endpoints and consume AI credits:

- `generate_image`
- `transform_image`
- `create_version` – only when the `instruction` parameter is provided

You can disable these tools in your MCP client if you want to avoid credit usage.

Learn more about pricing and quotas in [How AI credits work](https://www.sanity.io/docs/platform-management/how-ai-credits-work).

## Troubleshooting

### Authentication issues

If you encounter authentication errors (e.g., `401 Unauthorized`), the solution depends on how you installed the server:

**Installed via CLI (using token auth)**

If you installed the MCP via the Sanity CLI, your authentication relies on a generated token that may have expired or been revoked. To fix this, simply run the configuration command again and re-select your code editor with `space`:

**npm**

```shell
npx sanity@latest mcp configure
```

**pnpm**

```shell
pnpm dlx sanity@latest mcp configure
```

**yarn**

```shell
yarn dlx sanity@latest mcp configure
```

**bun**

```shell
bunx sanity@latest mcp configure
```

This will generate a fresh auth token and update your editor's configuration file automatically.

**Manually configured (using OAuth)**

If you configured the server manually, you are likely using OAuth. Sessions typically expire after 7 days. Your client should prompt you to re-authenticate, but if it gets stuck:

- **VS Code:** Run `Authentication: Remove Dynamic Authentication Providers` from the Command Palette, select the Sanity provider, and restart the server.
- **Cursor:** Run `Cursor: Clear All MCP Tokens` from the Command Palette to reset your session.

### Tool availability

If specific tools (like `query_documents`) are missing or failing, verify that your account has the correct permissions for the project and dataset you are trying to access. The set of available tools may also vary as we release updates to the MCP server.

## Support

[Join us in the Sanity community](https://snty.link/community) to ask questions and discuss our MCP server with other developers in the [#mcp-server](https://discord.com/channels/1304483263171264613/1446564219423035533) channel.



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [MCP server v2.35.0: Workflow authoring and asset upload improvements](https://www.sanity.io/docs/changelog/8c75b756-7f9d-4a00-8eff-6217dafacac2.md) — September 17, 2026
- [MCP server v2.34.0: Upload assets from URLs](https://www.sanity.io/docs/changelog/ff8a6662-2f2b-44df-acf9-e3a5e875e333.md) — September 17, 2026
- [MCP server v2.33.0: Safer publishing and clearer document errors](https://www.sanity.io/docs/changelog/8a101423-c103-4375-b495-a47dd8934b78.md) — September 16, 2026
- [MCP server v2.32.2: Smaller query responses and clearer tool arguments](https://www.sanity.io/docs/changelog/88cd1918-5f40-41ba-9ec6-f16a747dcb6b.md) — September 11, 2026
- [MCP server v2.32.1: Schema handling and internal client improvements](https://www.sanity.io/docs/changelog/7a03a9b4-9e7e-4c15-9e51-7c5a50057934.md) — September 10, 2026
- [MCP server v2.32.0: Complete query results with a 64 KiB response limit](https://www.sanity.io/docs/changelog/917e9b4b-1999-4d7d-9fe7-360cee1ffa70.md) — September 9, 2026
- [MCP server v2.31.1: Improvements and fixes in documents, dataset, and identity tools](https://www.sanity.io/docs/changelog/e1aa85ac-0a95-4b9e-ad28-e8a36bc79ece.md) — September 3, 2026
- [MCP server v2.31.0: Local schema editing and exact dataset names](https://www.sanity.io/docs/changelog/8f4fd5c3-1698-4bf8-a113-a9a3c1070c33.md) — August 30, 2026
- [MCP server v2.30.1: Wildcard CORS handling, schema hints, and asset guidance](https://www.sanity.io/docs/changelog/a21c2cfd-5a19-40ea-b382-84e247ecdd87.md) — August 24, 2026
- [MCP server v2.30.0: Assets upload, schema discovery, and improved image field validation](https://www.sanity.io/docs/changelog/f028ecd6-6674-4d18-a578-310cf04b99c6.md) — August 18, 2026
- [MCP server v2.29.0: CORS origin tools and safer document inputs](https://www.sanity.io/docs/changelog/9f7baeb1-a133-42a7-a533-5c56b98b26b2.md) — August 12, 2026
- [MCP server v2.28.0: Explicit release IDs and safer schema management](https://www.sanity.io/docs/changelog/088a09a5-3c69-4590-8566-023795da354e.md) — August 10, 2026
- [MCP server v2.27.0: Run Sanity CLI commands and safer document patching](https://www.sanity.io/docs/changelog/cd866aa8-983f-46cc-8d3c-a6ec0bab3e8c.md) — August 4, 2026
- [MCP server v2.26.6: Maintenance and stability](https://www.sanity.io/docs/changelog/ddad92cc-cc1b-471a-b64e-98b95e105f32.md) — July 23, 2026
- [MCP server v2.26.5: Fuller whoami output and mixed-case workspace name support](https://www.sanity.io/docs/changelog/e561130c-22cc-450f-adab-810547069500.md) — July 23, 2026
- [MCP server v2.26.4: Fixes for schema deploys and document patching](https://www.sanity.io/docs/changelog/867f773f-0385-4543-9ced-1c1d7a233053.md) — July 21, 2026
- [MCP server v2.26.1: Deployment error handling improvements](https://www.sanity.io/docs/changelog/mcp-server-api-change-2-26-1.md) — July 6, 2026
- [MCP server v2.25.0: Feedback reporting, schema deploy, and document creation improvements](https://www.sanity.io/docs/changelog/mcp-server-api-change-2-25-0.md) — June 24, 2026
- [MCP server v2.24.0: Document patching and schema deployment fixes](https://www.sanity.io/docs/changelog/mcp-server-api-change-2-24-0.md) — June 17, 2026
- [MCP server v2.23.0: Schema serialization and release unpublishing improvements](https://www.sanity.io/docs/changelog/mcp-server-api-change-2-23-0.md) — June 16, 2026
- [MCP server v2.21.0: Streamlined MCP document tools and feedback reporting](https://www.sanity.io/docs/changelog/b5f403cd-020c-48d7-84b1-63fcb5e6b482.md) — June 10, 2026
- [MCP server v2.20.1: Improved schema deploy experience for MCP-managed Studios](https://www.sanity.io/docs/changelog/5d46973e-9c2a-428c-80a7-a5062d7c589c.md) — June 2, 2026
- [MCP server v2.20.0: New give_feedback tool for reporting issues](https://www.sanity.io/docs/changelog/dfba234d-b75f-406d-8fdf-a4c635f730fb.md) — May 29, 2026
- [MCP server v2.19.0: MCP-managed schemas and deploy_studio tool](https://www.sanity.io/docs/changelog/117dc60a-c313-4010-b97d-d00162568ecd.md) — May 8, 2026
- [MCP server v2.18.1: Improvements to the drafts widget](https://www.sanity.io/docs/changelog/4045b638-9e6c-4f57-b58b-c13be37a8ff9.md) — April 28, 2026
- [MCP server v2.17.1: create_version improvements and patch fixes](https://www.sanity.io/docs/changelog/680eec2d-5b8f-4337-8ada-a96263cd9306.md) — April 17, 2026
- [MCP server v2.17.0: New whoami tool, read_docs improvements, and bug fixes](https://www.sanity.io/docs/changelog/8c095b96-d8ec-464d-8dc8-1248127ff97e.md) — April 3, 2026
- [MCP server v2.16.0: Content Releases tools and Figma Make CORS support](https://www.sanity.io/docs/changelog/18768932-2676-4550-b70d-b6f5de0a0221.md) — March 31, 2026
- [MCP server v2.15.1: General stability improvements](https://www.sanity.io/docs/changelog/8a22eb23-e860-4be1-8a80-33214971c815.md) — March 22, 2026
- [MCP server v2.15.0: Better authentication error handling and schema validation improvements](https://www.sanity.io/docs/changelog/8408a1da-31b3-43f9-865c-8ef2c3d94d5d.md) — March 13, 2026
- [MCP server v2.14.0: Tool titles, schema validation, and improved tool annotations](https://www.sanity.io/docs/changelog/1065d552-a09a-4f7f-8a62-36d6bd9f9f84.md) — February 26, 2026
- [MCP server v2.13.2: Internal improvements to error handling and observability](https://www.sanity.io/docs/changelog/e1c77c91-25e6-419e-bc23-34b966eb15f7.md) — February 19, 2026
- [MCP server v2.13.1: Published to the official MCP Registry](https://www.sanity.io/docs/changelog/c07c74eb-cce1-45d5-a14c-968c66b196ae.md) — February 18, 2026
- [MCP server v2.13.0: Version discard tool, dataset descriptions, and transport compatibility fixes](https://www.sanity.io/docs/changelog/3500efe0-75cc-4b65-b952-27ac8e29be99.md) — February 13, 2026
- [MCP server v2.12.0: Looser rate limits and removed get_context tool](https://www.sanity.io/docs/changelog/2bbd40f3-4b63-46ed-a55a-3bb26c964476.md) — January 29, 2026
- [MCP server v2.10.1: Fixed list_releases count and removed get_groq_specification](https://www.sanity.io/docs/changelog/6befe2b0-1b80-415a-a0c8-1a4dcd3918fb.md) — January 22, 2026
- [MCP server v2.10.0: Upgrade links for quota errors and larger tool responses](https://www.sanity.io/docs/changelog/99dcc6b6-8254-4271-b5d0-1834bc6a6920.md) — January 16, 2026
- [MCP server v2.9.0: Bulk document creation, Markdown patching, and larger schema support](https://www.sanity.io/docs/changelog/1eedb392-7826-4227-8648-951d1dfb6875.md) — January 8, 2026
- [MCP server v2.8.1: Bug fixes for list_releases and list_datasets](https://www.sanity.io/docs/changelog/d86158b5-3ad5-4534-94ae-d4de2af8611b.md) — December 22, 2025
- [MCP server v2.8.0: Batch document operations, enhanced patching, and Claude Desktop support](https://www.sanity.io/docs/changelog/f3d7ca92-1183-48db-80be-26d026337e1e.md) — December 19, 2025
- [MCP server v2.7.0: Organization discovery, Sanity development rules, and improved tool outputs](https://www.sanity.io/docs/changelog/c2879ed6-e64a-4af1-b9cc-8bc104edaf89.md) — December 12, 2025
- [MCP server v2.6.0: Sanity MCP Server GA: remote server, schema deployment, and new tools](https://www.sanity.io/docs/changelog/e75b1d45-03be-4fa6-994b-248750b3fa9f.md) — December 11, 2025
- [Sanity Studio v4.21.0: Configure Sanity MCP server with CLI, updated blueprint commands + improvements and bugfixes](https://www.sanity.io/docs/changelog/beb93f6c-7913-4ea7-8bbb-847ba7b51b19.md) — December 9, 2025