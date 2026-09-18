// The Secretary of the Interior: an agent that drafts "water the crops" proposals and submits
// them to the Cabinet through Joe's Plan. It can read, propose, start and submit. It cannot
// approve (the definition gates approve to the `cabinet` role) and it cannot water fields
// (its Sanity token has no write access to `field` documents — the only gate the Content Lake
// actually enforces; docs/DESIGN.md §4.2).
//
// Usage: npm start -- "optional instruction"
import Anthropic from '@anthropic-ai/sdk'
import {Client} from '@modelcontextprotocol/sdk/client/index.js'
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js'
import {createClient} from '@sanity/client'

const MODEL = 'claude-opus-5'

const env = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} must be set (see .env.example)`)
  return value
}
const projectId = env('SANITY_PROJECT_ID')
const dataset = process.env.SANITY_DATASET ?? 'production'
const workflowTag = process.env.WORKFLOW_TAG ?? 'dev'
const workflowResource = `dataset:${projectId}.${dataset}`

// Content writes (proposals only) and reads use the agent's project token.
const sanity = createClient({projectId, dataset, token: env('SANITY_AGENT_TOKEN'), apiVersion: '2026-09-01', useCdn: false})

// Only these Workflows MCP tools are offered to the model. Deploy and authoring are withheld.
// This is a convenience, not a boundary: the token's Content Lake access is the boundary.
const MCP_ALLOWLIST = new Set([
  'workflows_list_tags',
  'workflows_list_instances',
  'workflows_get_state',
  'workflows_diagnose',
  'workflows_start',
  'workflows_fire_action',
])

// Tallies are GROQ count()s. The model quotes these numbers; it never counts rows itself.
const FIELD_REPORT = `*[_type == "field" && ($irrigation == "any" || irrigation == $irrigation)] | order(number asc) {
  _id, number, name, irrigation, growth,
  "water_votes": count(*[_type == "vote" && field._ref == ^._id && choice == "water"]),
  "brawndo_votes": count(*[_type == "vote" && field._ref == ^._id && choice == "brawndo"])
}`

const LOCAL_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'field_report',
    description:
      'Exact per-field state and vote counts, computed by the Content Lake. Use it for every number you state. ' +
      'Returns the GROQ filter it ran so you can quote it.',
    input_schema: {
      type: 'object',
      properties: {irrigation: {type: 'string', enum: ['any', 'brawndo', 'water'], description: 'Filter by current irrigation.'}},
      required: ['irrigation'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: 'create_proposal',
    description:
      'Create a proposal document asking the Cabinet to water the given fields. Returns its document id, ' +
      'which is the subject to pass when starting joes-plan.',
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
]

async function runLocalTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === 'field_report') {
    const irrigation = String(input.irrigation)
    const rows = await sanity.fetch(FIELD_REPORT, {irrigation})
    return JSON.stringify({filter: `irrigation == ${JSON.stringify(irrigation)}`, rows})
  }
  if (name === 'create_proposal') {
    const numbers = (input.field_numbers as number[]).map(Number)
    const ids = await sanity.fetch<string[]>(`*[_type == "field" && number in $numbers]._id`, {numbers})
    if (ids.length !== new Set(numbers).size) {
      return JSON.stringify({error: `found ${ids.length} of ${numbers.length} requested fields`, requested: numbers})
    }
    const doc = await sanity.create({
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
    return JSON.stringify({proposal_id: doc._id, subject_uri: `dataset:${projectId}:${dataset}:${doc._id}`})
  }
  throw new Error(`unknown local tool ${name}`)
}

const SYSTEM = `You are the Secretary of the Interior in the Department of Agriculture, where every field has been
irrigated with Brawndo and nothing grows. Your job: propose watering the fields with water, and submit the
proposal to the Cabinet through the "joes-plan" workflow.

Workflow environment: workflow_resource "${workflowResource}", tag "${workflowTag}". Pass both on every
workflows_* call (confirm the tag with workflows_list_tags first).

Procedure:
1. Call field_report. Choose the fields to water from its rows. Every number you mention must be quoted from
   a field_report result, together with the filter it reports. Never count or add up rows yourself.
