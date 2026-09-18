<!-- Source: https://www.sanity.io/docs/workflows/app-sdk (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Build a workflow interface with the App SDK

Render live workflow state and commit actions from your own App SDK application: mount a session, handle its states, render activities and fields from the evaluation, and list instances.

> [!WARNING]
> Early access
> Workflows is in early access, built in public. Read [How early access works](https://www.sanity.io/docs/workflows/prerelease) before you rely on it.



This page is for applications outside Studio. To build a Document Action, tool, pane, input, or dialog inside Studio, see [Create a workflow-powered Document Action](https://www.sanity.io/docs/workflows/custom-studio-integrations). [Choose an integration](https://www.sanity.io/docs/workflows/reactive-session) compares the packages.

When the Studio plugin does not fit the interface you need, use `@sanity/workflow-sdk` to build the workflow experience in an App SDK application. It supplies live workflow state and the engine operations that change it.

This guide follows one application path: connect an instance, render its current work, commit user actions and field edits, then add instance lists. Use [Reusable UI components](https://www.sanity.io/docs/workflows/ui-components) for assignment and date controls. For the underlying live-data model, see [The reactive session](https://www.sanity.io/docs/workflows/reactive-session).

## Install the runtime

Use `@sanity/sdk` and `@sanity/sdk-react` 3.1 or later in the 3.x line. Install matching SDK versions and one matching version for every `@sanity/workflow-*` package.

SDK 3.1.0 can resolve `@sanity/mutate` 0.18.1, which can leave document reads pending with Sanity client 8. Before installing, merge this override into your application’s root package-manager configuration:

**package.json (npm)**

```json
{
  "overrides": {
    "@sanity/sdk": {
      "@sanity/mutate": "0.18.2"
    }
  }
}
```

**pnpm-workspace.yaml (pnpm)**

```yaml
overrides:
  '@sanity/sdk@3>@sanity/mutate': 0.18.2
```

Install the App SDK adapter and its peers:

**npm**

```shell
npm install @sanity/sdk@^3.1 @sanity/sdk-react@^3.1 @sanity/ui @sanity/workflow-components @sanity/workflow-engine @sanity/workflow-react @sanity/workflow-sdk
```

**pnpm**

```shell
pnpm add @sanity/sdk@^3.1 @sanity/sdk-react@^3.1 @sanity/ui @sanity/workflow-components @sanity/workflow-engine @sanity/workflow-react @sanity/workflow-sdk
```

**yarn**

```shell
yarn add @sanity/sdk@^3.1 @sanity/sdk-react@^3.1 @sanity/ui @sanity/workflow-components @sanity/workflow-engine @sanity/workflow-react @sanity/workflow-sdk
```

**bun**

```shell
bun add @sanity/sdk@^3.1 @sanity/sdk-react@^3.1 @sanity/ui @sanity/workflow-components @sanity/workflow-engine @sanity/workflow-react @sanity/workflow-sdk
```

`@sanity/workflow-react` supplies the shared reactive hooks that the App SDK adapter builds on. This guide imports some hooks from it directly.

Run `npm ls @sanity/sdk @sanity/mutate` or `pnpm why @sanity/mutate`. Confirm that SDK 3 resolves Mutate 0.18.2; other dependency branches may use different versions. Commit the configuration and updated lockfile.

Keep the override until your SDK release requires Mutate 0.18.2 or later and excludes 0.18.1. After removing it, reinstall and verify the dependency tree again.

## How workflow data reaches your UI

Reading a workflow instance document is not enough to render its UI. What the current user can see and do also depends on referenced content, guards, and field previews, and those inputs can change while the screen is open.

- The engine loads the instance and evaluates its definition against the content it references.
- The App SDK adapter watches those documents and feeds changes back into the engine.
- The session exposes the latest evaluation: stages, activities, fields, actions, and the reasons they are or are not available.
- Your controls call the session’s commit verbs. Successful commits update the instance and produce a new evaluation.

## Create a live session

Create one workflow session for the instance currently open in a detail view. The session keeps that instance's evaluation current and provides the operations that change it. Pass the engine and instance ID to `useWorkflowSession`. Use the hooks in [List workflow instances](https://www.sanity.io/docs/workflows/app-sdk) to discover instances without creating a session for every row.

> [!WARNING]
> Do not edit workflow instances as content
> Do not use `useEditDocument` or other content-editing APIs to change workflow instance documents. They bypass engine transactions and can break the audit trail or leave the instance internally inconsistent. Use the session’s operations instead. See [Instance writes are transactions](https://www.sanity.io/docs/workflows/engine).

**src/WorkflowPanel.tsx**

```tsx
import {useClient} from '@sanity/sdk-react'
import {createEngine} from '@sanity/workflow-engine'
import {useWorkflowSession} from '@sanity/workflow-sdk'
import {useMemo} from 'react'

const PROJECT_ID = 'YOUR_PROJECT_ID'
// The engine's state lives in its own dataset, separate from content.
const ENGINE_DATASET = 'workflows'

function WorkflowPanel({instanceId}: {instanceId: string}) {
  const client = useClient({apiVersion: '2026-04-29'})
  const engine = useMemo(
    () =>
      createEngine({
        client: client.withConfig({dataset: ENGINE_DATASET}),
        workflowResource: {type: 'dataset', id: `${PROJECT_ID}.${ENGINE_DATASET}`},
        tag: 'main',
      }),
    [client],
  )
  const session = useWorkflowSession({engine, instanceId})
  // A real UI also handles session.invalid, session.error, and
  // session.evaluationError before treating a missing evaluation as loading.
  if (!session.ready || !session.evaluation) return <p>Loading…</p>
  return <pre>{session.evaluation.instance.currentStage}</pre>
}
```

Mount it inside `SanityApp`, configured for the [dataset](https://www.sanity.io/docs/content-lake/datasets) your content lives in:

**src/App.tsx**

```tsx
<SanityApp config={[{projectId: PROJECT_ID, dataset: 'production'}]}>
  <WorkflowPanel instanceId={instanceId} />
</SanityApp>
```

The App SDK client token identifies the actor and authorizes the session’s commits.

## Render one workflow

A workflow screen must distinguish “still loading” from “this instance cannot be read.” The session reports that state and exposes the evaluation, a read-only projection of the workflow for the current actor, plus the operations that commit changes.

Handle `invalid`, `error`, and `evaluationError` before loading. Render the workflow only when `ready` is true and an evaluation is available. [Session states](https://www.sanity.io/docs/workflows/reactive-session) explains what each one means:

A failed evaluation retains the last successful `evaluation`. Check `evaluationError` before displaying that value as current. Loading content is unresolved; it is not evidence that a referenced document was deleted.

**src/WorkflowDetail.tsx**

```tsx
function WorkflowDetail({
  engine,
  instanceId,
  onBack,
}: {
  engine: Engine
  instanceId: string
  onBack: () => void
}) {
  const session = useWorkflowSession({engine, instanceId})
  if (session.invalid)
    return <CenteredStatus>Unreadable instance: {session.invalid.reason}</CenteredStatus>
  if (session.error)
    return <CenteredStatus>Could not load workflow: {errorMessage(session.error)}</CenteredStatus>
  if (session.evaluationError)
    return <CenteredStatus>Could not evaluate workflow: {errorMessage(session.evaluationError)}</CenteredStatus>
  if (!session.ready || !session.evaluation)
    return (
      <CenteredStatus>
        <Spinner />
      </CenteredStatus>
    )
  return <ReadyWorkflowDetail evaluation={session.evaluation} onBack={onBack} session={session} />
}
```

### Render activities and actions

The authored definition says which actions could exist. It does not tell your UI what is available right now. Map `evaluation.currentStage.activities`, then pass each entry from `activity.actions` to the action control. The evaluation classifies each action as filtered out, automated, allowed, or blocked:

**src/ActionButton.tsx**

```tsx
function ActionButton({
  action,
  activity,
  fire,
}: {
  action: ActionEvaluation
  activity: string
  fire: (activity: string, action: string) => Promise<void>
}) {
  const rendering = actionRendering(action)
  const title = action.action.title ?? action.action.name
  if (rendering === 'absent') return null
  if (rendering === 'automation') return <Text muted>{title} runs automatically</Text>
  return (
    <Button
      disabled={!action.allowed}
      mode="ghost"
      onClick={() => void fire(activity, action.action.name)}
      text={title}
    />
  )
}
```

### Render editable fields

Editing every keystroke as a workflow commit would create a separate history entry for every change. The evaluation’s `editableFields` identify what the current actor may edit. Use `previewField` for immediate feedback, then `editField` when the user deliberately commits:

**src/ScoreField.tsx**

```tsx
import {useState} from 'react'
import type {WorkflowSession} from '@sanity/workflow-sdk'

function ScoreField({session}: {session: WorkflowSession}) {
  const [draft, setDraft] = useState<number>()
  const field = session.evaluation?.editableFields.find((entry) => entry.name === 'score')
  if (field === undefined) return null
  return (
    <input
      type="number"
      value={draft ?? Number(field.value ?? 0)}
      disabled={!field.editable}
      onChange={(event) => {
        const value = Number(event.target.value)
        setDraft(value)
        session.previewField({field, value})
      }}
      onBlur={(event) => {
        setDraft(undefined)
        void session.editField({field, value: Number(event.target.value)})
      }}
    />
  )
}
```

## Resolve workflow actors

Workflow data stores stable actor IDs, but an interface needs names and profile details. Use `sdkProjectUserDirectory` to resolve an ID already present in workflow history or assignments:

**src/resolveActor.ts**

```typescript
import {sdkProjectUserDirectory} from '@sanity/workflow-sdk'

const actors = sdkProjectUserDirectory(sdk, projectId)
const actor = await actors.findById(actorId)

if (actor.status === 'resolved') {
  renderActor(actor.user)
} else if (actor.status === 'missing') {
  renderUnknownActor(actorId)
} else {
  renderActorLookupUnavailable()
}
```

An inaccessible lookup can mean the directory request failed or returned malformed data. Keep that outcome distinct from a missing user and let a later lookup retry.

## Edit project-member assignments

Load people and project roles with `useProjectMembers(projectId)`. It returns the `ProjectMembersState` that the picker accepts. If the role catalog cannot be read, the picker uses roles held by the loaded people. Assigning a person removes the task from other role members’ task lists, even if roles remain selected. Keep account-global user IDs and project role names as the stored values.

Headless integrations can import `loadProjectRolesOrNone` and `ProjectRole` from `@sanity/workflow-sdk/project-users`. The read needs `sanity-project-roles: read` and is cached per client and project. An unavailable catalog returns `[]` until the page reloads.

Render the project member directory with the controlled picker:

**src/ProjectMemberExample.tsx**

```tsx
import {Card, Stack, Text} from '@sanity/ui'
import {AssigneeBadges, AssigneePicker} from '@sanity/workflow-components'
import type {Assignee} from '@sanity/workflow-engine'
import {useProjectMembers} from '@sanity/workflow-sdk'
import {useState} from 'react'

export function ProjectMemberExample({projectId}: {projectId: string}) {
  const memberState = useProjectMembers(projectId)
  const [selected, setSelected] = useState<readonly Assignee[]>([])

  return (
    <Card aria-labelledby="assignment-heading" as="section" border padding={4} radius={3}>
      <Stack gap={3}>
        <Stack gap={2}>
          <Text id="assignment-heading" size={2} weight="semibold">
            Assign team members
          </Text>
          <Text muted size={1}>
            Choose the project members or roles responsible for this work.
          </Text>
        </Stack>
        <AssigneePicker {...memberState} onChange={setSelected} value={selected} />
        {selected.length > 0 ? (
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              Assigned to
            </Text>
            <AssigneeBadges assignees={selected} vocabulary={memberState} />
          </Stack>
        ) : null}
      </Stack>
    </Card>
  )
}
```

**src/AssignmentPicker.tsx**

```tsx
import {Card, Text} from '@sanity/ui'
import {AssigneePicker, type ProjectMembersState} from '@sanity/workflow-components'
import {errorMessage, type Assignee, type EditableFieldEvaluation} from '@sanity/workflow-engine'
import type {WorkflowSession} from '@sanity/workflow-sdk'
import {useState} from 'react'

type AssignmentField = EditableFieldEvaluation & {
  type: 'assignees'
  value: readonly Assignee[]
}

export function AssignmentPicker({
  field,
  members,
  session,
}: {
  field: AssignmentField
  members: ProjectMembersState
  session: Pick<WorkflowSession, 'editField'>
}) {
  const [failure, setFailure] = useState<string>()
  const change = async (next: readonly Assignee[]) => {
    setFailure(undefined)
    try {
      await session.editField({field, mode: 'set', value: next})
    } catch (cause) {
      setFailure(errorMessage(cause))
    }
  }
  return (
    <>
      <AssigneePicker {...members} onChange={change} value={field.value} />
      {failure ? (
        <Card padding={3} role="alert" tone="critical">
          <Text>Could not update assignment: {failure}</Text>
        </Card>
      ) : null}
    </>
  )
}
```

See [Reusable UI components](https://www.sanity.io/docs/workflows/ui-components) for the component contracts and other controls.

## Explain workflow decisions

A blocked action or waiting transition needs an explanation, not only a boolean. The evaluation pairs each decision with an insight that describes the condition and its unmet parts.

Use insights to explain action and activity availability, automation, requirements, transitions, and field permissions. See [Evaluation insights](https://www.sanity.io/docs/workflows/evaluation-insights) for every insight location and the field-centric proposal model.

For a blocked condition, render `blockedBy`. It lists the unmet parts of the condition in source order:

**src/whatIsLeft.ts**

```typescript
import type {TransitionEvaluation} from '@sanity/workflow-engine'

function whatIsLeft(transition: TransitionEvaluation): string[] {
  return transition.insight.blockedBy.map((atom) =>
    atom.pivotal ? `${atom.atom.groq} (this alone unblocks it)` : atom.atom.groq,
  )
}
```

For a publish transition gated on `$fields.legalApproved == true && $fields.score > 5` with both atoms unmet, this returns both. Once `score` passes 5, it returns `['$fields.legalApproved == true (this alone unblocks it)']`.

## List workflow instances

A session covers one instance. An inbox, board, or document banner has to discover which instances to show first. Use `useWorkflowInstances` for collections and `useDocumentWorkflows` for the workflows involving one document. Address that document with a [global document reference](https://www.sanity.io/docs/workflows/global-document-references):

**src/instances.tsx**

```tsx
import {useDocumentWorkflows, useWorkflowInstances} from '@sanity/workflow-sdk'

// Every in-flight instance currently in stage `review`, live.
const {instances, loading} = useWorkflowInstances({engine, filter: {stage: 'review'}})

// The instances that involve this document, live. GDR URIs only.
const forDocument = useDocumentWorkflows({
  engine,
  document: `dataset:${PROJECT_ID}:production:article-123`,
})
```

Three hooks cover different list shapes:

- `useWorkflowInstances`: a live, filterable list of full instances. Use it when the surface needs instance detail for a bounded set.
- `useDocumentWorkflows`: the in-flight instances that reference one document. Use it for a document banner.
- `useInstancePreviews`: a progressively hydrated list of reduced rows. Use it for an inbox, board, or dashboard that should not load every full instance.

The first two supply the store observer for you. `useInstancePreviews` comes from `@sanity/workflow-react` and takes one as an argument, so build it with `makeSdkObserver`:

**src/WorkflowDashboard.tsx**

```tsx
import {useSanityInstance} from '@sanity/sdk-react'
import type {Engine} from '@sanity/workflow-engine'
import {useInstancePreviews} from '@sanity/workflow-react'
import {datasetResourceId} from '@sanity/workflow-react/observer'
import {makeSdkObserver} from '@sanity/workflow-sdk/observer'
import {useMemo} from 'react'

export function WorkflowDashboard({engine}: {engine: Engine}) {
  const sdk = useSanityInstance()
  const observer = useMemo(
    () => makeSdkObserver(sdk, {engineResource: datasetResourceId(engine.workflowResource)}),
    [sdk, engine],
  )
  const {previews, drained, unreadable, error} = useInstancePreviews({
    engine,
    observer,
    filter: {includeCompleted: true},
  })

  if (error) return <p>Could not load workflows: {error}</p>
  if (!previews) return <p>Loading workflows…</p>

  return (
    <>
      <p>
        {previews.length} workflows{drained ? '' : ' so far'}
      </p>
      {unreadable.length > 0 && <p>{unreadable.length} could not be read.</p>}
      <ul>
        {previews.map((preview) => (
          <li key={preview._id}>
            {preview.definition}: {preview.currentStage}
          </li>
        ))}
      </ul>
    </>
  )
}
```

`previews` is undefined until the first page lands, and `drained` tells you whether a count over the list is a total or a minimum. A row carries no definition snapshot, so title what you render from the deployed catalog and fall back to raw names. See [Instance previews](https://www.sanity.io/docs/workflows/reactive-session) for the paging and reconnect semantics.

## Where each component input comes from

The examples above pass workflow data from one session into presentation components. This map shows where each prop originates. See [Reusable UI components](https://www.sanity.io/docs/workflows/ui-components) for the component contracts themselves.

#### Properties

**engine** (Engine)

Created with createEngine in WorkflowPanel.

**instanceId** (string)

Selected from a row returned by the instance-list hooks, or supplied by application routing.

**session** (WorkflowSession)

Returned by useWorkflowSession for the selected instance.

**evaluation** (WorkflowEvaluation)

Read from session.evaluation after the session is ready.

**activity** (ActivityEvaluation)

One entry from evaluation.currentStage.activities.

**action** (ActionEvaluation)

One entry from activity.actions.

**field** (EditableFieldEvaluation)

One entry from evaluation.editableFields.

**memberState** (ProjectMembersState)

Members, role catalog, and loading state returned by useProjectMembers.

**fire** (function)

An application callback that awaits session.fireAction and surfaces a rejected commit.

**projectId** (string)

The project ID from the application's SanityApp configuration.

**onBack / onSelect** (function)

Application-owned navigation callbacks, shown in the list-to-task example.

## Build a list-to-task application

A usable workflow application needs both discovery and detail: list readable instances, let the user choose one, then mount a session for that instance. The [reference application](https://github.com/sanity-io/workflows/tree/main/apps/workflows-tool-demo) demonstrates that boundary.

**src/WorkflowsTool.tsx**

```tsx
export function WorkflowsTool({engine}: {engine: Engine}) {
  const [selectedId, setSelectedId] = useState<string>()
  if (selectedId) {
    return (
      <WorkflowDetail
        engine={engine}
        instanceId={selectedId}
        onBack={() => setSelectedId(undefined)}
      />
    )
  }
  return <WorkflowList engine={engine} onSelect={setSelectedId} />
}
```

Branch on loading, read errors, unreadable workflow documents, an empty result, and readable instances before navigating to a detail session:

**src/WorkflowList.tsx**

```tsx
function WorkflowList({engine, onSelect}: {engine: Engine; onSelect: (id: string) => void}) {
  const {instances, loading, unreadable, error} = useWorkflowInstances({engine})
  const firstUnreadable = unreadable[0]
  if (loading) return <CenteredStatus><Spinner /></CenteredStatus>
  if (error) return <CenteredStatus>Could not load workflows: {errorMessage(error)}</CenteredStatus>
  return (
    <Page>
      <Stack gap={4}>
        <Text as="h1" size={3} weight="semibold">Workflows</Text>
        {firstUnreadable ? (
          <Text muted>
            {unreadable.length} workflow document(s) aren’t listed — this app can’t read them (
            {firstUnreadable.reason}).
          </Text>
        ) : null}
        {instances?.length ? (
          <Stack gap={3}>
            {instances.map((instance) => (
              <WorkflowRow instance={instance} key={instance._id} onSelect={onSelect} />
            ))}
          </Stack>
        ) : <Text muted>No workflow instances yet.</Text>}
      </Stack>
    </Page>
  )
}
```

## Understand live updates

The session recomputes as watched content, committed workflow state, and field previews change. [The reactive session](https://www.sanity.io/docs/workflows/reactive-session) explains watch sets, update timing, and preview behavior.

Integrating another host or data layer? [Build a custom reactive adapter](https://www.sanity.io/docs/workflows/custom-reactive-adapters).

## Next steps

- [The reactive session](https://www.sanity.io/docs/workflows/reactive-session) for the conceptual model this page renders.
- [Test a workflow before you deploy it](https://www.sanity.io/docs/workflows/testing): the test bench evaluates the same projection, so helpers like the ones on this page are directly assertable.
- [Reference guide](https://www.sanity.io/docs/workflows/reference) for the full API surface.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



