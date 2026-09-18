// Live end-to-end run of Joe's Plan against the real project, one token per actor:
//   agent (editor)        → creates a proposal, starts the plan, fires submit
//   cabinet (a person)    → approves in the Kiosk Studio (robot tokens can't hold administrator)
//   drainer (editor)      → drains water-fields, ticks, drains harvest-fields
// Prints each stage and the fields' state, read back from the Content Lake.
//   tsx runtime/e2e.ts start            → agent side; prints the instance id, stops at the Cabinet
//   tsx runtime/e2e.ts finish <id>      → drainer side, after a person approved
import {createClient} from '@sanity/client'
import {createEngine, ENGINE_API_VERSION, gdrRef} from '@sanity/workflow-engine'
import {effectHandlers} from './effect-handlers'

const projectId = process.env.SANITY_PROJECT_ID!
const dataset = process.env.SANITY_DATASET ?? 'production'
const tag = process.env.WORKFLOW_TAG ?? 'dev'
const res = {type: 'dataset' as const, id: `${projectId}.${dataset}`}
const FIELDS = ['field-07', 'field-09']

const client = (token: string | undefined, name: string) => {
  if (!token) throw new Error(`missing token for ${name}`)
  return createClient({projectId, dataset, token, apiVersion: ENGINE_API_VERSION, perspective: 'raw', useCdn: false})
}
const engineFor = (token: string | undefined, name: string, withHandlers = false) =>
  createEngine({
    client: client(token, name),
    workflowResource: res,
    tag,
    executionContext: {kind: 'script', id: `e2e-${name}`},
    ...(withHandlers ? {effects: {handlers: effectHandlers, missingHandler: 'skip' as const}} : {}),
  })

const agentClient = client(process.env.SANITY_AGENT_TOKEN, 'agent')
const agent = engineFor(process.env.SANITY_AGENT_TOKEN, 'agent')
const drainer = engineFor(process.env.SANITY_DRAINER_TOKEN, 'drainer', true)

const fieldState = () =>
  agentClient.fetch(`*[_id in $ids]|order(number asc){number, irrigation, growth}`, {ids: FIELDS})
const log = (step: string, extra: unknown = '') => console.log(`${new Date().toISOString().slice(11, 19)}  ${step}`, extra)

const [phase, argId] = process.argv.slice(2)

if (phase === 'start') {
  // Reset the two demo fields so the run is repeatable.
  await client(process.env.SANITY_DRAINER_TOKEN, 'drainer')
    .transaction(FIELDS.map((id) => ({patch: {id, set: {irrigation: 'brawndo', growth: 'dust'}, unset: ['lastWatered']}})))
    .commit()
  log('fields reset', await fieldState())

  const proposal = await agentClient.create({
    _type: 'proposal',
    title: 'E2E: water fields 7 and 9',
    author: 'agent',
    fields: FIELDS.map((id) => ({_type: 'reference', _ref: id, _key: id})),
  })
  log('agent created proposal', proposal._id)

  const started = await agent.startInstance({
    definition: 'joes-plan',
    initialFields: [{type: 'subject', name: 'subject', value: gdrRef({res, documentId: proposal._id, type: 'proposal'})}],
  })
  const instanceId = started.instance._id
  log('agent started plan', {instanceId, stage: started.instance.currentStage})

  const r = await agent.fireAction({instanceId, activity: 'draft', action: 'submit'})
  log('agent submitted', r.instance.currentStage)

  try {
    await agent.fireAction({instanceId, activity: 'decide', action: 'approve'})
    log('!! agent was able to approve — role gate did not hold')
  } catch (error) {
    log('agent approve rejected (engine verdict, advisory)', (error as Error).constructor.name)
  }
  log('now approve it as the Cabinet in the Kiosk Studio, then run: finish ' + instanceId)
} else if (phase === 'finish' && argId) {
  const instanceId = argId
  await drainer.drainEffects({instanceId})
  const afterWater = await drainer.tick({instanceId})
  log('drainer watered', {stage: afterWater.instance.currentStage, harvestAt: afterWater.instance.fields.find((f) => f.name === 'harvestAt')?.value})
  log('fields after watering', await fieldState())

  const waitMs = Number(process.env.BRAWNDO_GROW_MINUTES ?? 5) * 60_000 + 2_000
  log(`waiting ${Math.round(waitMs / 1000)}s for the crops`)
  await new Promise((resolve) => setTimeout(resolve, waitMs))

  await drainer.tick({instanceId})
  await drainer.drainEffects({instanceId})
  const done = await drainer.tick({instanceId})
  log('final stage', done.instance.currentStage)
  log('fields after harvest', await fieldState())
} else {
  console.error('usage: e2e.ts start | e2e.ts finish <instanceId>')
  process.exitCode = 1
}
