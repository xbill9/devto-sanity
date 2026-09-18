import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {workflowDefaultDocumentNode, workflowStudioPlugin} from '@sanity/workflow-studio-plugin'
import {buildSchema} from './schemaTypes'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'placeholder'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const workflowTag = process.env.SANITY_STUDIO_WORKFLOW_TAG || 'dev'

// Two workspaces over the same dataset: the Kiosk (picture buttons) and Stock (defaults).
export default defineConfig([
  {
    name: 'kiosk',
    title: 'Kiosk — Dept. of Agriculture',
    basePath: '/kiosk',
    projectId,
    dataset,
    // The Cabinet approves Joe's Plan from the proposal's Workflows view. Kiosk only: the stock
    // workspace stays unmodified as the trials' control.
    plugins: [
      structureTool({defaultDocumentNode: workflowDefaultDocumentNode()}),
      workflowStudioPlugin({
        tag: workflowTag,
        mappings: [{docType: 'proposal', definition: 'joes-plan', label: "Joe's Plan"}],
      }),
    ],
    schema: {types: buildSchema({kiosk: true})},
  },
  {
    name: 'stock',
    title: 'Stock Studio',
    basePath: '/stock',
    projectId,
    dataset,
    plugins: [structureTool()],
    schema: {types: buildSchema({kiosk: false})},
  },
])
