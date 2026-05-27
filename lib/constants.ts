/**
 * lib/constants.ts
 *
 * Central configuration and content constants.
 * Update these values — they propagate everywhere.
 */

export const SITE = {
  name:        'Nishant Bhavsar',
  title:       'Nishant Bhavsar — Developer & AI Enthusiast',
  description: 'Class 11 student, developer, and AI enthusiast building with precision and restraint.',
  url:         'https://nishantbhavsar.com',
  twitter:     '@nishantbhavsar',
} as const

/** Navigation sections — drives the floating left nav */
export const NAV_SECTIONS = [
  { id: 'hero',     label: 'Home',     icon: 'home'    },
  { id: 'about',    label: 'About',    icon: 'user'    },
  { id: 'projects', label: 'Projects', icon: 'grid'    },
  { id: 'contact',  label: 'Contact',  icon: 'mail'    },
] as const

export type NavSectionId = (typeof NAV_SECTIONS)[number]['id']

/** Cinematic easing presets — mirrors CSS variables for use in Framer Motion / GSAP */
export const EASING = {
  cinema:   [0.76, 0, 0.24, 1]   as const,
  reveal:   [0.16, 1, 0.3, 1]    as const,
  magnetic: [0.23, 1, 0.32, 1]   as const,
  outExpo:  [0.19, 1, 0.22, 1]   as const,
} as const

/** Animation durations in seconds (for Framer Motion) */
export const DURATION = {
  fast:      0.2,
  base:      0.4,
  slow:      0.8,
  cinematic: 1.2,
  intro:     2.0,
} as const

/** Lenis smooth scroll settings */
export const LENIS_CONFIG = {
  duration:    1.2,
  easing:      (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction:   'vertical' as const,
  gestureDirection: 'vertical' as const,
  smooth:      true,
  smoothTouch: false,
  touchMultiplier: 2,
} as const

/** GSAP ScrollTrigger defaults */
export const SCROLL_TRIGGER_DEFAULTS = {
  start:  'top 85%',
  end:    'bottom 20%',
  scrub:  false,
} as const
