<!-- Source: https://www.sanity.io/docs/app-sdk/react-suspense-sdk (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# React Suspense

Learn how the Sanity App SDK uses established React patterns to facilitate working with live content.

The Sanity App SDK [hooks](https://www.sanity.io/docs/app-sdk/sdk-react-hooks) are optimized for use with [React Suspense](https://react.dev/reference/react/Suspense). This lets you write code in a synchronous fashion, as if the data you’re requesting from App SDK hooks is available immediately.

The following example uses the value returned by the `useProjects` hook without checking whether the request is in flight or resolved:

**ProjectsList.tsx**

```tsx
import {useProjects} from '@sanity/sdk-react'

import ProjectListItem from './ProjectListItem'

export function ProjectsList() {
  const {data: projects} = useProjects()

  return (
    <ul>
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectListItem projectId={project.id} />
        </li>
      ))}
    </ul>
  )
}
```

## Fallback content with Suspense boundaries

Because App SDK hooks suspend during data fetching, you can render fallback content until data fetching is resolved using Suspense boundaries.

Given the `ProjectsList` component shown earlier, which calls the `useProjects` hook, you can wrap instances of that component in a Suspense boundary:

**ProjectsPanel.tsx**

```tsx
import {Suspense} from 'react'

import {ProjectsList} from './ProjectsList'
import LoadingSkeleton from './LoadingSkeleton'

export function ProjectsPanel() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProjectsList />
    </Suspense>
  )
}
```

If the `ProjectListItem` component uses the `useProject` hook, you can also wrap each item in its own Suspense boundary inside `ProjectsList`:

**ProjectsList.tsx**

```tsx
import {Suspense} from 'react'
import {useProjects} from '@sanity/sdk-react'

import ProjectListItem from './ProjectListItem'

export function ProjectsList() {
  const {data: projects} = useProjects()

  return (
    <ul>
      {projects.map((project) => (
        <li key={project.id}>
          <Suspense fallback={'Loading project…'}>
            <ProjectListItem projectId={project.id} />
          </Suspense>
        </li>
      ))}
    </ul>
  )
}
```

## Built-in Suspense behavior in App SDK apps

- The [SanityApp](https://reference.sanity.io/_sanity/sdk-react/exports/SanityApp/) component rendered by all Sanity custom apps includes a root-level Suspense boundary. `SanityApp` requires a `fallback` prop; the component you pass renders as the fallback content at the root level of your app. You can also wrap any other component that uses App SDK hooks in its own Suspense boundary. To learn more about how Suspense works, [refer to the React Suspense docs](https://react.dev/reference/react/Suspense).
- App SDK hooks also use [useTransition](https://react.dev/reference/react/useTransition) internally to keep UI that has already been rendered responsive and visible during data fetching.

