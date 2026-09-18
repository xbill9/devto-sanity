'use client'

import {useActionState} from 'react'
import {summon} from './actions'

export function SummonButton() {
  const [result, action, pending] = useActionState(summon, null)
  return (
    <form action={action} className="summon">
      <button disabled={pending}>{pending ? '🏛️ The Secretary is thinking…' : '🏛️ Summon the Secretary'}</button>
      <p role="status" className={result && !result.ok ? 'refused' : undefined}>
        {pending ? 'Reading the votes. This takes about a minute.' : result?.message}
      </p>
    </form>
  )
}
