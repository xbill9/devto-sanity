import {type SanityConfig} from '@sanity/sdk'
import {SanityApp} from '@sanity/sdk-react'
import {Suspense} from 'react'
import {CropMap} from './CropMap'
import {Docket} from './Docket'
import {DATASET, PROJECT_ID} from './config'
import './App.css'

// The Cabinet Room: the Cabinet's live war room inside the Sanity Dashboard.
// Signed-in Sanity users only (Dashboard auth); the public sees brawndo.gov instead.
export default function App() {
  const config: SanityConfig[] = [{projectId: PROJECT_ID, dataset: DATASET}]
  return (
    <SanityApp config={config} fallback={<p className="status">Loading the Cabinet…</p>}>
      <main className="room">
        <header>
          <h1>🏛️ The Cabinet Room</h1>
          <p>Approvals here are advisory. The Content Lake decides who may water.</p>
        </header>
        <Suspense fallback={<p className="status">Loading the docket…</p>}>
          <Docket />
        </Suspense>
        <Suspense fallback={<p className="status">Loading fields…</p>}>
          <CropMap />
        </Suspense>
      </main>
    </SanityApp>
  )
}
