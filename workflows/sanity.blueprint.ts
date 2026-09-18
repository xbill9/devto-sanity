// Joe's Plan runtime as Sanity Functions: nothing to leave running on anyone's machine.
//   brawndo-drain  document Function: runs water-fields / harvest-fields as soon as they are queued
//   brawndo-tick   scheduled Function: hourly (the Growth plan's limit) recovery sweep for stuck work.
//                  The minute-by-minute harvest tick is brawndo.gov's /api/tick, called by Cloud Scheduler.
// Deploy: npm run functions:deploy (from workflows/, after `source ../env.sh`).
import {defineBlueprint, defineDocumentFunction, defineRobotToken, defineScheduledFunction} from '@sanity/blueprints'

// Not read from SANITY_PROJECT_ID: the blueprints CLI treats that variable as the Stack's scope, and this
// Stack is organization-scoped (Scheduled Functions require it), so the deploy script unsets it.
const projectId = 'ukyhb6bu'
const dataset = process.env.SANITY_DATASET ?? 'production'
const tag = process.env.WORKFLOW_TAG ?? 'dev'
const growMinutes = process.env.BRAWNDO_GROW_MINUTES ?? '5'
const robotToken = '$.resources.brawndo-runtime-token.token'

export default defineBlueprint({
  resources: [
    // Writes `field` (watering, harvest) and workflow instances. Created and held by Sanity, not by .env.
    defineRobotToken({
      name: 'brawndo-runtime-token',
      label: 'Brawndo runtime (Functions)',
      memberships: [{resourceType: 'project', resourceId: projectId, roleNames: ['editor']}],
    }),
    defineDocumentFunction({
      name: 'brawndo-drain',
      src: './functions/brawndo-drain',
      project: projectId,
      robotToken,
      timeout: 60,
      env: {WORKFLOW_TAG: tag, BRAWNDO_GROW_MINUTES: growMinutes},
      event: {
        on: ['create', 'update'],
        // Only when unclaimed work increases, so the drainer's own claim/complete writes do not re-wake it.
        filter:
          `_type == "sanity.workflow.instance" && tag == "${tag}" && ` +
          'count(after().pendingEffects[!defined(claim)]) > coalesce(count(before().pendingEffects[!defined(claim)]), 0)',
        projection: '{_id}',
        resource: {type: 'dataset', id: `${projectId}.${dataset}`},
      },
    }),
    defineScheduledFunction({
      name: 'brawndo-tick',
      src: './functions/brawndo-tick',
      robotToken,
      timeout: 60,
      event: {expression: '0 * * * *'},
      env: {SANITY_PROJECT_ID: projectId, SANITY_DATASET: dataset, WORKFLOW_TAG: tag, BRAWNDO_GROW_MINUTES: growMinutes},
    }),
  ],
})
