'use client'

/**
 * components/ui/CustomCursor.tsx
 *
 * Two-layer cinematic cursor that replaces the browser default entirely.
 *
 * Layer architecture:
 * ┌────────────────────────────────────────────────────────────────┐
 * │  ARROW — standard white pointer with black stroke             │
 * │    · Follows mouse with zero lag (direct MotionValue update)  │
 * │    · Disappears on hover, click response interaction          │
 * │                                                               │
 * │  RING (36px) — 1px white-30% circle outline                   │
 * │    · Follows mouse with spring lag (trailing feel)            │
 * │    · Expands to 64px on links/buttons (data-cursor="hover")  │
 * │    · Expands to 80px with "VIEW" text on cards               │
 * │    · Fades out when cursor leaves window                      │
 * └────────────────────────────────────────────────────────────────┘
 *
 * Cursor state is set via data attributes on interactive elements:
 *   <a data-cursor="hover">Link</a>
 *   <div data-cursor="view">Project card</div>
 *
 * Elements without data-cursor use the default state.
 *
 * Mobile: not rendered at all (pointer: coarse detection).
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type CursorState = 'default' | 'hover' | 'view' | 'hidden'

// ─── Spring configs ───────────────────────────────────────────────────────────

/**
 * Ring trailing spring — the lag that makes it feel "weighted".
 * Lower stiffness = more lag = dreamier feel.
 * These values produce ~0.08 lerp equivalent at 60fps.
 */
const RING_SPRING = { stiffness: 120, damping: 20, mass: 0.2 }

/**
 * State transition spring — snappy but not jarring.
 * Used for scale/size changes on hover/click.
 */
const STATE_SPRING = { stiffness: 300, damping: 28 }

// ─── Size map ─────────────────────────────────────────────────────────────────

