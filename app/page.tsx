/**
 * app/page.tsx — Root page
 *
 * Sections assembled in order:
 *   1. Hero     — fullscreen typographic landing   (static — above fold)
 *   2. About    — minimal bio, line-by-line reveal  (dynamic — below fold)
 *   3. Projects — design exhibition layout          (dynamic — below fold)
 *   4. Contact  — minimal close with email CTA      (dynamic — below fold)
 *
 * Below-fold sections use next/dynamic for code-splitting.
 * Hero is kept static for LCP (Largest Contentful Paint) performance.
 *
 * Persistent UI lives in app/layout.tsx:
 *   IntroAnimation, CustomCursor, LeftNav, CommandMenu, FilmGrain, PageTransition
 */

import dynamic from 'next/dynamic'
import Hero from '@/components/sections/Hero'

// ── Dynamic imports for below-fold sections ───────────────────────────────────
// Code-split into separate chunks — browser loads them only as the user scrolls.
// Note: ssr: false skips server rendering for these sections. For a portfolio
// without auth concerns, the JS-bootstrap tradeoff is acceptable for the
// performance gain on initial page load.

const About    = dynamic(() => import('@/components/sections/About'),    { ssr: false })
const Projects = dynamic(() => import('@/components/sections/Projects'), { ssr: false })
const Contact  = dynamic(() => import('@/components/sections/Contact'),  { ssr: false })

export default function HomePage() {
  return (
    <main
      id="main-content"
      aria-label="Nishant Bhavsar's portfolio"
    >
      <Hero />
      <About />
      <Projects />
      <Contact />
    </main>
  )
}
