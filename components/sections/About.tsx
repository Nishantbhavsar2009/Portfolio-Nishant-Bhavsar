'use client'

/**
 * components/sections/About.tsx
 *
 * Editorial, typographic about section. No giant paragraphs — short
 * declarative lines that reveal individually on scroll.
 *
 * ── Animation systems ──────────────────────────────────────────────────────
 *
 *  Text lines   → GSAP ScrollTrigger (individual trigger per line)
 *                 Enter: opacity 0 → 1, y 24 → 0  (start: 'top 80%')
 *                 Exit:  opacity 1 → 0.38          (scrub, as line passes top)
 *
 *  Sidebar      → Framer Motion whileInView (viewport: once, amount: 0.3)
 *
 *  Tech ticker  → Pure CSS @keyframes (0 JS runtime cost)
 *                 Hover pauses via React state → animation-play-state
 *
 * ── Layout ─────────────────────────────────────────────────────────────────
 *   Desktop: 3fr / 2fr CSS grid
 *   Mobile:  single column stack
 */

import {
  useRef,
  useState,
  type JSX,
} from 'react'
import { motion } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

// ─── Content data ─────────────────────────────────────────────────────────────

interface ContentLine {
  text:   string
  size:   number          // px
  weight: number
  color:  string
  gap?:   number          // extra bottom margin (em) for breathing space
}

const LINES: ContentLine[] = [
  { text: 'I am Nishant Bhavsar.',                                    size: 32, weight: 400, color: '#E8E8E8', gap: 0.5 },
  { text: 'Class 12th student from India.',                             size: 24, weight: 300, color: '#D4D4D4' },
  { text: 'Building at the intersection of AI, design, and systems.', size: 24, weight: 300, color: '#D4D4D4', gap: 0.6 },
  { text: 'I don\u2019t just write code \u2014 I obsess over craft.',           size: 24, weight: 300, color: '#C0C0C0' },
  { text: 'From the easing of an animation to the architecture of a system.', size: 22, weight: 300, color: '#A8A8A8', gap: 0.6 },
  { text: 'Currently building intelligent, AI-powered products.',     size: 24, weight: 300, color: '#D4D4D4' },
  { text: 'Learning by shipping.',                                    size: 22, weight: 300, color: '#A0A0A0' },
]

interface StatItem {
  label: string
  value: string
  live?: boolean
}

const STATS: StatItem[] = [
  { label: 'Currently Building', value: 'AI-powered productivity tools', live: true },
  { label: 'Current Focus',      value: 'Design systems + AI integration' },
  { label: 'Learning Now',       value: 'Three.js, advanced GSAP' },
  { label: 'Philosophy',         value: 'Restraint over decoration.\nMotion with intention.' },
]

const TECH = [
  'Next.js', 'TypeScript', 'Python', 'React', 'Tailwind',
  'GSAP', 'Three.js', 'Framer Motion', 'Node.js', 'AI/ML',
]

// ─── Easing ───────────────────────────────────────────────────────────────────

const EASE_REVEAL = [0.16, 1, 0.3, 1] as [number, number, number, number]

// ─── CSS keyframes (injected once) ───────────────────────────────────────────

const TICKER_KEYFRAMES = `
@keyframes aboutTicker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
`

// ─── Component ────────────────────────────────────────────────────────────────

