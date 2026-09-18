import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'placeholder',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Hosted at https://brawndo-agriculture.sanity.studio (first deployed 2026-09-18).
  studioHost: 'brawndo-agriculture',
  deployment: {appId: 'iq5geu5pv8oqs7iyrro447oo'},
})
