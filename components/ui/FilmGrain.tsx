'use client'

/**
 * components/ui/FilmGrain.tsx
 *
 * Persistent film grain + vignette overlay. Sits above all content, below
 * the cursor (z-index 8000 vs cursor's 99999).
 *
 * ── Why two layers? ────────────────────────────────────────────────────────
 *   1. Grain div  — SVG feTurbulence noise tiled at 256px, shifted each step
 *                   to simulate the frame-to-frame randomness of real film.
 *   2. Vignette div — radial-gradient that darkens edges, creates a cinema
 *                     frame effect and draws focus to the centre of the screen.
 *
 * ── Performance contract ───────────────────────────────────────────────────
 *   - Zero JavaScript at runtime. Pure CSS animation.
 *   - No canvas, no RAF loop, no requestAnimationFrame.
 *   - The animating div is promoted to its own compositor layer via
 *     `will-change: transform`, so shifting never triggers layout or paint.
 *   - 0% CPU impact on idle (GPU handles the transform-only animation).
 *
 * ── Opacity is critical ────────────────────────────────────────────────────
 *   0.042 is intentionally below the threshold of conscious perception.
 *   The grain should pass a "what changed?" test — only noticeable when
 *   compared directly to a version without it. Do not increase this value.
 *
 * ── Reduced motion ─────────────────────────────────────────────────────────
 *   The animation stops but the static noise layer remains. Users with
 *   vestibular disorders still get the texture benefit without the movement.
 */

import type { JSX } from 'react'

// ─── SVG feTurbulence noise ────────────────────────────────────────────────────
//
// Parameters chosen carefully:
//   baseFrequency: 0.9 — high frequency = fine grain (not blotchy)
//   numOctaves: 4      — layered detail, closer to real film grain texture
//   stitchTiles: stitch — seamless tiling at the 256px boundary
//   feColorMatrix saturate 0 — forces monochrome so we get pure luminance noise
//
const SVG_NOISE = `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(%23grain)" opacity="1"/></svg>`

const GRAIN_DATA_URL = `data:image/svg+xml,${SVG_NOISE}`

// ─── Grain shift keyframes ─────────────────────────────────────────────────────
//
// steps(1) produces discrete jumps — no lerping between positions.
// This replicates the frame-by-frame randomness of physical film grain
// where each frame has an entirely different grain pattern.
//
// The translate values stay within ±3% so the tile seams never become visible
// at any of the shift positions.
//
const KEYFRAMES = `
@keyframes filmGrainShift {
  0%   { transform: translate(0%,   0%);  }
  10%  { transform: translate(-2%,  -3%); }
  20%  { transform: translate(3%,   1%);  }
  30%  { transform: translate(-1%,  3%);  }
  40%  { transform: translate(2%,   -2%); }
  50%  { transform: translate(-3%,  1%);  }
  60%  { transform: translate(1%,   2%);  }
  70%  { transform: translate(-2%,  -1%); }
  80%  { transform: translate(3%,   -3%); }
  90%  { transform: translate(-1%,  2%);  }
  100% { transform: translate(0%,   0%);  }
}

@media (prefers-reduced-motion: reduce) {
  .film-grain-layer {
    animation: none !important;
  }
}
`

// ─── Component ────────────────────────────────────────────────────────────────

export default function FilmGrain(): JSX.Element {
  return (
    <>
      {/* Inject keyframes — scoped name avoids collision with other grain uses */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      {/*
        Fixed overlay wrapper.
        pointer-events: none — never intercepts clicks, hovers, or focus.
        z-index 8000 — above all content, below the intro (9000) and cursor (99999).
        overflow: hidden — clips the grain layer's translate offsets so edges
        stay invisible even at the max ±3% shift.
      */}
      <div
        aria-hidden="true"
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        8000,
          pointerEvents: 'none',
          overflow:      'hidden',
        }}
      >

        {/* ── Layer 1: Grain texture ──────────────────────────────────────── */}
        <div
          className="film-grain-layer"
          style={{
            // Slightly oversize so the translate shifts never reveal an edge
            position:        'absolute',
            inset:           '-6%',
            width:           '112%',
            height:          '112%',

            backgroundImage:  `url("${GRAIN_DATA_URL}")`,
            backgroundRepeat: 'repeat',
            backgroundSize:   '256px 256px',

            // Critical: keep this at 0.042 or lower
            opacity:          0.042,

            // overlay blend mode — grain brightens lights, darkens darks
            // This mimics how film grain interacts with the image beneath
            mixBlendMode:     'overlay',

            // GPU compositing — transform-only animation stays off the CPU
            willChange:       'transform',

            // steps(1) = discrete jumps, no interpolation between frames
            animation:        'filmGrainShift 0.4s steps(1) infinite',
          }}
        />

        {/* ── Layer 2: Vignette ───────────────────────────────────────────── */}
        {/*
          Subtle edge darkening. This is NOT a heavy vignette — more of a
          gentle pressure toward the centre. The effect should be subliminal.

          Uses a separate div (not pseudo-element) because React/Next don't
          support ::after inline styles and we need reliable z-ordering.
        */}
        <div
          style={{
            position:  'absolute',
            inset:     0,
            background:'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.38) 100%)',
            // Normal blend — vignette should layer cleanly without affecting grain
            mixBlendMode: 'normal',
          }}
        />

      </div>
    </>
  )
}
