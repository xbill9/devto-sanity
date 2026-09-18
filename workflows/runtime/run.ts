// Local runtime for joes-plan: sweeps stale claims, ticks in-flight instances, drains effects.
// Workflows is a library, not a service — nothing moves unless something calls it. This is the
// fallback for Sanity Functions (docs/DESIGN.md §4.2), following the pattern in
// docs/sanity/workflows/sanity-functions.md. Run once, or with --every <seconds>.
import {createEngine, errorMessage, instancesQuery, sweepStaleClaims} from '@sanity/workflow-engine'
import {contentClient, effectHandlers} from './effect-handlers'

const tag = process.env.WORKFLOW_TAG ?? 'dev'
const executionContext = {kind: 'drainer', id: 'brawndo-local-runtime'} as const

async function pass() {
  const client = contentClient().withConfig({perspective: 'raw'})
  const {projectId, dataset} = client.config()
  const engine = createEngine({
    client,
    workflowResource: {type: 'dataset', id: `${projectId}.${dataset}`},
    tag,
    executionContext,
    effects: {handlers: effectHandlers, missingHandler: 'skip'},
  })

  const {query, params} = instancesQuery({tag, filter: {includeCompleted: true}})
  const instances = await client.fetch<Array<{_id: string; completedAt: string | null}>>(
    `${query}[!defined(completedAt) || count(pendingEffects) > 0]{_id, completedAt}`,
    params,
  )
  for (const {_id, completedAt} of instances) {
    try {
      await sweepStaleClaims({client, tag, instanceId: _id, executionContext})
      if (completedAt === null) await engine.tick({instanceId: _id})
      await engine.drainEffects({instanceId: _id})
    } catch (error) {
      console.error(`runtime pass failed for ${_id}: ${errorMessage(error)}`)
    }
  }
  console.log(`${new Date().toISOString()} processed ${instances.length} instance(s)`)
}

const flag = process.argv.indexOf('--every')
const every = flag > 0 ? Number(process.argv[flag + 1]) : 0
await pass()
if (every > 0) setInterval(() => void pass(), every * 1000)
