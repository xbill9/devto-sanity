<!-- Source: https://www.sanity.io/docs/app-sdk/sdk-deployment (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# App SDK deployment

Learn how to deploy your custom application to your organization dashboard.

## Deploy your app

To deploy your custom application, you use the same command as when deploying a studio: [sanity deploy](https://www.sanity.io/docs/cli-reference/deploy)

**npm**

```shell
npx sanity deploy
```

**pnpm**

```shell
pnpm dlx sanity deploy
```

**yarn**

```shell
yarn dlx sanity deploy
```

**bun**

```shell
bunx sanity deploy
```

Note that to deploy SDK apps you need a role of organization admin, Developer, or equivalent. Organization-level robot tokens with the "Manage SDK Apps" permission (which grants deploy, read, and delete access to SDK applications) can also be used to deploy SDK apps. Read more about roles and permissions [here](https://www.sanity.io/docs/content-lake/roles-concepts).

> [!NOTE]
> Deployment size limit
> A single deployment is limited to 2 GB. The limit applies to the total size of the built files in the deployment, and deploys that exceed it are rejected with an error. The same limit applies to Studio deployments and App SDK app deployments.
> Most deployments are a few megabytes, so typical projects stay well below this limit.



## Undeploy your app

To undeploy your custom application, you can use [sanity undeploy](https://www.sanity.io/docs/cli-reference/undeploy) from within your custom app’s directory.

**npm**

```shell
npx sanity undeploy
```

**pnpm**

```shell
pnpm dlx sanity undeploy
```

**yarn**

```shell
yarn dlx sanity undeploy
```

**bun**

```shell
bunx sanity undeploy
```

Note that you’ll need to have your `app.id` saved in your `sanity.cli.ts` file (as prompted during the deploy process) in order for your app’s deployment to be removed.

## Deployment setup for CI/CD

App SDK deployment requires an **organization-level** robot token with the **Manage SDK Apps** permission. This is different from Studio deployment, which uses project-level tokens. To create a sufficient token, you’ll need org-level developer or administrator permissions.

To create a robot token:

1. Go to **Manage** and select your organization.
2. Navigate to **Settings > API > Robot tokens**.
3. Create a new token and select the **Manage SDK Apps** permission.
4. Copy the token and store it as a secret in your CI/CD environment (for example, as a GitHub Actions secret).

> [!NOTE]
> At this time, you cannot create organization-level robot tokens with the CLI.

Set the `SANITY_AUTH_TOKEN` environment variable to your robot token. The Sanity CLI reads this variable automatically when deploying.

For App SDK apps, the `--title` flag is required for fully unattended deployments. Without it, the CLI will interactively prompt for an app title on the first deploy. In CI/CD pipelines, pass `--title` to skip this prompt. For example: `npx sanity deploy --title "My App"`.

### GitHub Actions example

```yaml
name: Deploy App SDK
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx sanity deploy --title 'My App'
        env:
          SANITY_AUTH_TOKEN: ${{ secrets.SANITY_DEPLOY_TOKEN }}
```

## Environment variables

The following environment variables are relevant for App SDK deployment:

- `SANITY_AUTH_TOKEN`: the organization-level robot token for authentication. Required for non-interactive deployment.
- `SANITY_APP_*`: any environment variables prefixed with `SANITY_APP_` are available in your app's browser code at build time.

## Troubleshooting

The following errors are commonly reported by developers deploying App SDK apps:

- **"Unauthorized" or "Insufficient permissions":** verify that your token is an organization-level robot token with the **Manage SDK Apps** permission enabled.
- **"Session does not match project host":** this can occur in CI/CD environments. Ensure `SANITY_AUTH_TOKEN` is set correctly and that no cached credentials are interfering.



## Related changelog entries

Entries are listed newest first; each link points to the full entry as markdown. Follow one when you need to know what changed, when, or why — for example, to summarize recent updates, explain behavior that differs from older documentation, or check whether a fix has shipped.

- [Sanity Studio v6.5.0: Bug fixes for forms and document editing, plus new deploy and undeploy JSON and dry-run flags](https://www.sanity.io/docs/changelog/studio-Ni40LjA.md) — July 14, 2026