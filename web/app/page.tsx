import {sanityFetch} from '@/sanity/live'
import {serverReader, workflowTag} from '@/sanity/client'
import {DOCKET_QUERY, FIELDS_QUERY, TOTALS_QUERY} from '@/sanity/queries'
import {vote} from './actions'
import {CROP, GROWTH, IRRIGATION, STAGE} from './pictures'

// Render per request: a prerendered page is frozen at build time, and every cold-started Cloud Run instance
// would serve that copy. <SanityLive> then keeps an open page current.
export const dynamic = 'force-dynamic'

type Field = {_id: string; number: number; name: string; crop: string; irrigation: string; growth?: string; water: number; brawndo: number}
type Plan = {_id: string; currentStage: string; startedAt: string; harvestAt: string | null; proposal: {title: string; author: string; fields: number[]} | null}
type Totals = {votes: number; citizens: number; watered: number; fields: number}

export default async function Home() {
  const [{data: fields}, {data: docket}, {data: totals}] = await Promise.all([
    sanityFetch({query: FIELDS_QUERY}) as Promise<{data: Field[]}>,
    serverReader.fetch<Plan[]>(DOCKET_QUERY, {workflowTag}).then((data) => ({data})),
    sanityFetch({query: TOTALS_QUERY}) as Promise<{data: Totals}>,
  ])

  return (
    <main>
      <header>
        <h1>⚡ BRAWNDO.GOV ⚡</h1>
        <p className="tag">Department of Agriculture · It&apos;s got what plants crave</p>
        <p className="totals">
          {totals.watered} of {totals.fields} fields on water · {totals.votes} votes from {totals.citizens} citizens
        </p>
      </header>

      <section className="howto" aria-label="How it works">
        <h2>How it works</h2>
        <ol>
          <li>Every field is irrigated with ⚡ Brawndo. Nothing grows.</li>
          <li>
            <b>Vote</b> on each field: keep ⚡ Brawndo or switch to 💧 water. Voting again changes your vote.
          </li>
          <li>
            The Secretary of the Interior (an AI agent) proposes watering fields. The Cabinet (a person) approves or rejects.
          </li>
          <li>Approved fields get water, sprout 🌱, and are harvested 🌽. Follow it in the Docket below.</li>
        </ol>
      </section>

      <section className="grid" aria-label="Fields">
        {fields.map((f) => (
          <article key={f._id} className={`field ${f.irrigation}`}>
            <div className="picture" aria-hidden>{GROWTH[f.growth ?? 'dust']}</div>
            <h2>
              #{f.number} {f.name} <span aria-hidden>{CROP[f.crop]}</span>
            </h2>
            <p className="irrigation">
              Now: {IRRIGATION[f.irrigation]} {f.irrigation === 'brawndo' ? 'Brawndo' : 'Water'}
            </p>
            <form action={vote} className="votes">
              <input type="hidden" name="field" value={f._id} />
              <button name="choice" value="brawndo" aria-label={`Vote Brawndo for field ${f.number}`}>
                ⚡ Brawndo <b>{f.brawndo}</b>
              </button>
              <button name="choice" value="water" aria-label={`Vote water for field ${f.number}`}>
                💧 Water <b>{f.water}</b>
              </button>
            </form>
          </article>
        ))}
      </section>

      <section className="docket" aria-label="Docket">
        <h2>🏛️ The Docket</h2>
        {docket.length === 0 ? (
          <p>No plans before the Cabinet. The Secretary of the Interior is thinking. Slowly.</p>
        ) : (
          <ol>
            {docket.map((p) => (
              <li key={p._id}>
                <b>{STAGE[p.currentStage] ?? p.currentStage}</b> — {p.proposal?.title ?? '(missing proposal)'}
                {p.proposal?.fields?.length ? <> · fields {p.proposal.fields.join(', ')}</> : null}
                {p.currentStage === 'growing' && p.harvestAt ? <> · harvest {new Date(p.harvestAt).toLocaleTimeString()}</> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer>
        A parody built for the <a href="https://dev.to/challenges/sanity-2026-09-16">DEV Sanity Challenge</a>. Not affiliated with
        any beverage. Tallies are GROQ <code>count()</code>s computed by the Content Lake.
      </footer>
    </main>
  )
}
