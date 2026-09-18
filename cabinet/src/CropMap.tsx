import {type DocumentHandle, useDocumentProjection, useDocuments} from '@sanity/sdk-react'
import {Suspense} from 'react'

const GROWTH: Record<string, string> = {dust: '🏜️', sprout: '🌱', crop: '🌽'}

type FieldProjection = {number: number; name: string; irrigation: string; growth?: string; water: number; brawndo: number}

// Vote tallies are count()s in the projection — computed by the Content Lake, live.
const PROJECTION = `{
  number, name, irrigation, growth,
  "water": count(*[_type == "vote" && field._ref == ^._id && choice == "water"]),
  "brawndo": count(*[_type == "vote" && field._ref == ^._id && choice == "brawndo"])
}`

function FieldTile(handle: DocumentHandle) {
  const {data} = useDocumentProjection<FieldProjection>({...handle, projection: PROJECTION})
  if (!data) return null
  return (
    <li className={`tile ${data.irrigation}`}>
      <span className="big" aria-hidden>{GROWTH[data.growth ?? 'dust']}</span>
      <b>#{data.number} {data.name}</b>
      <span>{data.irrigation === 'water' ? '💧 water' : '⚡ Brawndo'}</span>
      <span className="split">⚡ {data.brawndo} · 💧 {data.water}</span>
    </li>
  )
}

export function CropMap() {
  const {data: fields} = useDocuments({documentType: 'field', orderings: [{field: 'number', direction: 'asc'}], batchSize: 50})
  return (
    <section>
      <h2>Fields</h2>
      <ul className="tiles">
        {fields.map((handle) => (
          <Suspense key={handle.documentId} fallback={<li className="tile">…</li>}>
            <FieldTile {...handle} />
          </Suspense>
        ))}
      </ul>
    </section>
  )
}
