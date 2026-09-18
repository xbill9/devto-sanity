// Recovery sweep, hourly (the Growth plan's limit for scheduled Functions): release stale claims, tick
// in-flight plans and drain anything the drainer missed. The prompt harvest tick is brawndo.gov's /api/tick.
// Replaces `npm run runtime:watch` for ticking. docs/sanity/workflows/sanity-functions.md
import {createClient} from '@sanity/client'
import {scheduledEventHandler} from '@sanity/functions'
import {createEngine, ENGINE_API_VERSION, errorMessage, instancesQuery, sweepStaleClaims} from '@sanity/workflow-engine'

import {effectHandlers, useContentClient} from '../../runtime/effect-handlers'

const tag = process.env.WORKFLOW_TAG ?? 'dev'

export const handler = scheduledEventHandler(async ({context}) => {
  // Scheduled Functions are organization-scoped: the project and dataset come from the Blueprint's env.
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET
  if (!projectId || !dataset) throw new Error('SANITY_PROJECT_ID and SANITY_DATASET must be set')

  const client = createClient({...context.clientOptions, projectId, dataset, apiVersion: ENGINE_API_VERSION, perspective: 'raw', useCdn: false})
  useContentClient(client.withConfig({perspective: 'published'}))
  const executionContext = {kind: 'server', id: 'brawndo-tick'} as const
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

  let failed = 0
  for (const {_id, completedAt} of instances) {
    try {
      await sweepStaleClaims({client, tag, instanceId: _id, executionContext})
      if (completedAt === null) await engine.tick({instanceId: _id})
      await engine.drainEffects({instanceId: _id})
    } catch (error) {
      failed += 1
      console.error(`tick failed for ${_id}: ${errorMessage(error)}`)
    }
  }
  console.log(`processed ${instances.length} instance(s), ${failed} failed`)
  if (instances.length > 0 && failed === instances.length) throw new Error('tick failed for every instance')
})