export default function About(): JSX.Element {
  const sectionRef  = useRef<HTMLElement>(null)
  const lineRefs    = useRef<(HTMLDivElement | null)[]>([])

  // Ticker pause-on-hover
  const [tickerPaused, setTickerPaused] = useState(false)

  // ── GSAP: per-line ScrollTrigger reveals ───────────────────────────────
  useGSAP(
    () => {
      const lines = lineRefs.current.filter(Boolean) as HTMLDivElement[]
      if (!lines.length) return

      lines.forEach((el, i) => {
        const inner = el.querySelector('.about-line-inner')

        // ── Enter animation (outer div) ──────────────────────────────────
        // Each line has its OWN ScrollTrigger so they fire independently.
        gsap.to(el, {
          opacity:  1,
          y:        0,
          duration: 0.8,
          ease:     'power3.out',
          delay:    i * 0.06, // subtle cascade, not overwhelming
          scrollTrigger: {
            trigger:       el,
            start:         'top 82%',
            toggleActions: 'play none none none',
          },
        })

        // ── Scroll-past dim (inner span) ──────────────────────────────────
        // When a line has scrolled above the upper portion of the viewport,
        // dim it to 0.38 opacity — a subtle "receding into the past" effect.
        if (inner) {
          gsap.to(inner, {
            opacity: 0.38,
            ease:    'none',
            scrollTrigger: {
              trigger: el,
              start:   'top 16%',   // begin fading as it nears the top
              end:     'top -4%',   // fully dimmed when just above viewport
              scrub:   1,
            },
          })
        }
      })

      ScrollTrigger.refresh()
    },
    { scope: sectionRef, dependencies: [] },
  )

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      id="about"
      aria-label="About Nishant Bhavsar"
      style={{
        position:   'relative',
        minHeight:  '100svh',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Inject ticker keyframes */}
      <style dangerouslySetInnerHTML={{ __html: TICKER_KEYFRAMES }} />

      {/* ── Top divider ─────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          height:     1,
          background: 'rgba(255,255,255,0.055)',
        }}
      />

      {/* ── Inner container ─────────────────────────────────────────────── */}
      <div
        className="container-main"
        style={{ paddingBlock: 'var(--section-padding)' }}
      >

        {/* ── Section label ──────────────────────────────────────────────── */}
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
            marginBottom:  60,
          }}
        >
          02 &mdash; About
        </motion.div>

        {/* ── Two-column grid ─────────────────────────────────────────────── */}
        {/* Responsive: 1 col mobile, 3fr/2fr desktop via scoped class */}
        <style>{`
          .about-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: clamp(40px, 6vw, 80px);
          }
          @media (min-width: 1024px) {
            .about-grid { grid-template-columns: 3fr 2fr; }
          }
        `}</style>

        <div className="about-grid">

          {/* ── Left column: content lines ─────────────────────────────── */}
          <div style={{ alignSelf: 'start' }}>
            {LINES.map((line, i) => (
              <div
                key={i}
                ref={(el) => { lineRefs.current[i] = el }}
                style={{
                  fontSize:     line.size,
                  fontWeight:   line.weight,
                  color:        line.color,
                  lineHeight:   1.7,
                  fontFamily:   'var(--font-body)',
                  marginBottom: line.gap ? `${line.gap}em` : '0.18em',
                  opacity:      0,
                  transform:    'translateY(24px)',
                  willChange:   'transform, opacity',
                }}
              >
                <span className="about-line-inner" style={{ display: 'block', width: '100%' }}>
                  {line.text}
                </span>
              </div>
            ))}
          </div>

          {/* ── Right column: sidebar stats ─────────────────────────── */}
          <div
            style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           0,
              alignSelf:     'start',
              position:      'sticky',
              top:           120,
            }}
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.7,
                  delay:    i * 0.1,
                  ease:     EASE_REVEAL,
                }}
                style={{
                  padding:      '24px 0',
                  borderBottom: '0.5px solid rgba(255,255,255,0.055)',
                }}
              >
                {/* Label row */}
                <div
                  style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         8,
                    marginBottom:8,
                  }}
                >
                  {stat.live && (
                    <motion.span
                      aria-label="Active"
                      animate={{ opacity: [0.9, 0.28, 0.9] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        display:      'inline-block',
                        width:        6,
                        height:       6,
                        borderRadius: '50%',
                        background:   'rgba(255,255,255,0.58)',
                        flexShrink:   0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize:      10,
                      letterSpacing: '0.18em',
                      color:         '#333333',
                      textTransform: 'uppercase',
                      fontFamily:    'var(--font-body)',
                      fontWeight:    400,
                    }}
                  >
                    {stat.label}
                  </span>
                </div>

                {/* Value */}
                <p
                  style={{
                    fontSize:   14,
                    color:      '#A1A1AA',
                    lineHeight: 1.55,
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300,
                    whiteSpace: 'pre-line',
                    margin:     0,
                  }}
                >
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Tech ticker ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, delay: 0.4 }}
          style={{ marginTop: 80 }}
        >
          {/* Top micro-rule above ticker */}
          <div
            aria-hidden="true"
            style={{
              height:       '0.5px',
              background:   'rgba(255,255,255,0.055)',
              marginBottom: 28,
            }}
          />

          {/*
            Ticker track.
            overflow: hidden clips the content.
            mask-image creates the gradient fade on both edges.
          */}
          <div
            onMouseEnter={() => setTickerPaused(true)}
            onMouseLeave={() => setTickerPaused(false)}
            style={{
              overflow:            'hidden',
              // Gradient mask — edges fade to transparent, suggesting more content
              WebkitMaskImage:     'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
              maskImage:           'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
              cursor:              'default',
            }}
          >
            {/*
              Inner row — doubled array for seamless loop.
              translateX(-50%) brings it back to start after one full cycle.
              animationPlayState: 'paused' on hover freezes the scroll.
            */}
            <div
              style={{
                display:              'flex',
                width:                'max-content',
                animation:            'aboutTicker 22s linear infinite',
                animationPlayState:   tickerPaused ? 'paused' : 'running',
                willChange:           'transform',
              }}
            >
              {/* Render twice for seamless loop */}
              {[...TECH, ...TECH].map((tech, i) => (
                <TechItem key={`${tech}-${i}`} name={tech} />
              ))}
            </div>
          </div>

          {/* Bottom micro-rule */}
          <div
            aria-hidden="true"
            style={{
              height:    '0.5px',
              background:'rgba(255,255,255,0.055)',
              marginTop: 28,
            }}
          />
        </motion.div>

      </div>
    </section>
  )
}

// ─── TechItem ─────────────────────────────────────────────────────────────────
/**
 * Individual technology label inside the ticker.
 * Hover state handled locally — color shifts on mouse over.
 */
function TechItem({ name }: { name: string }): JSX.Element {
  const [hovered, setHovered] = useState(false)

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize:      12,
        letterSpacing: '0.06em',
        fontFamily:    'var(--font-body)',
        fontWeight:    400,
        color:         hovered ? '#A1A1AA' : '#444444',
        transition:    'color 0.2s ease',
        whiteSpace:    'nowrap',
        // Padding creates spacing; separator "·" is its own span
        padding:       '0 6px',
        userSelect:    'none',
      }}
    >
      {name}
      {/* Separator dot */}
      <span
        style={{
          color:   '#222222',
          margin:  '0 10px',
          fontSize:12,
        }}
      >
        ·
      </span>
    </span>
  )
}
