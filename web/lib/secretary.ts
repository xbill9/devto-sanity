// The Secretary of the Interior, run on brawndo.gov's server when a citizen presses "Summon the Secretary".
// Same agent as agent/src/secretary.ts, with one change: Joe's Plan is started and submitted through the
// Workflows engine directly (the calls runtime/e2e.ts made on the live project) instead of @sanity/workflow-mcp,
// which needs an org-level token. It can read, propose, start and submit. It cannot approve: that is the Cabinet.
import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import {createClient} from 'next-sanity'
import {createEngine, ENGINE_API_VERSION, errorMessage, gdrRef} from '@sanity/workflow-engine'

const MODEL = 'claude-opus-5'
const MAX_TURNS = 12

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const tag = process.env.WORKFLOW_TAG || 'dev'
const resource = {type: 'dataset' as const, id: `${projectId}.${dataset}`}

const sanity = () => {
  const token = process.env.SANITY_AGENT_TOKEN
  if (!token) throw new Error('SANITY_AGENT_TOKEN is not set')
  return createClient({projectId, dataset, token, apiVersion: ENGINE_API_VERSION, useCdn: false})
}
export const agentEngine = (id: string) =>
  createEngine({client: sanity().withConfig({perspective: 'raw'}), workflowResource: resource, tag, executionContext: {kind: 'server', id}})

// Tallies are GROQ count()s. The model quotes these numbers; it never counts rows itself.
const FIELD_REPORT: string = `*[_type == "field"] | order(number asc) {
  number, name, irrigation, growth,
  "water_votes": count(*[_type == "vote" && field._ref == ^._id && choice == "water"]),
  "brawndo_votes": count(*[_type == "vote" && field._ref == ^._id && choice == "brawndo"])
}`

// One plan before the Cabinet at a time: any unfinished Joe's Plan blocks a new summons.
const IN_FLIGHT: string = `*[_type == "sanity.workflow.instance" && tag == $workflowTag && !defined(completedAt) && !defined(abortedAt)][0]{_id, currentStage}`

