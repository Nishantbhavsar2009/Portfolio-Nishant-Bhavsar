'use client'

/**
 * components/ui/FluidCursor.tsx
 *
 * Canvas-based cursor fluid trail. Simulates ink/smoke dragged through space.
 *
 * ── How it works ────────────────────────────────────────────────────────────
 *   Each mouse-move event (above a 4px threshold) spawns a "splat" — a
 *   radial gradient blob drawn on a fixed canvas overlay. Every animation
 *   frame, all live splats:
 *     1. Decay in opacity (life -= 0.018)
 *     2. Expand radially   (size += 0.5)
 *     3. Stretch slightly in the direction of mouse velocity
 *   When life reaches 0 the splat is removed.
 *
 * ── z-index contract ────────────────────────────────────────────────────────
 *   Canvas:       z-index 8500  (above FilmGrain:8000, below IntroAnim:9000)
 *   CustomCursor: z-index 99999 (always topmost)
 *   → Trail appears behind the cursor dot, in front of page content.
 *
 * ── Performance ─────────────────────────────────────────────────────────────
 *   - Zero DOM nodes beyond the canvas
 *   - RAF loop cancelled on unmount
 *   - Capped at MAX_SPLATS (60) — oldest splat evicted when full
 *   - Not mounted on touch/mobile devices (no mousemove events)
 *   - Canvas promoted to GPU layer via will-change: transform
 *
 * ── Feel to aim for ─────────────────────────────────────────────────────────
 *   Dragging a white finger through dark smoke. The trail should be subtle
 *   enough that someone can stare at the screen for a moment before noticing
 *   it. If you can clearly see "I am moving my mouse", it's too strong.
 */

import { useEffect, useRef, type JSX } from 'react'

// ─── Simulation constants ─────────────────────────────────────────────────────

/** Max simultaneous splats. Oldest is evicted when exceeded. */
const MAX_SPLATS = 35

/** Life lost per animation frame. Controls trail length in time. */
const LIFE_DECAY = 0.028

/** Radius growth per frame — splats expand as they die. */
const SIZE_GROWTH = 0.15

/** Peak alpha multiplier. Squared for smoothness: actual alpha = life² × this */
const ALPHA_PEAK = 0.055

/** Min distance from last splat before a new one is spawned. */
const MIN_DIST = 6

// ─── Types ────────────────────────────────────────────────────────────────────

interface Splat {
  x:    number   // canvas X position
  y:    number   // canvas Y position
  vx:   number   // velocity X (pixels/frame) at spawn
  vy:   number   // velocity Y (pixels/frame) at spawn
  life: number   // 1.0 → 0.0
  size: number   // current radius in pixels
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Euclidean distance between two points. */
function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FluidCursor(): JSX.Element | null {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // ── Touch/mobile guard ─────────────────────────────────────────────────
    // On pure touch devices there's no mousemove, so the component would sit
    // idle. Skip mounting entirely to save the GPU layer.
    if (typeof window === 'undefined') return
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── Canvas sizing ──────────────────────────────────────────────────────
    const resize = () => {
      // Preserve logical pixel dimensions — DPR scaling intentionally skipped
      // because the blur/gradient look benefits from soft sub-pixel edges.
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // ── Mouse state ────────────────────────────────────────────────────────
    const mouse = {
      x: 0, y: 0,
      vx: 0, vy: 0,
      lastX: 0, lastY: 0,
      // Position of the last spawned splat — used for MIN_DIST gating
      spawnX: 0, spawnY: 0,
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.vx    = e.clientX - mouse.lastX
      mouse.vy    = e.clientY - mouse.lastY
      mouse.lastX = mouse.x
      mouse.lastY = mouse.y
      mouse.x     = e.clientX
      mouse.y     = e.clientY
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    // ── Splat pool ─────────────────────────────────────────────────────────
    const splats: Splat[] = []

    const addSplat = () => {
      // Gate: only spawn when cursor has moved MIN_DIST since last splat
      if (dist(mouse.x, mouse.y, mouse.spawnX, mouse.spawnY) < MIN_DIST) return

      mouse.spawnX = mouse.x
      mouse.spawnY = mouse.y

      if (splats.length >= MAX_SPLATS) splats.shift()

      splats.push({
        x:    mouse.x,
        y:    mouse.y,
        vx:   mouse.vx,
        vy:   mouse.vy,
        life: 1.0,
        // Randomise start radius for organic variation
        size: 18 + Math.random() * 14,
      })
    }

    // ── Render loop ────────────────────────────────────────────────────────
    let rafId: number

    const render = () => {
      // Attempt to spawn a new splat this frame
      addSplat()

      // Clear the canvas completely each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw and update each live splat
      for (let i = splats.length - 1; i >= 0; i--) {
        const s = splats[i]

        // Update physics
        s.life -= LIFE_DECAY
        s.size += SIZE_GROWTH

        // Evict dead splats
        if (s.life <= 0) {
          splats.splice(i, 1)
          continue
        }

        // ── Directional stretch ──────────────────────────────────────────
        // When the cursor was moving fast at spawn-time, scale the splat
        // slightly wider in the dominant velocity axis for a streaky look.
        const speed   = Math.sqrt(s.vx * s.vx + s.vy * s.vy)
        const stretch = Math.min(1.15, 1 + speed * 0.008)
        const angle   = Math.atan2(s.vy, s.vx)

        ctx.save()

        // Translate to splat centre, rotate to velocity angle, stretch, rotate back
        ctx.translate(s.x, s.y)
        ctx.rotate(angle)
        ctx.scale(stretch, 1)
        ctx.rotate(-angle)
        ctx.translate(-s.x, -s.y)

        // ── Radial gradient ───────────────────────────────────────────────
        // Alpha is squared so the fade-out accelerates near the end —
        // produces a smoother, more cinematic dissipation.
        const alpha = s.life * s.life * ALPHA_PEAK

        const gradient = ctx.createRadialGradient(
          s.x, s.y, 0,
          s.x, s.y, s.size,
        )
        gradient.addColorStop(0,    `rgba(210,205,195,${alpha})`)
        gradient.addColorStop(0.35, `rgba(210,205,195,${alpha * 0.3})`)
        gradient.addColorStop(1,    `rgba(210,205,195,0)`)

        // 'soft-light' blend mode blends more subtly into the dark background
        ctx.globalCompositeOperation = 'soft-light'
        ctx.fillStyle = gradient
        ctx.fillRect(
          s.x - s.size,
          s.y - s.size,
          s.size * 2,
          s.size * 2,
        )

        ctx.restore()
      }

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        8500,
        pointerEvents: 'none',
        // Promote to its own GPU compositor layer so transforms + repaints
        // don't trigger layout on the page beneath.
        willChange:    'transform',
      }}
    />
  )
}
