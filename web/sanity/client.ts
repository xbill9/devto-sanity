import {createClient} from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const workflowTag = process.env.WORKFLOW_TAG || 'dev'

export const client = createClient({projectId, dataset, apiVersion: '2026-09-01', useCdn: true})

// Workflow instances have dotted ids ("dev.wf-instance.…"), which a public dataset never serves anonymously.
// The docket is read server-side with the vote token (read access); it never reaches the browser.
export const serverReader = createClient({
  projectId, dataset, apiVersion: '2026-09-01', useCdn: false, perspective: 'published', token: process.env.SANITY_VOTE_TOKEN,
})