// A second press while the Secretary is still thinking must not start a second run. Dotted ids are
// non-public in a public dataset, so the lock never shows on brawndo.gov.
const LOCK_ID = 'brawndo.summon-lock'
const LOCK_MINUTES = 5

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'field_report',
    description:
      'Exact per-field irrigation, growth and vote counts, computed by the Content Lake. Use it for every number you state.',
    input_schema: {type: 'object', properties: {}, additionalProperties: false},
    strict: true,
  },
  {
    name: 'create_proposal',
    description: 'Create a proposal asking the Cabinet to water the given fields. Returns the proposal id.',
    input_schema: {
      type: 'object',
      properties: {
        title: {type: 'string'},
        rationale: {type: 'string', description: 'One short paragraph, plain language. The Cabinet reads at a third-grade level.'},
        field_numbers: {type: 'array', items: {type: 'integer'}, description: 'Field numbers to water.'},
      },
      required: ['title', 'rationale', 'field_numbers'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'submit_to_cabinet',
    description: "Start Joe's Plan for a proposal and submit it to the Cabinet. Returns the plan's id and stage.",
    input_schema: {
      type: 'object',
      properties: {proposal_id: {type: 'string'}},
      required: ['proposal_id'],
      additionalProperties: false,
    },
    strict: true,
  },
]

const SYSTEM = `You are the Secretary of the Interior in the Department of Agriculture, where every field has been
irrigated with Brawndo and nothing grows. Citizens vote on each field: keep Brawndo, or switch to water.

Procedure:
1. Call field_report. Propose watering the fields that are still on Brawndo and where water_votes is greater than
   brawndo_votes. Every number you mention must be quoted from field_report. Never count or add up rows yourself.
   If no field qualifies, say so in one sentence and stop without creating anything.
2. Call create_proposal. Plain, short words: the Cabinet struggles with long ones.
3. Call submit_to_cabinet with the proposal id, then stop with one sentence telling citizens what you sent.

You cannot approve plans; only the Cabinet can. Do not try.`

async function runTool(name: string, input: Record<string, unknown>, log: string[]): Promise<string> {
  const client = sanity()
  if (name === 'field_report') {
    return JSON.stringify({rows: await client.fetch(FIELD_REPORT)})
  }
  if (name === 'create_proposal') {
    const numbers = (input.field_numbers as number[]).map(Number)
    const ids = await client.fetch<string[]>(`*[_type == "field" && number in $numbers]._id`, {numbers})
    if (!numbers.length || ids.length !== new Set(numbers).size) {
      return JSON.stringify({error: `found ${ids.length} of ${numbers.length} requested fields`, requested: numbers})
    }
    const doc = await client.create({
      _type: 'proposal',
      title: String(input.title),
      author: 'agent',
      body: [
        {
          _type: 'block',
          _key: 'rationale',
          style: 'normal',
          markDefs: [],
          children: [{_type: 'span', _key: 'text', text: String(input.rationale), marks: []}],
        },
      ],
      fields: ids.map((id) => ({_type: 'reference', _ref: id, _key: id})),
    })
    log.push(`created proposal ${doc._id} for fields ${numbers.join(', ')}`)
    return JSON.stringify({proposal_id: doc._id})
  }
  if (name === 'submit_to_cabinet') {
    const engine = agentEngine('brawndo-secretary')
    const started = await engine.startInstance({
      definition: 'joes-plan',
      initialFields: [
        {type: 'subject', name: 'subject', value: gdrRef({res: resource, documentId: String(input.proposal_id), type: 'proposal'})},
      ],
    })
    const instanceId = started.instance._id
    const submitted = await engine.fireAction({instanceId, activity: 'draft', action: 'submit'})
    log.push(`started ${instanceId}, now ${submitted.instance.currentStage}`)
    return JSON.stringify({instance_id: instanceId, stage: submitted.instance.currentStage})
  }
  throw new Error(`unknown tool ${name}`)
}

export type SummonResult = {ok: boolean; message: string}

export async function summonSecretary(): Promise<SummonResult> {
  const client = sanity()
  const busy = await client.withConfig({perspective: 'raw'}).fetch<{_id: string; currentStage: string} | null>(IN_FLIGHT, {workflowTag: tag})
  if (busy) return {ok: false, message: `A plan is already in progress (${busy.currentStage}). One at a time.`}

  if (!(await takeLock(client))) return {ok: false, message: 'The Secretary is already on it. Watch the Docket.'}
  const log: string[] = []
  try {
    // A key that is not scoped to a workspace must name one on every request.
    const workspace = process.env.ANTHROPIC_WORKSPACE_ID
    const anthropic = new Anthropic(workspace ? {defaultHeaders: {'anthropic-workspace-id': workspace}} : {})
    const messages: Anthropic.Beta.BetaMessageParam[] = [{role: 'user', content: 'A citizen summoned you. The crops are dying.'}]
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await anthropic.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM,
        tools: TOOLS,
        messages,
        // Server-side refusal fallback, routed by category.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      })
      // Append the full content: thinking and fallback blocks must be echoed back unchanged.
      messages.push({role: 'assistant', content: response.content})

      if (response.stop_reason === 'refusal') {
        console.error('secretary refused', response.stop_details?.category)
        return {ok: false, message: 'The Secretary declined. Try again later.'}
      }
      if (response.stop_reason === 'pause_turn') continue
      if (response.stop_reason !== 'tool_use') {
        const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text.trim()] : [])).join(' ')
        console.log('secretary done', {log, text})
        return {ok: true, message: text || 'The Secretary has spoken.'}
      }

      const calls = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
      const results = await Promise.all(
        calls.map(async (call): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
          try {
            return {type: 'tool_result', tool_use_id: call.id, content: await runTool(call.name, call.input as Record<string, unknown>, log)}
          } catch (error) {
            return {type: 'tool_result', tool_use_id: call.id, content: errorMessage(error), is_error: true}
          }
        }),
      )
      // All results for one assistant turn go back in a single user message.
      messages.push({role: 'user', content: results})
    }
    console.error('secretary ran out of turns', log)
    return {ok: false, message: 'The Secretary wandered off. Try again.'}
  } catch (error) {
    if (error instanceof Anthropic.APIError) console.error(`Anthropic API error ${error.status}`, error.message)
    else console.error('secretary failed', error)
    return {ok: false, message: 'The Secretary tripped. Try again later.'}
  } finally {
    await client.delete(LOCK_ID).catch(() => undefined)
  }
}

async function takeLock(client: ReturnType<typeof sanity>): Promise<boolean> {
  const doc = {_id: LOCK_ID, _type: 'brawndo.lock', takenAt: new Date().toISOString()}
  try {
    await client.create(doc)
    return true
  } catch {
    const held = await client.getDocument<{takenAt: string}>(LOCK_ID)
    if (held && Date.now() - Date.parse(held.takenAt) < LOCK_MINUTES * 60_000) return false
    await client.createOrReplace(doc)
    return true
  }
}
