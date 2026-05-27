/**
 * lib/gsap.ts
 *
 * Centralised GSAP configuration for the entire portfolio.
 *
 * ─── USAGE PATTERN ────────────────────────────────────────────────────────────
 *
 * Always use @gsap/react's useGSAP hook instead of bare useEffect for GSAP
 * animations. It handles cleanup automatically — reverting all tweens and
 * killing ScrollTrigger instances created inside the scope when the component
 * unmounts or dependencies change.
 *
 * CORRECT — automatic cleanup, context-scoped:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ import { useGSAP } from '@gsap/react'                       │
 * │ import { gsap } from '@/lib/gsap'                           │
 * │                                                             │
 * │ function MyComponent() {                                    │
 * │   const container = useRef<HTMLDivElement>(null)            │
 * │                                                             │
 * │   useGSAP(() => {                                           │
 * │     gsap.from('.target', { opacity: 0, y: 40, duration: 1})│
 * │   }, { scope: container })   ← scopes selectors to ref     │
 * │                                                             │
 * │   return <div ref={container}><span className="target" />   │
 * │ }                                                           │
 * └─────────────────────────────────────────────────────────────┘
 *
 * WRONG — manual cleanup required, easy to leak:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ useEffect(() => {                                           │
 * │   const tween = gsap.to('.target', { x: 100 })             │
 * │   return () => tween.kill()   ← easy to forget             │
 * │ }, [])                                                      │
 * └─────────────────────────────────────────────────────────────┘
 *
 * SCROLLTRIGGER PATTERN — always inside useGSAP scope:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ useGSAP(() => {                                             │
 * │   gsap.from('.item', {                                      │
 * │     opacity: 0, y: 40,                                      │
 * │     scrollTrigger: {                                        │
 * │       trigger: '.item',                                     │
 * │       start: 'top 85%',                                     │
 * │       toggleActions: 'play none none none',                 │
 * │     }                                                       │
 * │   })                                                        │
 * │ }, { scope: container })                                    │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

// ─── Plugin Registration ──────────────────────────────────────────────────────
// Register once at module level — safe to call multiple times (GSAP dedupes).
// Must happen before any ScrollTrigger or ScrollTo usage.
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

// ─── Global Defaults ─────────────────────────────────────────────────────────
// Prevent GSAP from adding lag compensation that fights Lenis inertia.
// This must be set BEFORE Lenis is initialized (handled in SmoothScrollProvider).
gsap.ticker.lagSmoothing(0)

// ─── ScrollTrigger Defaults ───────────────────────────────────────────────────
ScrollTrigger.defaults({
  toggleActions: 'play none none none',
  start: 'top 85%',
})

// ─── Exports ──────────────────────────────────────────────────────────────────
export { gsap, ScrollTrigger, ScrollToPlugin }

// ─── createReveal ─────────────────────────────────────────────────────────────
/**
 * Creates a GSAP timeline that stagger-reveals a set of elements as they
 * enter the viewport. Designed to be called inside a useGSAP scope so that
 * cleanup (revert) happens automatically on unmount.
 *
 * @param selector  - CSS selector string, scoped to the useGSAP container ref
 * @param options   - Optional overrides for timing, trigger, and stagger
 * @returns GSAP Timeline instance
 *
 * @example
 * useGSAP(() => {
 *   createReveal('.section-line', { start: 'top 80%' })
 * }, { scope: sectionRef })
 */
export function createReveal(
  selector: string,
  options?: {
    start?: string
    stagger?: number
    duration?: number
    ease?: string
    delay?: number
    y?: number
  },
) {
  const {
    start      = 'top 85%',
    stagger    = 0.12,
    duration   = 0.9,
    ease       = 'power3.out',
    delay      = 0,
    y          = 40,
  } = options ?? {}

  // Set invisible initial state immediately (no flash of unstyled content)
  gsap.set(selector, { opacity: 0, y, willChange: 'transform, opacity' })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: selector,
      start,
      toggleActions: 'play none none none',
      // once: true — equivalent to toggleActions above; element stays revealed
    },
    delay,
  })

  tl.to(selector, {
    opacity: 1,
    y: 0,
    duration,
    stagger,
    ease,
    clearProps: 'willChange', // Release compositor layer after animation
  })

  return tl
}

/**
 * createParallax — Binds a scrub-based vertical parallax to an element.
 * Use inside a useGSAP scope.
 *
 * @param selector  - CSS selector for the element to parallax
 * @param speed     - Parallax strength: 0 = none, 1 = full scroll speed, 0.3 = subtle
 * @param scrub     - GSAP scrub value (true or number for smoothing)
 */
export function createParallax(
  selector: string,
  speed = 0.3,
  scrub: boolean | number = 1.2,
) {
  return gsap.to(selector, {
    yPercent: speed * -100,
    ease: 'none',
    scrollTrigger: {
      trigger: selector,
      start: 'top bottom',
      end: 'bottom top',
      scrub,
    },
  })
}
