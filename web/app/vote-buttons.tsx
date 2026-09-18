'use client'

import {useFormStatus} from 'react-dom'
import {vote} from './actions'

type Props = {fieldId: string; fieldNumber: number; brawndo: number; water: number; mine?: 'brawndo' | 'water'}

// One vote per citizen per field: the button you picked is marked, and voting the other way switches it.
export function VoteButtons({fieldId, fieldNumber, brawndo, water, mine}: Props) {
  return (
    <form action={vote} className="votes">
      <input type="hidden" name="field" value={fieldId} />
      <Choice choice="brawndo" label="⚡ Brawndo" count={brawndo} mine={mine === 'brawndo'} fieldNumber={fieldNumber} />
      <Choice choice="water" label="💧 Water" count={water} mine={mine === 'water'} fieldNumber={fieldNumber} />
    </form>
  )
}

function Choice({choice, label, count, mine, fieldNumber}: {choice: string; label: string; count: number; mine: boolean; fieldNumber: number}) {
  const {pending, data} = useFormStatus()
  const counting = pending && data?.get('choice') === choice
  return (
    <button
      name="choice"
      value={choice}
      disabled={pending}
      aria-pressed={mine}
      className={mine ? 'mine' : undefined}
      aria-label={`Vote ${choice} for field ${fieldNumber}${mine ? ' (your vote)' : ''}`}
    >
      {counting ? 'Counting…' : <>{mine ? '✓ ' : ''}{label}</>} <b>{count}</b>
    </button>
  )
}
