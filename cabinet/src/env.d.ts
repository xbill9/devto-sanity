interface ImportMetaEnv {
  readonly SANITY_APP_PROJECT_ID?: string
  readonly SANITY_APP_DATASET?: string
  readonly SANITY_APP_WORKFLOW_TAG?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
declare module '*.css'
