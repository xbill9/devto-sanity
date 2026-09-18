import type {NextConfig} from 'next'

// `standalone` output is what the Cloud Run image (Dockerfile) runs.
const config: NextConfig = {output: 'standalone'}
export default config
