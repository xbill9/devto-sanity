// Effect drainer: wakes when a Joe's Plan instance gains unclaimed work (the Cabinet approved, so
// water-fields is queued; the plan reached harvest, so harvest-fields is queued) and runs it.
// Replaces `npm run runtime:watch` for draining. docs/sanity/workflows/sanity-functions.md
import {createClient} from '@sanity/client'
import {documentEventHandler} from '@sanity/functions'
import {createEngine, ENGINE_API_VERSION} from '@sanity/workflow-engine'

import {effectHandlers, useContentClient} from '../../runtime/effect-handlers'

const tag = process.env.WORKFLOW_TAG ?? 'dev'

export const handler = documentEventHandler<{_id: string}>(async ({context, event}) => {
  const {projectId, dataset} = context.clientOptions
  if (!projectId || !dataset) throw new Error('The Function event has no project or dataset')

  const client = createClient({...context.clientOptions, apiVersion: ENGINE_API_VERSION, perspective: 'raw', useCdn: false})
  useContentClient(client.withConfig({perspective: 'published'}))
  const engine = createEngine({
    client,
    workflowResource: {type: 'dataset', id: `${projectId}.${dataset}`},
    tag,
    executionContext: {kind: 'drainer', id: 'brawndo-drain'},
    effects: {handlers: effectHandlers, missingHandler: 'skip'},
  })

  await engine.drainEffects({instanceId: event.data._id})
})
