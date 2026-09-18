// Writes seed.ndjson for `sanity dataset import seed.ndjson production`.
// Deterministic ids so a re-import replaces rather than duplicates.
import {writeFileSync} from 'node:fs'

const crops = ['corn', 'wheat', 'potatoes', 'tomatoes']
const names = [
  'North Forty', 'Upper Dust', 'The Crater', 'Costco Annex', 'Stadium Lot', 'Old Carl’s Jr',
  'Brawndo Plaza', 'Lower Dust', 'Ow My Acres', 'Hospital Field', 'Rehabilitation Row', 'Joe’s Patch',
]
const handles = ['NotSure', 'FrankieAtCostco', 'UpgrayeddFan', 'Beef_Supreme', 'Rita_Plus', 'TheCabinet']

const docs = [
  ...names.map((name, i) => ({
    _id: `field-${String(i + 1).padStart(2, '0')}`,
    _type: 'field',
    number: i + 1,
    name,
    crop: crops[i % crops.length],
    irrigation: 'brawndo',
    growth: 'dust',
  })),
  ...handles.map((handle) => ({_id: `citizen-${handle.toLowerCase()}`, _type: 'citizen', handle})),
]

writeFileSync(new URL('./seed.ndjson', import.meta.url), docs.map((d) => JSON.stringify(d)).join('\n') + '\n')
console.log(`wrote ${docs.length} documents`)
