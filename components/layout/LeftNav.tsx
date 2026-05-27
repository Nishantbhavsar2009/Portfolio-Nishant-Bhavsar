'use client'

/**
 * components/layout/LeftNav.tsx
 *
 * Persistent left-side floating navigation — always visible, always in context.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  Fixed pill container (left: 28px, vertically centred)                 │
 * │  ┌─────────────┐                                                       │
 * │  │  ○  Home    │  ← icon button (38×38, rounded-full)                 │
 * │  │  ○  About   │  ← tooltip slides in from left on hover              │
 * │  │  ○  Work    │  ← active: brighter icon + white left-edge bar        │
 * │  │  ○  Contact │    (bar slides between items via layoutId)            │
 * │  │  ──────     │  ← 1px divider                                       │
 * │  │  ┃  track   │  ← 2×40px scroll progress track                     │
 * │  │     thumb   │    thumb moves top→bottom as page scrolls             │
 * │  └─────────────┘                                                       │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Active section detection: IntersectionObserver watching each section id.
 * Smooth scroll: Lenis via useLenis() hook on click.
 * Entrance: slides in from x:-20 with 2.5s delay (after intro animation).
 * Scroll progress: reads window.scrollY / (document height - viewport height).
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type JSX,
} from 'react'
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  Home,
  User,
  FolderOpen,
  Mail,
  type LucideIcon,
} from 'lucide-react'
import { useLenis } from '@/components/providers/SmoothScrollProvider'

// ─── Nav item config ──────────────────────────────────────────────────────────

interface NavItem {
  id:      string      // matches the section's HTML id attribute
  label:   string      // tooltip text
  icon:    LucideIcon
  target:  string      // CSS selector / hash for Lenis scrollTo
}

const NAV_ITEMS: NavItem[] = [
  { id: 'hero',     label: 'Home',    icon: Home,       target: '#hero'     },
  { id: 'about',    label: 'About',   icon: User,       target: '#about'    },
  { id: 'projects', label: 'Work',    icon: FolderOpen, target: '#projects' },
  { id: 'contact',  label: 'Contact', icon: Mail,       target: '#contact'  },
]

// ─── Easing ───────────────────────────────────────────────────────────────────
const EASE_REVEAL = [0.16, 1, 0.3, 1] as const

// ─── NavButton ────────────────────────────────────────────────────────────────

interface NavButtonProps {
  item:     NavItem
  isActive: boolean
  onClick:  (target: string) => void
}

function NavButton({ item, isActive, onClick }: NavButtonProps): JSX.Element {
  const [hovered, setHovered] = useState(false)
  const Icon = item.icon

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>

      {/* ── Active left-edge indicator bar ──────────────────────────────── */}
      {isActive && (
        <motion.div
          layoutId="navIndicator"
          layout
          style={{
            position:     'absolute',
            left:         -10,         // flush with pill left padding
            top:          '50%',
            transform:    'translateY(-50%)',
            width:        2,
            height:       18,
            borderRadius: 100,
            background:   '#F5F5F5',
            zIndex:       1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 34 }}
        />
      )}

      {/* ── Icon button ──────────────────────────────────────────────────── */}
      <motion.button
        aria-label={item.label}
        data-cursor="hover"
        onClick={() => onClick(item.target)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{
          backgroundColor: isActive
            ? 'rgba(255,255,255,0.10)'
            : hovered
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(255,255,255,0)',
          color: isActive
            ? '#F5F5F5'
            : hovered
              ? 'rgba(255,255,255,0.80)'
              : 'rgba(255,255,255,0.30)',
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          width:           38,
          height:          38,
          borderRadius:    '50%',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          border:          'none',
          outline:         'none',
          cursor:          'pointer',
          flexShrink:      0,
          position:        'relative',
          zIndex:          2,
        }}
      >
        <Icon
          size={16}
          strokeWidth={1.75}
          style={{ display: 'block', flexShrink: 0 }}
        />
      </motion.button>

      {/* ── Tooltip ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key={`tooltip-${item.id}`}
            role="tooltip"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position:       'absolute',
              left:           'calc(100% + 12px)',
              top:            '50%',
              transform:      'translateY(-50%)',
              background:     'rgba(10,10,10,0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border:         '0.5px solid rgba(255,255,255,0.10)',
              borderRadius:   6,
              padding:        '5px 10px',
              fontSize:       11,
              color:          '#A1A1AA',
              letterSpacing:  '0.08em',
              whiteSpace:     'nowrap',
              pointerEvents:  'none',
              userSelect:     'none',
              // Sit above other tooltips
              zIndex:         50,
            }}
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── ScrollProgressTrack ─────────────────────────────────────────────────────

function ScrollProgressTrack(): JSX.Element {
  const rawProgress   = useMotionValue(0)

  // Spring gives the thumb a soft trailing feel
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 80,
    damping:   16,
    mass:      0.2,
  })

  // Map 0–1 scroll progress to 0–(40-thumbH) pixel offset along the track
  const TRACK_H = 40
  const THUMB_H = 10
  const thumbY  = useTransform(smoothProgress, [0, 1], [0, TRACK_H - THUMB_H])

  useEffect(() => {
    function onScroll() {
      const scrollTop  = window.scrollY
      const maxScroll  = document.documentElement.scrollHeight - window.innerHeight
      const progress   = maxScroll > 0 ? scrollTop / maxScroll : 0
      rawProgress.set(Math.min(1, Math.max(0, progress)))
    }

    // Run immediately to capture current position on mount
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [rawProgress])

  return (
    <>
      {/* Divider */}
      <div
        aria-hidden="true"
        style={{
          width:           20,
          height:          '0.5px',
          background:      'rgba(255,255,255,0.08)',
          borderRadius:    100,
          flexShrink:      0,
          margin:          '2px 0',
        }}
      />

      {/* Track + thumb */}
      <div
        aria-hidden="true"
        style={{
          position:     'relative',
          width:        2,
          height:       TRACK_H,
          borderRadius: 100,
          background:   'rgba(255,255,255,0.10)',
          flexShrink:   0,
          overflow:     'hidden',
        }}
      >
        <motion.div
          style={{
            position:     'absolute',
            top:          thumbY,
            left:         0,
            width:        2,
            height:       THUMB_H,
            borderRadius: 100,
            background:   'rgba(255,255,255,0.55)',
          }}
        />
      </div>
    </>
  )
}

