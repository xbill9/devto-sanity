import {createClient} from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const workflowTag = process.env.WORKFLOW_TAG || 'dev'

export const client = createClient({projectId, dataset, apiVersion: '2026-09-01', useCdn: true})
