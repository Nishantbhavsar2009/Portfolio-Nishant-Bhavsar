/**
 * lib/animation.ts
 *
 * Reusable Framer Motion animation variants for the entire portfolio.
 *
 * Design principles encoded here:
 *  - Every animation is weighted and slow — no snappy/springy bounces
 *  - The reveal easing [0.16, 1, 0.3, 1] is a fast-start, slow-settle curve
 *    that feels expensive and deliberate, like a cinema camera pulling focus
 *  - Stagger values are 0.12s — tight enough to feel coordinated,
 *    loose enough to read each element individually
 *
 * Usage with Framer Motion:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ <motion.div                                                      │
 * │   variants={staggerContainer}                                    │
 * │   initial="hidden"                                               │
 * │   animate="visible"   ← or whileInView="visible"                │
 * │ >                                                                │
 * │   <motion.h1 variants={fadeUp}>Heading</motion.h1>              │
 * │   <motion.p  variants={fadeUp}>Body</motion.p>                  │
 * │ </motion.div>                                                    │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * For scroll-triggered reveals, prefer:
 *   whileInView="visible"
 *   viewport={{ once: true, margin: "-80px" }}
 */

import type { Variants } from 'framer-motion'

// ─── Easing Presets ───────────────────────────────────────────────────────────
// These mirror the CSS variables in globals.css for consistency.

/** Cinematic reveal — fast start, silky deceleration. Primary easing. */
export const EASE_REVEAL  = [0.16, 1, 0.3, 1] as const

/** Cinema sweep — symmetric, weighted in/out. For page transitions. */
export const EASE_CINEMA  = [0.76, 0, 0.24, 1] as const

/** Magnetic attraction — for cursor and button hover physics. */
export const EASE_MAGNETIC = [0.23, 1, 0.32, 1] as const

/** Expo out — for elements that need immediate snap, slow settle. */
export const EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as const

// ─── Core Variants ───────────────────────────────────────────────────────────

/**
 * fadeUp — Primary scroll reveal variant.
 * Elements slide up 40px while fading in. The workhorse of the site.
 */
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: EASE_REVEAL,
    },
  },
}

/**
 * fadeIn — Pure opacity fade. Use when vertical movement would feel wrong
 * (e.g. overlays, backgrounds, textures).
 */
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.0,
      ease: 'easeOut',
    },
  },
}

/**
 * fadeDown — Descends into place. For nav items, dropdown menus.
 */
export const fadeDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: EASE_REVEAL,
    },
  },
}

/**
 * scaleReveal — Scales up from 95% while fading in.
 * For project cards and featured elements.
 */
export const scaleReveal: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.9,
      ease: EASE_REVEAL,
    },
  },
}

/**
 * clipReveal — Unmasked via clip-path from bottom to top.
 * Gives elements a "slide out from behind a shelf" effect.
 */
export const clipReveal: Variants = {
  hidden: {
    clipPath: 'inset(100% 0% 0% 0%)',
    opacity: 0,
  },
  visible: {
    clipPath: 'inset(0% 0% 0% 0%)',
    opacity: 1,
    transition: {
      duration: 1.0,
      ease: EASE_CINEMA,
    },
  },
}

/**
 * blurReveal — Fades in while sharpening from blur.
 * For the cinematic intro sequence and hero text.
 */
export const blurReveal: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(12px)',
    scale: 1.02,
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 1.2,
      ease: EASE_REVEAL,
    },
  },
}

// ─── Letter / Word Animation ──────────────────────────────────────────────────

/**
 * letterReveal — Per-character animation variant.
 * Use with a staggerContainer parent. Each character is wrapped in a
 * <motion.span> with this variant.
 */
export const letterReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: EASE_REVEAL,
    },
  },
}

/**
 * wordReveal — Per-word animation. Less granular than letterReveal,
 * more performant for longer phrases.
 */
export const wordReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: EASE_REVEAL,
    },
  },
}

// ─── Container Variants ───────────────────────────────────────────────────────

/**
 * staggerContainer — Orchestrates stagger timing for child variants.
 * Wrap any group of animated children in this parent.
 *
 * @example
 * <motion.ul variants={staggerContainer} initial="hidden" animate="visible">
 *   {items.map(item => (
 *     <motion.li variants={fadeUp}>{item}</motion.li>
 *   ))}
 * </motion.ul>
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

/**
 * staggerContainerSlow — Wider stagger for cinematic hero sequences.
 */
export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.3,
    },
  },
}

/**
 * staggerContainerFast — Tighter stagger for dense lists and grids.
 */
export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0,
    },
  },
}

// ─── Page Transition ──────────────────────────────────────────────────────────

/**
 * pageTransition — Full-page enter/exit variants.
 * Attach to the top-level <motion.div> of each page component.
 */
export const pageTransition: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: EASE_CINEMA,
    },
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * withDelay — Wraps any variant set and adds a custom delay to the visible state.
 * Non-destructive — returns a new variant object.
 *
 * @example
 * <motion.div variants={withDelay(fadeUp, 0.3)} />
 */
export function withDelay(variants: Variants, delay: number): Variants {
  return {
    ...variants,
    visible: {
      ...(variants.visible as object),
      transition: {
        ...((variants.visible as { transition?: object })?.transition ?? {}),
        delay,
      },
    },
  }
}

/**
 * withDuration — Override the duration on any variant's visible transition.
 */
export function withDuration(variants: Variants, duration: number): Variants {
  return {
    ...variants,
    visible: {
      ...(variants.visible as object),
      transition: {
        ...((variants.visible as { transition?: object })?.transition ?? {}),
        duration,
      },
    },
  }
}
