import type {Metadata} from 'next'
import {SanityLive} from '@/sanity/live'
import './globals.css'

export const metadata: Metadata = {
  title: 'Brawndo.gov — Department of Agriculture',
  description: "It's got what plants crave. A parody for the DEV Sanity Challenge.",
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
      </body>
    </html>
  )
}