const RING_SIZE: Record<CursorState, number> = {
  default: 36,
  hover:   64,
  view:    80,
  hidden:  36,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomCursor() {
  // ── Touch device guard ───────────────────────────────────────────────────
  // Mounted state prevents SSR mismatch; touch check runs client-side only.
  const [mounted, setMounted] = useState(false)
  const [isTouch,  setIsTouch]  = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  if (!mounted || isTouch) return null

  return <CursorInner />
}

// ─── Inner cursor (only rendered on pointer-fine devices) ─────────────────────

function CursorInner() {
  // ── Raw mouse position MotionValues ────────────────────────────────────
  // Updated synchronously on every mousemove — zero lag for the dot.
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  // ── Ring position — spring behind the mouse ─────────────────────────────
  const ringX = useSpring(mouseX, RING_SPRING)
  const ringY = useSpring(mouseY, RING_SPRING)

  // ── Cursor state ────────────────────────────────────────────────────────
  const [cursorState, setCursorState] = useState<CursorState>('default')
  const [isClicking,  setIsClicking]  = useState(false)
  const [viewText,    setViewText]    = useState('VIEW')

  // Ref to track current state without stale closures in event listeners
  const stateRef = useRef<CursorState>('default')

  // ── Element detection ────────────────────────────────────────────────────
  /**
   * Walk up the DOM from the event target to find the nearest ancestor
   * (or self) with a data-cursor attribute. Returns null if none found.
   */
  const getTargetCursorState = useCallback(
    (target: EventTarget | null): CursorState => {
      if (!(target instanceof Element)) return 'default'

      const el = target.closest<HTMLElement>('[data-cursor]')
      if (!el) {
        // Also treat plain <a> and <button> as hover targets
        const interactive = target.closest('a, button, [role="button"]')
        return interactive ? 'hover' : 'default'
      }

      const val = el.dataset.cursor
      if (val === 'hover') return 'hover'
      if (val === 'view') {
        // Allow custom label via data-cursor-label="OPEN"
        setViewText(el.dataset.cursorLabel ?? 'VIEW')
        return 'view'
      }
      return 'default'
    },
    [],
  )

  // ── Event wiring ─────────────────────────────────────────────────────────
  useEffect(() => {
    function onMove(e: MouseEvent) {
      // Direct set — no spring, no lag. Dot snaps to exact position.
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)

      // Derive cursor state from hovered element
      const next = getTargetCursorState(e.target)
      if (next !== stateRef.current) {
        stateRef.current = next
        setCursorState(next)
      }
    }

    function onDown() {
      setIsClicking(true)
    }

    function onUp() {
      setIsClicking(false)
    }

    // Cursor leaves the browser window entirely
    function onLeave() {
      stateRef.current = 'hidden'
      setCursorState('hidden')
    }

    // Cursor re-enters the window
    function onEnter() {
      stateRef.current = 'default'
      setCursorState('default')
    }

    window.addEventListener('mousemove',  onMove,  { passive: true })
    window.addEventListener('mousedown',  onDown,  { passive: true })
    window.addEventListener('mouseup',    onUp,    { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      window.removeEventListener('mousemove',  onMove)
      window.removeEventListener('mousedown',  onDown)
      window.removeEventListener('mouseup',    onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
    }
  }, [mouseX, mouseY, getTargetCursorState])

  // ── Derived states ────────────────────────────────────────────────────────
  const isHidden  = cursorState === 'hidden'
  const isHover   = cursorState === 'hover'
  const isView    = cursorState === 'view'
  const ringSize  = RING_SIZE[cursorState]

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── ARROW ────────────────────────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{
          position:       'fixed',
          top:            0,
          left:           0,
          pointerEvents:  'none',
          zIndex:         99999,
          // Use translate for GPU compositing (avoids layout reflow)
          x:              mouseX,
          y:              mouseY,
          // Align the tip of the arrow exactly with the cursor hotspot
          translateX:     0,
          translateY:     0,
          transformOrigin: 'top left',
        }}
        animate={{
          // Disappears on hover state (ring takes over visual presence)
          scale:   isHover || isView ? 0 : isClicking ? 0.9 : 1,
          opacity: isHidden ? 0 : 1,
        }}
        transition={
          isClicking
            ? { ...STATE_SPRING, type: 'spring', duration: 0.15 }
            : { ...STATE_SPRING, type: 'spring' }
        }
      >
        {/* White arrow cursor SVG with black outline and drop shadow */}
        <svg
          width="15"
          height="21"
          viewBox="0 0 15 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.35))',
          }}
        >
          <path
            d="M0 0V19L5.2 13.8L9.5 21L12.5 19.5L8.2 12.5H14L0 0Z"
            fill="white"
            stroke="black"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      {/* ── RING ─────────────────────────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        style={{
          position:        'fixed',
          top:             0,
          left:            0,
          pointerEvents:   'none',
          zIndex:          99998,
          x:               ringX,
          y:               ringY,
          translateX:      '-50%',
          translateY:      '-50%',
          transformOrigin: 'center center',
          // Flex-centre the "VIEW" label inside the ring
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
        }}
        animate={{
          width:           ringSize,
          height:          ringSize,
          borderRadius:    '50%',
          border:          isHover || isView
            ? '1px solid rgba(255,255,255,0.8)'
            : '1px solid rgba(255,255,255,0.3)',
          backgroundColor: isHover
            ? 'rgba(255,255,255,0.05)'
            : isView
              ? 'rgba(255,255,255,0.04)'
              : 'transparent',
          opacity:         isHidden ? 0 : isHover ? 0.8 : 1,
        }}
        transition={{ ...STATE_SPRING, type: 'spring' }}
      >
        {/* ── VIEW label — only visible in 'view' state ─────────────────── */}
        <AnimatePresence>
          {isView && (
            <motion.span
              key="view-label"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                fontSize:      10,
                fontFamily:    'var(--font-body)',
                fontWeight:    500,
                letterSpacing: '0.2em',
                color:         '#ffffff',
                textTransform: 'uppercase',
                userSelect:    'none',
                lineHeight:    1,
                // Compensate for letter-spacing trailing space
                paddingLeft:   '0.2em',
                whiteSpace:    'nowrap',
              }}
            >
              {viewText}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
