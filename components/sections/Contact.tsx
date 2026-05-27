'use client'

/**
 * components/sections/Contact.tsx
 *
 * Closing section of the portfolio. The email address is the primary hero.
 *
 * ── Layout ─────────────────────────────────────────────────────────────────
 *   min-height: 70svh, centered column, section label top-left
 *   Footer pinned at bottom with three-column layout
 *
 * ── Interactions ───────────────────────────────────────────────────────────
 *   Email:   text-scramble on hover (Phase 1: random 600ms, Phase 2: resolve L→R)
 *            animated underline via Framer Motion variants
 *            click → copy to clipboard → toast
 *
 *   Socials: ↗ arrow slides in from bottom-left on hover
 *            color transitions from #3A3A3A → #A1A1AA
 *
 * ── Scroll animations ──────────────────────────────────────────────────────
 *   Heading:  clip-path mask reveal  (inset 100%→0%)
 *   Email:    fadeUp, delay 0.3s
 *   Socials:  stagger 0.1s each, delay 0.5s
 *   Footer:   fadeIn, delay 0.8s
 *
 * ── Toast ──────────────────────────────────────────────────────────────────
 *   "Email copied ✓" — fixed bottom-right, auto-dismiss 2s, AnimatePresence
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type JSX,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMAIL = 'nishantbhavsar2001@gmail.com'

const SCRAMBLE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.'

const SOCIALS = [
  { id: 'gh', label: 'GitHub',   href: 'https://github.com/Nishantbhavsar2009'   },
  { id: 'email', label: 'Email', href: `mailto:${EMAIL}` },
  { id: 'li', label: 'LinkedIn', href: 'https://www.linkedin.com/in/nishant-bhavsar-055b1a3a7/' },
] as const

// ─── Easing ───────────────────────────────────────────────────────────────────

const EASE_REVEAL = [0.16, 1, 0.3, 1] as [number, number, number, number]
const EASE_CLIP   = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]

// ─── useScramble ──────────────────────────────────────────────────────────────
/**
 * Text-scramble hook.
 *
 * Phase 1 (0–600ms): every 40ms, replace every character with a random char
 *                    from SCRAMBLE_CHARS.
 * Phase 2 (600ms+):  every 40ms, resolve one more character from the left
 *                    until the full original string is restored.
 *
 * Calling stop() at any time immediately restores the original.
 */
function useScramble(original: string) {
  const [display, setDisplay] = useState(original)
  const p1Ref = useRef<ReturnType<typeof setInterval> | null>(null)
  const p2Ref = useRef<ReturnType<typeof setInterval> | null>(null)
  const t1Ref = useRef<ReturnType<typeof setTimeout>  | null>(null)

  const rand = useCallback(
    () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)],
    [],
  )

  const clearAll = useCallback(() => {
    if (p1Ref.current) clearInterval(p1Ref.current)
    if (p2Ref.current) clearInterval(p2Ref.current)
    if (t1Ref.current) clearTimeout(t1Ref.current)
    p1Ref.current = p2Ref.current = t1Ref.current = null
  }, [])

  const scramble = useCallback(() => {
    clearAll()

    // ── Phase 1: randomise everything ─────────────────────────────────────
    p1Ref.current = setInterval(() => {
      setDisplay(
        original.split('').map(() => rand()).join(''),
      )
    }, 40)

    // ── Phase 2: resolve left → right after 600ms ─────────────────────────
    t1Ref.current = setTimeout(() => {
      clearInterval(p1Ref.current!)
      p1Ref.current = null

      let resolved = 0
      p2Ref.current = setInterval(() => {
        resolved++
        setDisplay(
          original.split('').map((ch, i) =>
            i < resolved ? ch : rand(),
          ).join(''),
        )
        if (resolved >= original.length) {
          clearInterval(p2Ref.current!)
          p2Ref.current = null
          setDisplay(original)
        }
      }, 40)
    }, 600)
  }, [original, rand, clearAll])

  const resolve = useCallback(() => {
    clearAll()
    setDisplay(original)
  }, [original, clearAll])

  // Cleanup on unmount
  useEffect(() => () => clearAll(), [clearAll])

  return { display, scramble, resolve }
}

// ─── ContactToast ─────────────────────────────────────────────────────────────

