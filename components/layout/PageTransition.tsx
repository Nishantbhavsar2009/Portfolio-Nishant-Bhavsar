'use client'

/**
 * components/layout/PageTransition.tsx
 *
 * Black curtain that wipes in on mount, holds briefly, then wipes out.
 *
 * ── Bug fixed (2026-05-26) ──────────────────────────────────────────────────
 *   The previous version used animate={{ y:'0%' }} with AnimatePresence
 *   keyed on pathname. On a single-page site the pathname never changes,
 *   so AnimatePresence never ran the exit animation — the curtain sat at
 *   y:0 (covering the whole screen) at z:9800 forever → black screen.
 *
 *   Fix: replace with a simple mount-driven sequence using useState + setTimeout.
 *   On mount:  curtain enters from below (y: '100%' → '0%')
 *   After 200ms hold: curtain exits upward (y: '0%' → '-100%')
 *   After exit completes: component returns null (fully unmounted)
 *
 *   This also fires correctly on any future route transitions if you add pages.
 *
 * ── z-index ─────────────────────────────────────────────────────────────────
 *   z: 9800 — above FilmGrain (8000) and IntroAnimation (9000), below cursor (99999)
 *   Note: we set z to 8500 so IntroAnimation (9000) renders on top of this.
 */

import { useEffect, useState, type JSX } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const EASE_CURTAIN = [0.76, 0, 0.24, 1] as [number, number, number, number]

type Phase = 'enter' | 'exit' | 'done'

export default function PageTransition(): JSX.Element | null {
  const shouldReduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('enter')

  useEffect(() => {
    if (shouldReduceMotion) {
      // Skip animation entirely for users who prefer reduced motion
      setPhase('done')
      return
    }

    // After curtain enters (0.5s) + hold (200ms), begin exit
    const exitTimer = setTimeout(() => setPhase('exit'), 700)

    // After exit animation completes (0.5s), unmount
    const doneTimer = setTimeout(() => setPhase('done'), 1200)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [shouldReduceMotion])

  if (phase === 'done') return null

  return (
    <AnimatePresence>
      <motion.div
        key="page-transition-curtain"
        aria-hidden="true"
        // Enter from below, hold, exit upward
        initial={{ y: '100%' }}
        animate={{ y: phase === 'exit' ? '-100%' : '0%' }}
        transition={
          phase === 'exit'
            ? { duration: 0.5, ease: EASE_CURTAIN }
            : { duration: 0.5, ease: EASE_CURTAIN }
        }
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        8500,
          background:    'var(--bg-primary)',
          pointerEvents: 'none',
        }}
      />
    </AnimatePresence>
  )
}
