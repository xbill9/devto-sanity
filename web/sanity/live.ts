import {defineLive} from 'next-sanity/live'
import {client} from './client'

// Published content only: no drafts, no Visual Editing, so no tokens are needed here.
export const {sanityFetch, SanityLive} = defineLive({client, serverToken: false, browserToken: false})
