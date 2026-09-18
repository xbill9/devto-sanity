import {createClient, type SanityClient} from '@sanity/client'
import {ENGINE_API_VERSION, extractDocumentId, type EffectHandler} from '@sanity/workflow-engine'

// Effect handlers for joes-plan. They run under SANITY_DRAINER_TOKEN — the only token
// allowed to write `field` documents. The agent's token cannot, which is what makes the
// Cabinet's approval an actual gate rather than an advisory one.

/** Minutes from watering to harvest. Short so a demo finishes while you watch. */
export const GROW_MINUTES = Number(process.env.BRAWNDO_GROW_MINUTES ?? 5)

let client: SanityClient | undefined
/** Sanity Functions hand the handlers the client built from the Blueprint's robot token. */
export function useContentClient(c: SanityClient): void {
  client = c
}
export function contentClient(): SanityClient {
  if (!client) {
    const {SANITY_PROJECT_ID: projectId, SANITY_DATASET: dataset = 'production', SANITY_DRAINER_TOKEN: token} = process.env
    if (!projectId || !token) throw new Error('SANITY_PROJECT_ID and SANITY_DRAINER_TOKEN must be set')
    client = createClient({projectId, dataset, token, apiVersion: ENGINE_API_VERSION, useCdn: false})
  }
  return client
}

function subjectId(params: Record<string, unknown>): string {
  if (typeof params.subject !== 'string') throw new Error('subject must be a GDR URI')
  return extractDocumentId(params.subject)
}

async function proposalFieldIds(proposalId: string): Promise<string[]> {
  const ids = await contentClient().fetch<string[] | null>(`*[_id == $id][0].fields[]._ref`, {id: proposalId})
  if (!ids?.length) throw new Error(`proposal ${proposalId} names no fields`)
  return ids
}

/** Patch sets are idempotent, so a redelivered effect (same ctx.effectKey) rewrites the same values. */
async function patchFields(ids: string[], values: Record<string, unknown>): Promise<void> {
  const tx = contentClient().transaction()
  for (const id of ids) tx.patch(id, (p) => p.set(values))
  await tx.commit({visibility: 'sync'})
}

export const waterFields: EffectHandler = async (params, ctx) => {
  const ids = await proposalFieldIds(subjectId(params))
  const now = new Date()
  await patchFields(ids, {irrigation: 'water', growth: 'sprout', lastWatered: now.toISOString()})
  const harvestAt = new Date(now.getTime() + GROW_MINUTES * 60_000).toISOString()
  ctx.log(`watered ${ids.length} field(s); harvest at ${harvestAt}`)
  // `outputs` only lands in $effects['water-fields']; the `harvestAt` workflow field the growing stage
  // and the scoreboard read is written by `ops` in the completion commit (scope must be explicit).
  return {
    outputs: {harvestAt},
    ops: [{type: 'field.set', target: {scope: 'workflow', field: 'harvestAt'}, value: {type: 'literal', value: harvestAt}}],
  }
}

export const harvestFields: EffectHandler = async (params, ctx) => {
  const ids = await proposalFieldIds(subjectId(params))
  await patchFields(ids, {growth: 'crop'})
  ctx.log(`harvested ${ids.length} field(s)`)
}

export const effectHandlers: Record<string, EffectHandler> = {
  'water-fields': waterFields,
  'harvest-fields': harvestFields,
}