2. Call create_proposal. Plain, short language: the Cabinet struggles with long words.
3. Start "joes-plan" with workflows_start, using the proposal as the subject. Read the tool's schema and
   workflows_get_state for the exact field shape; do not guess.
4. Fire the "submit" action on the "draft" activity with workflows_fire_action.
5. Confirm with workflows_get_state that the plan is in the "cabinet" stage, then stop.

You cannot approve plans; only the Cabinet can. Do not try. If a step fails, call workflows_diagnose,
report what it says, and stop.`

function mcpToolToAnthropic(tool: {name: string; description?: string; inputSchema: Record<string, unknown>}): Anthropic.Beta.BetaTool {
  return {
    name: tool.name,
    description: tool.description ?? tool.name,
    input_schema: tool.inputSchema as Anthropic.Beta.BetaTool.InputSchema,
  }
}

async function main() {
  const mcp = new Client({name: 'brawndo-secretary', version: '0.1.0'})
  await mcp.connect(
    new StdioClientTransport({
      command: new URL('../node_modules/.bin/workflow-mcp', import.meta.url).pathname,
      env: {
        PATH: process.env.PATH ?? '',
        SANITY_AUTH_TOKEN: env('SANITY_WORKFLOW_MCP_TOKEN'),
        DO_NOT_TRACK: '1',
      },
    }),
  )

  try {
    const {tools: mcpTools} = await mcp.listTools()
    const offered = mcpTools.filter((t) => MCP_ALLOWLIST.has(t.name))
    const missing = [...MCP_ALLOWLIST].filter((name) => !offered.some((t) => t.name === name))
    if (missing.length) throw new Error(`workflow-mcp did not offer: ${missing.join(', ')}`)
    const tools = [...LOCAL_TOOLS, ...offered.map(mcpToolToAnthropic)]

    const anthropic = new Anthropic()
    const instruction = process.argv.slice(2).join(' ') || 'The crops are dying. Do your job.'
    const messages: Anthropic.Beta.BetaMessageParam[] = [{role: 'user', content: instruction}]

    for (let turn = 0; turn < 30; turn++) {
      const response = await anthropic.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM,
        tools,
        messages,
        // Server-side refusal fallback, routed by category (skill default for claude-opus-5).
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
      })
      // Append the full content: thinking and fallback blocks must be echoed back unchanged.
      messages.push({role: 'assistant', content: response.content})

      for (const block of response.content) {
        if (block.type === 'text' && block.text.trim()) console.log(`\n🏛️  ${block.text}`)
      }

      if (response.stop_reason === 'refusal') {
        console.error('Refused:', response.stop_details?.category, response.stop_details?.explanation)
        return
      }
      if (response.stop_reason === 'max_tokens') throw new Error('hit max_tokens mid-turn')
      if (response.stop_reason === 'pause_turn') continue
      if (response.stop_reason !== 'tool_use') return

      const calls = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
      const results = await Promise.all(
        calls.map(async (call): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
          const input = call.input as Record<string, unknown>
          console.log(`  → ${call.name} ${JSON.stringify(input).slice(0, 200)}`)
          try {
            if (MCP_ALLOWLIST.has(call.name)) {
              const result = await mcp.callTool({name: call.name, arguments: input})
              const text = (result.content as Array<{type: string; text?: string}>)
                .map((c) => (c.type === 'text' ? c.text : JSON.stringify(c)))
                .join('\n')
              return {type: 'tool_result', tool_use_id: call.id, content: text, is_error: Boolean(result.isError)}
            }
            return {type: 'tool_result', tool_use_id: call.id, content: await runLocalTool(call.name, input)}
          } catch (error) {
            return {type: 'tool_result', tool_use_id: call.id, content: String(error), is_error: true}
          }
        }),
      )
      // All results for one assistant turn go back in a single user message.
      messages.push({role: 'user', content: results})
    }
    console.error('Stopped after 30 turns without finishing.')
  } finally {
    await mcp.close()
  }
}

main().catch((error) => {
  if (error instanceof Anthropic.APIError) console.error(`Anthropic API error ${error.status}:`, error.message)
  else console.error(error)
  process.exitCode = 1
})
