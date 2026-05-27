/**
 * components/index.ts
 *
 * Barrel export for all portfolio components.
 */

// ─── Providers ────────────────────────────────────────────────────────────────
export { SmoothScrollProvider, useLenis } from './providers/SmoothScrollProvider'

// ─── UI ───────────────────────────────────────────────────────────────────────
export { default as CustomCursor } from './ui/CustomCursor'
export { default as FilmGrain    } from './ui/FilmGrain'
export { default as CommandMenu  } from './ui/CommandMenu'

// ─── Layout ───────────────────────────────────────────────────────────────────
export { default as LeftNav } from './layout/LeftNav'

// ─── Intro ────────────────────────────────────────────────────────────────────
export { default as IntroAnimation } from './intro/IntroAnimation'

// ─── Sections ─────────────────────────────────────────────────────────────────
export { default as Hero     } from './sections/Hero'
export { default as About    } from './sections/About'
export { default as Projects } from './sections/Projects'
export { default as Contact  } from './sections/Contact'

// ─── Phase 2 (next) ───────────────────────────────────────────────────────────
// export { default as GrainOverlay }  from './ui/GrainOverlay'
// export { default as CustomCursor }  from './ui/CustomCursor'
// export { default as FloatingNav }   from './ui/FloatingNav'

// ─── Phase 3 ──────────────────────────────────────────────────────────────────
// export { default as CinematicIntro } from './sections/CinematicIntro'
// export { default as Hero }           from './sections/Hero'

// ─── Phase 4 ──────────────────────────────────────────────────────────────────
// export { default as About }    from './sections/About'
// export { default as Projects } from './sections/Projects'

// ─── Phase 5 ──────────────────────────────────────────────────────────────────
// export { default as Contact }     from './sections/Contact'
// export { default as CommandMenu } from './ui/CommandMenu'
