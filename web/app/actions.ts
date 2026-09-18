'use server'

import {randomUUID} from 'node:crypto'
import {revalidatePath} from 'next/cache'
import {cookies} from 'next/headers'
import {createClient} from 'next-sanity'
import {dataset, projectId} from '@/sanity/client'
import {summonSecretary, type SummonResult} from '@/lib/secretary'

// Votes are written server-side with SANITY_VOTE_TOKEN, which never reaches the browser.
// One vote per citizen per field is enforced by construction: the vote's _id is derived from
// both, so voting again replaces rather than adds. (Hyphens, not dots: dotted ids are
// non-public in a public dataset and would vanish from the public counts.)
const writer = () =>
  createClient({projectId, dataset, apiVersion: '2026-09-01', useCdn: false, token: process.env.SANITY_VOTE_TOKEN})

const COOKIE = 'brawndo-citizen'
const safe = (s: string) => s.replace(/[^a-zA-Z0-9-]/g, '')

export async function vote(formData: FormData): Promise<void> {
  const fieldId = safe(String(formData.get('field') ?? ''))
  const choice = String(formData.get('choice') ?? '')
  if (!fieldId || (choice !== 'water' && choice !== 'brawndo')) return

  const jar = await cookies()
  let citizenId = jar.get(COOKIE)?.value
  const client = writer()
  if (!citizenId || !/^citizen-anon-[a-f0-9]{8}$/.test(citizenId)) {
    citizenId = `citizen-anon-${randomUUID().slice(0, 8)}`
    await client.createIfNotExists({_id: citizenId, _type: 'citizen', handle: `Citizen ${citizenId.slice(-4).toUpperCase()}`})
    jar.set(COOKIE, citizenId, {httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30})
  }

  await client.createOrReplace({
    _id: `vote-${citizenId}-${fieldId}`,
    _type: 'vote',
    citizen: {_type: 'reference', _ref: citizenId},
    field: {_type: 'reference', _ref: fieldId},
    choice,
    castAt: new Date().toISOString(),
  })
  // The voter sees their vote immediately; <SanityLive> updates everyone else's open pages.
  revalidatePath('/')
}

// "Summon the Secretary": runs the agent on the server. summonSecretary() refuses while a plan is in progress
// or another summons is running, so a spammed button cannot start a second plan or a second agent run.
export async function summon(_previous: SummonResult | null): Promise<SummonResult> {
  const result = await summonSecretary()
  revalidatePath('/')
  return result
}