// ─── LeftNav (main export) ────────────────────────────────────────────────────

export default function LeftNav(): JSX.Element | null {
  const [activeId,  setActiveId]  = useState<string>('hero')
  const [mounted,   setMounted]   = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lenis = useLenis()

  // ── Mount guard (SSR safety) ─────────────────────────────────────────────
  useEffect(() => { setMounted(true) }, [])

  // ── IntersectionObserver — active section tracking ───────────────────────
  useEffect(() => {
    if (!mounted) return

    /**
     * Track the "most visible" section rather than the first intersecting one.
     * This prevents flickering when two sections are partially visible.
     */
    const visibilityMap = new Map<string, number>()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityMap.set(entry.target.id, entry.intersectionRatio)
        })

        // The section with the highest intersection ratio wins
        let maxRatio = 0
        let topId    = activeId

        visibilityMap.forEach((ratio, id) => {
          if (ratio > maxRatio) {
            maxRatio = ratio
            topId    = id
          }
        })

        // Only update if we have meaningful visibility (ratio > 0.1)
        if (maxRatio > 0.1) setActiveId(topId)
      },
      {
        // Fire at every 5% crossing so we can compare relative visibility
        threshold: Array.from({ length: 21 }, (_, i) => i * 0.05),
        // Section becomes "active" when its top 20% enters the viewport
        rootMargin: '0px 0px -20% 0px',
      },
    )

    // Observe all registered section ids
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observerRef.current!.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [mounted]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Click handler — smooth scroll via Lenis ──────────────────────────────
  const handleNavClick = useCallback(
    (target: string) => {
      if (lenis) {
        lenis.scrollTo(target, {
          duration: 1.4,
          easing:   (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          offset:   0,
        })
      } else {
        // Graceful fallback if Lenis hasn't initialised yet
        const el = document.querySelector(target)
        el?.scrollIntoView({ behavior: 'smooth' })
      }
    },
    [lenis],
  )

  if (!mounted) return null

  return (
    <motion.nav
      aria-label="Page navigation"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0,   opacity: 1 }}
      transition={{
        delay:    2.5,
        duration: 0.8,
        ease:     EASE_REVEAL,
      }}
      style={{
        // Fixed position — centred vertically on left edge
        position:   'fixed',
        left:       28,
        top:        '50%',
        translateY: '-50%',
        zIndex:     1000,

        // Pill container
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            6,
        padding:        '12px 10px',
        borderRadius:   100,
        background:     'rgba(10, 10, 10, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border:         '0.5px solid rgba(255,255,255,0.08)',

        // Cursor
        pointerEvents: 'auto',
      }}
    >
      {/* Icon buttons */}
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          isActive={activeId === item.id}
          onClick={handleNavClick}
        />
      ))}

      {/* Scroll progress track — hidden on mobile via CSS */}
      <div className="nav-progress-track">
        <ScrollProgressTrack />
      </div>
    </motion.nav>
  )
}
