import {ActionDisabledError, type Actor} from '@sanity/workflow-engine'
import {createBench, subjectField} from '@sanity/workflow-engine-test'
import {expect, test} from 'vitest'

import {CABINET_ROLE, joesPlan, SECRETARY_ROLE} from './joes-plan'

const T0 = '2026-09-18T09:00:00.000Z'
const HOUR_MS = 60 * 60 * 1000
const HARVEST_AT = '2026-09-18T10:00:00.000Z' // one hour after T0

const secretary: Actor = {kind: 'agent', id: 'secretary-of-interior', roles: [SECRETARY_ROLE]}
const cabinet: Actor = {kind: 'person', id: 'cabinet-member', roles: [CABINET_ROLE]}
const drainer: Actor = {kind: 'system', id: 'brawndo-drainer'}

async function startPlan() {
  const proposal = {_id: 'proposal-1', _type: 'proposal', title: 'Water the crops', author: 'agent', fields: []}
  const bench = createBench({now: T0, documents: [proposal]})
  await bench.deployDefinitions({expectedMinReaderModel: 10, definitions: [joesPlan]})
  const {instance} = await bench.startInstance({
    definition: 'joes-plan',
    initialFields: [subjectField('proposal-1', {type: 'proposal'})],
  })
  return {bench, id: instance._id, stage: instance.currentStage}
}

async function toCabinet() {
  const plan = await startPlan()
  await plan.bench.fireAction({instanceId: plan.id, activity: 'draft', action: 'submit', actor: secretary})
  return plan
}

test('a new plan starts as a petition', async () => {
  const {stage} = await startPlan()
  expect(stage).toBe('petition')
})

test('submitting sends the petition to the Cabinet', async () => {
  const {bench, id} = await toCabinet()
  expect(await bench.currentStage(id)).toBe('cabinet')
})

test('the Secretary cannot approve their own plan (engine verdict — advisory)', async () => {
  const {bench, id} = await toCabinet()
  await expect(
    bench.fireAction({instanceId: id, activity: 'decide', action: 'approve', actor: secretary}),
  ).rejects.toBeInstanceOf(ActionDisabledError)
  expect(await bench.currentStage(id)).toBe('cabinet')
})

test('a rejected plan ends in the dust bowl', async () => {
  const {bench, id} = await toCabinet()
  await bench.fireAction({instanceId: id, activity: 'decide', action: 'reject', actor: cabinet})
  expect(await bench.currentStage(id)).toBe('dust-bowl')
})

test('an approved plan queues watering', async () => {
  const {bench, id} = await toCabinet()
  await bench.fireAction({instanceId: id, activity: 'decide', action: 'approve', actor: cabinet})
  expect(await bench.currentStage(id)).toBe('watering')
  const pending = await bench.listPendingEffects({instanceId: id})
  expect(pending.map((effect) => effect.name)).toEqual(['water-fields'])
})

test('failed watering ends in the dust bowl', async () => {
  const {bench, id} = await toCabinet()
  await bench.fireAction({instanceId: id, activity: 'decide', action: 'approve', actor: cabinet})
  await bench.completePendingEffect({instanceId: id, effect: 'water-fields', status: 'failed', actor: drainer})
  expect(await bench.currentStage(id)).toBe('dust-bowl')
})

test('watered fields grow, and are harvested only once harvestAt passes', async () => {
  const {bench, id} = await toCabinet()
  await bench.fireAction({instanceId: id, activity: 'decide', action: 'approve', actor: cabinet})
  await bench.completePendingEffect({
    instanceId: id,
    effect: 'water-fields',
    status: 'done',
    ops: [{type: 'field.set', target: {scope: 'workflow', field: 'harvestAt'}, value: {type: 'literal', value: HARVEST_AT}}],
    actor: drainer,
  })
  expect(await bench.currentStage(id)).toBe('growing')

  // Before harvestAt: tick changes nothing.
  expect(await bench.tick({instanceId: id})).toMatchObject({changed: false})
  expect(await bench.listPendingEffects({instanceId: id})).toEqual([])

  // After harvestAt: tick queues the harvest; completing it reaches harvest.
  bench.advance(2 * HOUR_MS)
  await bench.tick({instanceId: id})
  const pending = await bench.listPendingEffects({instanceId: id})
  expect(pending.map((effect) => effect.name)).toEqual(['harvest-fields'])

  await bench.completePendingEffect({instanceId: id, effect: 'harvest-fields', status: 'done', actor: drainer})
  expect(await bench.currentStage(id)).toBe('harvest')
})

test('one plan per proposal', async () => {
  const {bench} = await startPlan()
  await expect(
    bench.startInstance({definition: 'joes-plan', initialFields: [subjectField('proposal-1', {type: 'proposal'})]}),
  ).rejects.toThrow()
})
