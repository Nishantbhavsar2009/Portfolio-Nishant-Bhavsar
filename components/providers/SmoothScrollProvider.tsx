'use client'

/**
 * components/providers/SmoothScrollProvider.tsx
 *
 * Global smooth scroll infrastructure powered by Lenis + GSAP ticker sync.
 *
 * Architecture:
 *  ┌──────────────────────────────────────────────────────────────┐
 *  │  ReactLenis (root)                                           │
 *  │    └─ manages the Lenis instance lifecycle + raf loop        │
 *  │                                                              │
 *  │  SmoothScrollProvider (wraps ReactLenis)                     │
 *  │    └─ syncs Lenis RAF with GSAP's ticker                     │
 *  │    └─ exposes lenis instance via LenisContext                │
 *  │    └─ refreshes ScrollTrigger after Lenis is ready           │
 *  └──────────────────────────────────────────────────────────────┘
 *
 * Why sync with GSAP ticker?
 *   By default, Lenis uses its own requestAnimationFrame loop and GSAP uses
 *   its own. If both run independently, ScrollTrigger reads stale scroll
 *   positions from Lenis, causing jitter and misaligned animations.
 *   Feeding `lenis.raf(time * 1000)` into gsap.ticker ensures both systems
 *   update in the exact same frame, in the correct order.
 *
 * Why lagSmoothing(0)?
 *   GSAP normally caps the delta time when the tab is hidden/resumed to
 *   prevent large jumps. This "lag smoothing" fights against Lenis's own
 *   inertia recovery, causing stutters. Disabling it gives Lenis full control.
 */

import { ReactLenis, useLenis } from 'lenis/react'
import { useEffect, type ReactNode } from 'react'
import { gsap } from '@/lib/gsap' // imports pre-configured gsap with plugins + lagSmoothing(0)
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SmoothScrollProviderProps {
  children: ReactNode
}

// ─── Lenis → GSAP Ticker Bridge ───────────────────────────────────────────────
/**
 * Inner component rendered inside ReactLenis so it has access to the
 * Lenis instance via useLenis(). Bridges Lenis RAF into GSAP's ticker.
 */
function LenisGSAPBridge() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return

    // ─── Sync Lenis RAF to GSAP ticker ───────────────────────────────────
    // GSAP's ticker calls our callback each frame with elapsed time (seconds).
    // Lenis.raf() expects milliseconds, so we multiply by 1000.
    // This replaces Lenis's internal requestAnimationFrame loop.
    function onTick(time: number) {
      lenis!.raf(time * 1000)
    }

    // Add to GSAP ticker with high priority so it runs before animations
    gsap.ticker.add(onTick)

    // ─── Tell Lenis not to run its own RAF ───────────────────────────────
    // Since GSAP's ticker is now driving Lenis, we disable Lenis's internal
    // auto-RAF to prevent double-stepping.
    lenis.options.autoRaf = false

    // ─── ScrollTrigger: use Lenis scroll position ─────────────────────────
    // ScrollTrigger reads window.scrollY by default. When Lenis is active,
    // the actual scroll offset lives inside Lenis. We proxy it here.
    ScrollTrigger.scrollerProxy(document.documentElement, {
      scrollTop(value) {
        if (arguments.length && value !== undefined) {
          lenis.scrollTo(value, { immediate: true })
        }
        return lenis.scroll
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        }
      },
    })

    // Sync ScrollTrigger on every Lenis scroll event
    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    // Initial refresh so ScrollTrigger measures correct positions
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(onTick)
      lenis.off('scroll', onScroll)
      ScrollTrigger.scrollerProxy(document.documentElement, undefined as never)
    }
  }, [lenis])

  return null
}

// ─── Provider ─────────────────────────────────────────────────────────────────
/**
 * SmoothScrollProvider — Wrap your app in this to enable:
 *   - Lenis smooth scroll (global, root mode)
 *   - GSAP ticker sync (no jitter between Lenis + GSAP animations)
 *   - ScrollTrigger awareness of Lenis scroll position
 *
 * Usage (app/layout.tsx):
 *   <SmoothScrollProvider>
 *     {children}
 *   </SmoothScrollProvider>
 */
export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  return (
    <ReactLenis
      root
      options={{
        // ─── Feel ───────────────────────────────────────────────────────
        // lerp: how much of the distance to cover each frame (0–1).
        // 0.08 = 8% per frame — slow, weighted, premium feel.
        // Lower = more inertia. Higher = snappier.
        lerp: 0.08,

        // duration: easing curve duration in seconds.
        // Works with the easing function below.
        duration: 1.4,

        // easing: exponential deceleration — starts fast, settles smoothly.
        // This is the standard Lenis "butter" curve.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),

        // ─── Touch ──────────────────────────────────────────────────────
        // Touch devices have native momentum — use syncTouch: false to avoid
        // fighting the OS and causing nausea.
        syncTouch: false,
        touchMultiplier: 2,

        // ─── RAF ─────────────────────────────────────────────────────────
        // Disable Lenis's own RAF loop — GSAP ticker drives it instead.
        // Set here as initial value; LenisGSAPBridge confirms it on mount.
        autoRaf: false,

        // ─── Behaviour ───────────────────────────────────────────────────
        // prevent momentum: default Lenis behaviour is fine for this site
        // (no horizontal scroll, no nested scroll areas at this stage)
        orientation: 'vertical',
        gestureOrientation: 'vertical',

        // Prevent overscroll rubber-band effect on macOS trackpads
        overscroll: false,
      }}
    >
      {/* Bridge: syncs Lenis into GSAP's ticker */}
      <LenisGSAPBridge />
      {children}
    </ReactLenis>
  )
}

// ─── Re-export useLenis hook ──────────────────────────────────────────────────
/**
 * useLenis — Access the global Lenis instance from any client component.
 *
 * @example — Programmatic scroll
 * const lenis = useLenis()
 * lenis?.scrollTo('#projects', { duration: 1.4 })
 *
 * @example — Scroll progress callback
 * useLenis(({ scroll, progress }) => {
 *   setHeaderOpacity(Math.min(1, scroll / 200))
 * })
 */
export { useLenis }
