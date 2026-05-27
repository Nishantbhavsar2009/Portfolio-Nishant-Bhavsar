'use client'

/**
 * lib/intro-context.tsx
 *
 * Global intro state shared between:
 *   - IntroAnimation (sets isIntroComplete when the overlay exits)
 *   - Any component that needs to delay its entrance until after intro
 *     (Hero, About, LeftNav, etc.)
 *
 * ── Usage ──────────────────────────────────────────────────────────────────
 *
 * Reading completion state:
 *   const { isIntroComplete } = useIntro()
 *   // → false during intro, true afterward (forever in this session)
 *
 * Delaying an animation until after intro:
 *   const { isIntroComplete } = useIntro()
 *   <motion.div animate={isIntroComplete ? 'visible' : 'hidden'} />
 *
 * Listening for the custom event (outside React):
 *   window.addEventListener('introComplete', () => { ... })
 *
 * ─────────────────────────────────────────────────────────────────────────
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntroContextValue {
  /** True once the intro overlay has fully exited */
  isIntroComplete: boolean
  /**
   * Call this when the intro animation finishes.
   * Handles: setting state, sessionStorage flag, custom event dispatch.
   */
  markIntroComplete: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const IntroContext = createContext<IntroContextValue>({
  isIntroComplete: false,
  markIntroComplete: () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function IntroProvider({ children }: { children: ReactNode }) {
  const [isIntroComplete, setIsIntroComplete] = useState(false)

  const markIntroComplete = useCallback(() => {
    setIsIntroComplete(true)

    // Persist so client-side navigation doesn't replay the intro
    try {
      sessionStorage.setItem('introPlayed', 'true')
    } catch {
      // sessionStorage may be blocked in some privacy modes
    }

    // Broadcast so non-React systems (GSAP, external scripts) can react
    window.dispatchEvent(new CustomEvent('introComplete'))
  }, [])

  return (
    <IntroContext.Provider value={{ isIntroComplete, markIntroComplete }}>
      {children}
    </IntroContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIntro(): IntroContextValue {
  return useContext(IntroContext)
}
