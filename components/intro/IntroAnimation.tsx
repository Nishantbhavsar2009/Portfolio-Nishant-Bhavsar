'use client'

/**
 * components/intro/IntroAnimation.tsx
 *
 * Cinematic one-shot loading screen. Plays on first load per session.
 * Replays on hard refresh. Does NOT replay on client-side navigation.
 *
 * ── Bug fixed (2026-05-26) ─────────────────────────────────────────────────
 *   The previous version gated markIntroComplete() inside onAnimationComplete
 *   on the outer motion.div. Framer Motion only fires onAnimationComplete when
 *   it actually interpolates — but animate={{ y: '0%' }} matches the element's
 *   natural resting position, so no interpolation occurs and the callback
 *   never fires. isIntroComplete stayed false → Hero stayed invisible forever.
 *
 *   Fix: use a simple setTimeout-driven phase state machine.
 *   markIntroComplete() is called unconditionally via setTimeout, not via
 *   Framer Motion callbacks. AnimatePresence handles the exit animation cleanly.
 *
 * ── Sequence timeline ──────────────────────────────────────────────────────
 *   0ms     → black overlay mounts
 *   300ms   → name fades in (delay on motion.h1)
 *   900ms   → subtitle fades in (delay on motion.p)
 *   2500ms  → setPhase('exit') → overlay slides up (0.7s animation)
 *   3200ms  → setPhase('done') → overlay unmounts, markIntroComplete() fires
 */

import { useEffect, useState, type JSX } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIntro } from '@/lib/intro-context'

/** Cinematic easing */
const EASE_CINEMA  = [0.76, 0, 0.24, 1] as [number, number, number, number]
const EASE_REVEAL  = [0.16, 1, 0.3,  1] as [number, number, number, number]

/**
 * SVG feTurbulence noise — encoded as a data URI.
 * Background-image grain texture for the intro overlay.
 */
const GRAIN_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n' color-interpolation-filters='linearRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' seed='8' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`

type Phase = 'intro' | 'exit' | 'done'

export default function IntroAnimation(): JSX.Element | null {
  const { markIntroComplete } = useIntro()
  const [phase, setPhase] = useState<Phase>('intro')

  useEffect(() => {
    // If this session already saw the intro, skip immediately
    try {
      if (sessionStorage.getItem('introPlayed') === 'true') {
        setPhase('done')
        markIntroComplete()
        return
      }
    } catch {
      // sessionStorage blocked — proceed with full intro
    }

    // Phase 1 → 'exit': start slide-off after 2.5s
    const exitTimer = setTimeout(() => {
      setPhase('exit')
    }, 2500)

    // Phase 2 → 'done': mark complete after exit animation finishes (2.5s + 0.7s)
    const doneTimer = setTimeout(() => {
      setPhase('done')
      markIntroComplete()
    }, 3200)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  // markIntroComplete is a stable useCallback — safe in deps array
  }, [markIntroComplete])

  // Unmounted — no DOM at all
  if (phase === 'done') return null

  return (
    <>
      {/* Grain shift keyframes — self-contained so component has no external CSS dep */}
      <style>{`
        @keyframes introGrain {
          0%   { transform: translate(0px,   0px);  }
          25%  { transform: translate(-2px,  1px);  }
          50%  { transform: translate(2px,  -1px);  }
          75%  { transform: translate(-1px,  2px);  }
          100% { transform: translate(1px,  -2px);  }
        }
        .intro-grain-shift {
          animation: introGrain 0.5s steps(2) infinite;
        }
      `}</style>

      <AnimatePresence>
        <motion.div
            key="intro-overlay"
            aria-hidden="true"
            role="status"
            aria-label="Loading"
            // Exit: slide the entire overlay off the top of the viewport
            initial={{ y: 0 }}
            animate={{ y: phase === 'exit' ? '-100%' : 0 }}
            transition={
              phase === 'exit'
                ? { duration: 0.7, ease: EASE_CINEMA }
                : { duration: 0 }
            }
            style={{
              position:       'fixed',
              inset:          0,
              zIndex:         9000,
              background:     'var(--bg-primary)',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              overflow:       'hidden',
              // Never intercept pointer events on the site beneath
              pointerEvents:  'none',
            }}
          >
            {/* ── Grain texture ──────────────────────────────────────── */}
            <div
              className="intro-grain-shift"
              style={{
                position:        'absolute',
                inset:           '-50%',
                width:           '200%',
                height:          '200%',
                backgroundImage: `url("${GRAIN_SVG}")`,
                backgroundRepeat:'repeat',
                backgroundSize:  '256px 256px',
                opacity:         0.038,
                pointerEvents:   'none',
              }}
            />

            {/* ── Center horizontal rule ─────────────────────────────── */}
            <motion.div
              initial={{ scaleX: 0, opacity: 1 }}
              animate={{ scaleX: 1, opacity: phase === 'exit' ? 0 : 1 }}
              transition={{
                scaleX:  { duration: 0.5, ease: [0.45, 0, 0.55, 1], delay: 0.2 },
                opacity: { duration: 0.3, ease: 'easeOut' },
              }}
              style={{
                position:        'absolute',
                top:             '50%',
                left:            0,
                right:           0,
                height:          '0.5px',
                background:      'rgba(255,255,255,0.18)',
                transformOrigin: 'left center',
              }}
            />

            {/* ── Name + Subtitle ────────────────────────────────────── */}
            <div
              style={{
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                gap:           20,
                position:      'relative',
                zIndex:        1,
              }}
            >
              {/* Name */}
              <motion.h1
                style={{
                  fontFamily:    'var(--font-display, sans-serif)',
                  fontSize:      'clamp(28px, 5vw, 64px)',
                  color:         '#F5F5F5',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  fontWeight:    400,
                  margin:        0,
                  paddingRight:  '0.3em', // balance trailing letter-spacing
                  userSelect:    'none',
                  lineHeight:    1,
                }}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={
                  phase === 'exit'
                    ? { opacity: 0, y: -12, filter: 'blur(2px)' }
                    : { opacity: 1, y: 0,   filter: 'blur(0px)' }
                }
                transition={
                  phase === 'exit'
                    ? { duration: 0.35, ease: 'easeIn' }
                    : { duration: 0.8,  ease: EASE_REVEAL, delay: 0.3 }
                }
              >
                Nishant Bhavsar
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                style={{
                  fontFamily:    'var(--font-body, sans-serif)',
                  fontSize:      13,
                  color:         '#555',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  fontWeight:    400,
                  margin:        0,
                  paddingRight:  '0.22em',
                  userSelect:    'none',
                  lineHeight:    1,
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={
                  phase === 'exit'
                    ? { opacity: 0, y: -8 }
                    : { opacity: 0.7, y: 0 }
                }
                transition={
                  phase === 'exit'
                    ? { duration: 0.35, ease: 'easeIn', delay: 0 }
                    : { duration: 0.8,  ease: EASE_REVEAL, delay: 0.9 }
                }
              >
                Developer &amp; AI Enthusiast
              </motion.p>
            </div>
          </motion.div>
      </AnimatePresence>
    </>
  )
}
