<!-- Source: https://www.sanity.io/docs/next-js-quickstart/setting-up-your-studio (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Setting up your studio

Quickstart for getting up and running with Sanity from scratch.

## Create a new Studio with Sanity CLI

![Video](https://stream.mux.com/wIMs3CS7T4pP7hRArpQZsBZ01Be02vCjbK)

Run the command in your Terminal to initialize your project on your local computer.

See the documentation if you are [having issues with the CLI](https://www.sanity.io/docs/help/cli-errors).

**npm**

```shell
npm create sanity@latest -- --dataset production --template clean --typescript --output-path studio-hello-world
cd studio-hello-world
```

**pnpm**

```shell
pnpm create sanity@latest --dataset production --template clean --typescript --output-path studio-hello-world
cd studio-hello-world
```

**yarn**

```shell
yarn create sanity@latest --dataset production --template clean --typescript --output-path studio-hello-world
cd studio-hello-world
```

**bun**

```shell
bun create sanity@latest --dataset production --template clean --typescript --output-path studio-hello-world
cd studio-hello-world
```

## Run Sanity Studio locally

Inside the directory of the Studio, start the development server by running the following command.

**npm**

```shell
# in studio-hello-world 
npm run dev
```

**pnpm**

```shell
# in studio-hello-world 
pnpm run dev
```

**yarn**

```shell
# in studio-hello-world 
yarn run dev
```

**bun**

```shell
# in studio-hello-world 
bun run dev
```

## Log in to the Studio

**Open** the Studio running locally in your browser from [http://localhost:3333](http://localhost:3333).

You should now see a screen prompting you to log in to the Studio. Use the same service (Google, GitHub, or email) that you used when you logged in to the CLI.