function ContactToast({
  message,
  onDismiss,
}: {
  message:   string
  onDismiss: () => void
}): JSX.Element {
  useEffect(() => {
    const id = setTimeout(onDismiss, 2000)
    return () => clearTimeout(id)
  }, [onDismiss])

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 8  }}
      animate={{ opacity: 1, y: 0  }}
      exit={{    opacity: 0, y: 4  }}
      transition={{ duration: 0.22, ease: EASE_REVEAL }}
      style={{
        position:      'fixed',
        bottom:        80,
        right:         28,
        zIndex:        9050,
        display:       'flex',
        alignItems:    'center',
        gap:           8,
        padding:       '10px 16px',
        background:    '#111111',
        border:        '0.5px solid rgba(255,255,255,0.10)',
        borderRadius:  8,
        boxShadow:     '0 8px 32px rgba(0,0,0,0.5)',
        fontSize:      13,
        color:         '#A1A1AA',
        fontFamily:    'var(--font-body)',
        fontWeight:    400,
        pointerEvents: 'none',
        userSelect:    'none',
        whiteSpace:    'nowrap',
      }}
    >
      <Check size={13} strokeWidth={2} style={{ color: '#555', flexShrink: 0 }} />
      {message}
    </motion.div>
  )
}

// ─── SocialLink ───────────────────────────────────────────────────────────────

