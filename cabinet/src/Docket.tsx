import {useClient} from '@sanity/sdk-react'
import {actionRendering, createEngine, errorMessage, type Engine} from '@sanity/workflow-engine'
import {useWorkflowInstances, useWorkflowSession} from '@sanity/workflow-sdk'
import {useMemo, useState} from 'react'
import {DATASET, PROJECT_ID, WORKFLOW_TAG} from './config'

function useEngine(): Engine {
  const client = useClient({apiVersion: '2026-09-01'})
  return useMemo(
    () =>
      createEngine({
        client,
        workflowResource: {type: 'dataset', id: `${PROJECT_ID}.${DATASET}`},
        tag: WORKFLOW_TAG,
        executionContext: {kind: 'sdk-app', id: 'cabinet-room'},
      }),
    [client],
  )
}

export function Docket() {
  const engine = useEngine()
  const {instances, loading} = useWorkflowInstances({engine, filter: {stage: 'cabinet'}})
  if (loading) return <p className="status">Loading the docket…</p>
  return (
    <section>
      <h2>Before the Cabinet</h2>
      {!instances?.length ? (
        <p>Nothing to decide. Go have a Brawndo.</p>
      ) : (
        <ul className="docket">
          {instances.map((instance) => (
            <PlanCard key={instance._id} engine={engine} instanceId={instance._id} />
          ))}
        </ul>
      )}
    </section>
  )
}

function PlanCard({engine, instanceId}: {engine: Engine; instanceId: string}) {
  const session = useWorkflowSession({engine, instanceId})
  const [failure, setFailure] = useState<string>()

  if (session.invalid) return <li>Unreadable plan: {session.invalid.reason}</li>
  if (session.error) return <li>Could not load plan: {errorMessage(session.error)}</li>
  if (session.evaluationError) return <li>Could not evaluate plan: {errorMessage(session.evaluationError)}</li>
  if (!session.ready || !session.evaluation) return <li className="status">…</li>

  const {evaluation} = session
  const fire = async (activity: string, action: string) => {
    setFailure(undefined)
    try {
      await session.fireAction({activity, action})
    } catch (error) {
      setFailure(errorMessage(error))
    }
  }

  return (
    <li className="plan">
      <b>{evaluation.instance.definitionSnapshot ? "Joe's Plan" : instanceId}</b>
      <div className="actions">
        {evaluation.currentStage.activities.flatMap((activity) =>
          activity.actions.map((action) => {
            const rendering = actionRendering(action)
            if (rendering === 'absent' || rendering === 'automation') return null
            const title = action.action.title ?? action.action.name
            return (
              <button
                key={`${activity.activity.name}.${action.action.name}`}
                disabled={!action.allowed}
                title={action.allowed ? title : `Not allowed: ${action.disabledReason?.kind ?? 'unknown'}`}
                onClick={() => void fire(activity.activity.name, action.action.name)}
              >
                {action.action.name === 'approve' ? '💧' : '⚡'} {title}
              </button>
            )
          }),
        )}
      </div>
      {failure ? <p className="failure">{failure}</p> : null}
    </li>
  )
}
