import {defineWorkflowConfig} from '@sanity/workflow-engine/define'

import {joesPlan} from './definitions/joes-plan'

const projectId = process.env.SANITY_PROJECT_ID ?? 'PROJECT_ID'
const dataset = process.env.SANITY_DATASET ?? 'production'

export default defineWorkflowConfig({
  deployments: [
    {
      name: 'dev',
      tag: 'dev',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: `${projectId}.${dataset}`},
      definitions: [joesPlan],
    },
  ],
})
