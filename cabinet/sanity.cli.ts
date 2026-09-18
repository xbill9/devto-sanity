import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    organizationId: process.env.SANITY_APP_ORGANIZATION_ID || 'placeholder',
    entry: './src/App.tsx',
    title: 'Cabinet Room',
  },
})
