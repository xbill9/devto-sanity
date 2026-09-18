// Harvest heartbeat. Time passing creates no document event, so a `growing` plan only moves to harvest when
// something ticks it. Cloud Scheduler calls this every minute (the Growth plan limits scheduled Sanity Functions
// to hourly). Ticking only queues the harvest-fields effect; the brawndo-drain Sanity Function performs it.
import {createClient} from 'next-sanity'
import {ENGINE_API_VERSION, errorMessage, instancesQuery, sweepStaleClaims} from '@sanity/workflow-engine'
import {agentEngine} from '@/lib/secretary'

export const dynamic = 'force-dynamic'

const tag = process.env.WORKFLOW_TAG || 'dev'

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.TICK_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return new Response('forbidden', {status: 403})

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    token: process.env.SANITY_AGENT_TOKEN,
    apiVersion: ENGINE_API_VERSION,
    perspective: 'raw',
    useCdn: false,
  })
  const engine = agentEngine('brawndo-tick-http')
  const executionContext = {kind: 'server', id: 'brawndo-tick-http'} as const
  const {query, params} = instancesQuery({tag, filter: {includeCompleted: false}})
  const instances = await client.fetch<Array<{_id: string}>>(`${query}{_id}`, params)

  let failed = 0
  for (const {_id} of instances) {
    try {
      await sweepStaleClaims({client, tag, instanceId: _id, executionContext})
      await engine.tick({instanceId: _id})
    } catch (error) {
      failed += 1
      console.error(`tick failed for ${_id}: ${errorMessage(error)}`)
    }
  }
  return Response.json({ticked: instances.length, failed})
}