function SocialLink({
  label,
  href,
  delay,
}: {
  label: string
  href:  string
  delay: number
}): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: EASE_REVEAL, delay }}
    >
      <motion.a
        href={href}
        target={href.startsWith('mailto:') ? undefined : '_blank'}
        rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
        data-cursor="hover"
        initial="rest"
        whileHover="hover"
        aria-label={href.startsWith('mailto:') ? `Send email to ${label}` : `Open ${label} in new tab`}
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            3,
          textDecoration: 'none',
          cursor:         'pointer',
        }}
      >
        {/* Label */}
        <motion.span
          variants={{
            rest:  { color: '#3A3A3A' },
            hover: { color: '#A1A1AA' },
          }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            fontSize:      11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily:    'var(--font-body)',
            fontWeight:    400,
          }}
        >
          {label}
        </motion.span>

        {/* ↗ arrow — slides in from bottom-left */}
        <motion.span
          variants={{
            rest:  { opacity: 0, x: -4, y: 4 },
            hover: { opacity: 1, x: 0,  y: 0 },
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            fontSize:   11,
            color:      '#A1A1AA',
            lineHeight: 1,
            display:    'inline-block',
            // Slightly offset down so arrow aligns with label baseline
            marginTop:  1,
          }}
        >
          ↗
        </motion.span>
      </motion.a>
    </motion.div>
  )
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export default function Contact(): JSX.Element {
  const { display, scramble, resolve } = useScramble(EMAIL)
  const [toast, setToast] = useState<string | null>(null)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = EMAIL
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    resolve()
    setToast('Email copied ✓')
  }, [resolve])

  return (
    <>
      <section
        id="contact"
        aria-label="Contact Nishant Bhavsar"
        style={{
          minHeight:  '70svh',
          background: 'var(--bg-primary)',
          position:   'relative',
          display:    'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top divider */}
        <div
          aria-hidden="true"
          style={{ height: 1, background: 'rgba(255,255,255,0.055)' }}
        />

        <div
          className="container-main"
          style={{
            paddingBlock: 'var(--section-padding)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ── Section label ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, ease: EASE_REVEAL }}
            style={{
              fontSize:      11,
              letterSpacing: '0.20em',
              color:         '#333333',
              textTransform: 'uppercase',
              fontFamily:    'var(--font-body)',
              fontWeight:    400,
              marginBottom:  'clamp(60px, 10svh, 100px)',
            }}
          >
            04 &mdash; Contact
          </motion.div>

          {/* ── Main content — centered ──────────────────────────────── */}
          <div
            style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              textAlign:      'center',
              gap:            0,
              paddingBottom:  'clamp(40px, 6svh, 80px)',
            }}
          >
            {/* ── "Let's build something." heading — clip-path reveal ── */}
            <div style={{ overflow: 'hidden', marginBottom: 'clamp(20px, 3vw, 32px)' }}>
              <motion.h2
                initial={{ clipPath: 'inset(100% 0 0 0)' }}
                whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: EASE_CLIP }}
                style={{
                  fontSize:      'clamp(40px, 7vw, 80px)',
                  fontFamily:    'var(--font-display)',
                  fontWeight:    400,
                  color:         '#F5F5F5',
                  letterSpacing: '-0.02em',
                  lineHeight:    1.05,
                  margin:        0,
                }}
              >
                Let&rsquo;s build something.
              </motion.h2>
            </div>

            {/* ── Email — scramble + underline + copy ──────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: EASE_REVEAL, delay: 0.3 }}
              style={{ marginBottom: 'clamp(20px, 2.5vw, 28px)' }}
            >
              <motion.button
                data-cursor="hover"
                initial="rest"
                whileHover="hover"
                onHoverStart={scramble}
                onHoverEnd={resolve}
                onClick={handleCopy}
                aria-label={`Copy email address: ${EMAIL}`}
                style={{
                  position:   'relative',
                  background: 'transparent',
                  border:     'none',
                  cursor:     'pointer',
                  padding:    0,
                  display:    'inline-block',
                }}
              >
                {/* Email text */}
                <span
                  style={{
                    fontSize:      'clamp(28px, 5vw, 56px)',
                    fontFamily:    'var(--font-display)',
                    fontWeight:    400,
                    color:         '#F5F5F5',
                    letterSpacing: '-0.02em',
                    lineHeight:    1.1,
                    display:       'block',
                    // Monospace so scramble doesn't shift layout
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {display}
                </span>

                {/* Animated underline — draws left → right */}
                <motion.span
                  aria-hidden="true"
                  variants={{
                    rest:  { scaleX: 0 },
                    hover: { scaleX: 1 },
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{
                    position:        'absolute',
                    bottom:          -4,
                    left:            0,
                    right:           0,
                    height:          '0.5px',
                    background:      '#F5F5F5',
                    transformOrigin: 'left center',
                    display:         'block',
                  }}
                />
              </motion.button>
            </motion.div>

            {/* ── Subtext ───────────────────────────────────────────── */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: EASE_REVEAL, delay: 0.42 }}
              style={{
                fontSize:   15,
                color:      '#3A3A3A',
                fontFamily: 'var(--font-body)',
                fontWeight: 300,
                lineHeight: 1.6,
                maxWidth:   440,
                margin:     '0 0 clamp(32px, 4vw, 48px) 0',
              }}
            >
              Open to collaborations, internships, and interesting projects.
            </motion.p>

            {/* ── Social links row ──────────────────────────────────── */}
            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        32,
              }}
            >
              {SOCIALS.map((social, i) => (
                <SocialLink
                  key={social.id}
                  label={social.label}
                  href={social.href}
                  delay={0.5 + i * 0.1}
                />
              ))}
            </div>
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <motion.footer
            role="contentinfo"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, ease: EASE_REVEAL, delay: 0.8 }}
          >
            {/* Separator */}
            <div
              aria-hidden="true"
              style={{
                height:       '0.5px',
                background:   'rgba(255,255,255,0.05)',
                marginBottom: 24,
              }}
            />

            {/* Three-column layout */}
            <div
              style={{
                display:             'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems:          'center',
                gap:                 16,
                paddingBottom:       24,
              }}
            >
              {/* Left: copyright */}
              <span
                style={{
                  fontSize:      11,
                  color:         '#2A2A2A',
                  letterSpacing: '0.06em',
                  fontFamily:    'var(--font-body)',
                  fontWeight:    400,
                }}
              >
                &copy; 2026 Nishant Bhavsar
              </span>

              {/* Center: availability dot + text */}
              <div
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        8,
                  userSelect: 'none',
                }}
              >
                <motion.span
                  aria-hidden="true"
                  animate={{ opacity: [0.8, 0.2, 0.8] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    display:      'inline-block',
                    width:        6,
                    height:       6,
                    borderRadius: '50%',
                    background:   'rgba(255,255,255,0.35)',
                    flexShrink:   0,
                  }}
                />
                <span
                  style={{
                    fontSize:      11,
                    color:         '#444444',
                    letterSpacing: '0.08em',
                    fontFamily:    'var(--font-body)',
                    fontWeight:    400,
                    whiteSpace:    'nowrap',
                  }}
                >
                  Available for work
                </span>
              </div>

              {/* Right: credit */}
              <span
                style={{
                  fontSize:      11,
                  color:         '#2A2A2A',
                  letterSpacing: '0.04em',
                  fontFamily:    'var(--font-body)',
                  fontWeight:    400,
                  textAlign:     'right',
                }}
              >
                Designed &amp; Built by Nishant
              </span>
            </div>
          </motion.footer>

        </div>
      </section>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <ContactToast
            key="contact-toast"
            message={toast}
            onDismiss={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
