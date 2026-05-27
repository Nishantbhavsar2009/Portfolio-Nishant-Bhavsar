'use client'

/**
 * components/sections/Hero.tsx
 *
 * Fullscreen typographic hero — the first thing the user sees after the
 * cinematic intro slides away.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  [•] CURRENTLY: BUILDING AI-POWERED SYSTEMS                         │
 * │                                                                      │
 * │  NISHANT                                                             │
 * │      BHAVSAR                     ← 4vw left indent (editorial)      │
 * │                                                                      │
 * │  Building intelligent systems,                                       │
 * │  digital experiences, and AI-driven products.                        │
 * │                                                                      │
 * │  CLASS 11 STUDENT · DEVELOPER · AI ENTHUSIAST                       │
 * │                                                                      │
 * │  [ View Projects ↓ ]   Get in Touch                                  │
 * │                                                                      │
 * │                    │                                                 │
 * │                  SCROLL          ← bottom-center scroll cue         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── Animation systems ──────────────────────────────────────────────────
 *   Entrance:  Framer Motion, gated on isIntroComplete from context
 *   Parallax:  GSAP ScrollTrigger (scrub), two separate targets
 *   Scroll cue: Framer Motion keyframe loop + window.scrollY fade
 *
 * ── GSAP ScrollTrigger note ────────────────────────────────────────────
 *   SmoothScrollProvider already sets scrollerProxy so ScrollTrigger
 *   reads Lenis's actual scroll position, not window.scrollY.
 */

import { useState, useEffect, useRef, type JSX } from 'react'
import { motion } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { useIntro } from '@/lib/intro-context'
import { useLenis } from '@/components/providers/SmoothScrollProvider'

// ─── Constants ────────────────────────────────────────────────────────────────

const EASE_REVEAL = [0.16, 1, 0.3, 1] as [number, number, number, number]

const NISHANT_CHARS = 'NISHANT'.split('')
const BHAVSAR_CHARS = 'BHAVSAR'.split('')

// ─── LetterReveal ─────────────────────────────────────────────────────────────

/**
 * Renders a word as individually-animated letter spans.
 * Animation fires once `trigger` flips to true.
 */
function LetterReveal({
  chars,
  baseDelay,
  stagger = 0.04,
  style,
}: {
  chars: string[]
  baseDelay: number
  stagger?: number
  style?: React.CSSProperties
}) {
  const { isIntroComplete } = useIntro()

  return (
    <>
      {chars.map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          aria-hidden="true"
          initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
          animate={
            isIntroComplete
              ? { opacity: 1, y: 0, filter: 'blur(0px)' }
              : { opacity: 0, y: 14, filter: 'blur(5px)' }
          }
          transition={{
            duration:  0.65,
            delay:     baseDelay + i * stagger,
            ease:      EASE_REVEAL,
          }}
          style={{
            display:    'inline-block',
            willChange: 'transform, opacity, filter',
            ...style,
          }}
        >
          {char}
        </motion.span>
      ))}
    </>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function Hero(): JSX.Element {
  const { isIntroComplete } = useIntro()
  const lenis   = useLenis()

  // Refs for GSAP parallax targets
  const sectionRef  = useRef<HTMLElement>(null)
  const headingRef  = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  // Scroll cue visibility
  const [scrolledPast, setScrolledPast] = useState(false)

  // ── Scroll cue fade ──────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── GSAP ScrollTrigger — parallax ─────────────────────────────────────
  // Two independent ScrollTriggers per element:
  //   1. Y movement — runs for the full hero scroll duration (top→off screen)
  //   2. Opacity    — fades to 0 in the first 60% of hero scroll distance
  useGSAP(
    () => {
      if (!headingRef.current || !subtitleRef.current || !sectionRef.current) return

      // ── Heading ── 0.4× scroll speed ──────────────────────────────────
      gsap.to(headingRef.current, {
        y: () => -(window.innerHeight * 0.4),
        ease: 'none',
        scrollTrigger: {
          trigger:            sectionRef.current,
          start:              'top top',
          end:                'bottom top',
          scrub:              1.2,
          invalidateOnRefresh: true,
        },
      })

      gsap.to(headingRef.current, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger:            sectionRef.current,
          start:              'top top',
          end:                () => `+=${window.innerHeight * 0.6}`,
          scrub:              1.2,
          invalidateOnRefresh: true,
        },
      })

      // ── Subtitle ── 0.2× scroll speed ────────────────────────────────
      gsap.to(subtitleRef.current, {
        y: () => -(window.innerHeight * 0.2),
        ease: 'none',
        scrollTrigger: {
          trigger:            sectionRef.current,
          start:              'top top',
          end:                'bottom top',
          scrub:              1.2,
          invalidateOnRefresh: true,
        },
      })

      gsap.to(subtitleRef.current, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger:            sectionRef.current,
          start:              'top top',
          end:                () => `+=${window.innerHeight * 0.6}`,
          scrub:              1.2,
          invalidateOnRefresh: true,
        },
      })

      // Force a refresh so Lenis-proxy measurements are up-to-date
      ScrollTrigger.refresh()
    },
    { scope: sectionRef, dependencies: [] },
  )

  // ── Lenis scroll helpers ──────────────────────────────────────────────
  const scrollTo = (target: string) => {
    if (lenis) {
      lenis.scrollTo(target, {
        duration: 1.4,
        easing:   (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })
    } else {
      document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Introduction"
      style={{
        position: 'relative',
        height:   '100svh',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >

      {/* ── Background: horizontal grid lines ──────────────────────────────
          Static texture — 1px line per 80px of vertical space.
          Using repeating-linear-gradient so there's zero DOM overhead.
      ──────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:        'absolute',
          inset:           0,
          backgroundImage: `repeating-linear-gradient(
            180deg,
            rgba(255,255,255,0.025) 0px,
            rgba(255,255,255,0.025) 1px,
            transparent              1px,
            transparent              80px
          )`,
          pointerEvents: 'none',
          zIndex:        0,
        }}
      />

      {/* ── Background: ambient radial glow — left-of-centre ───────────────
          Very faint; creates the feeling that there's a light source off
          screen left. Adds depth to the pure black without adding colour.
      ──────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:  'absolute',
          inset:     0,
          background:'radial-gradient(ellipse 65% 55% at 22% 42%, rgba(255,255,255,0.028) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex:    0,
        }}
      />

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div
        style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'center',
          // Left-of-centre — not fully centred, editorial positioning
          paddingLeft:    'max(40px, 10vw)',
          paddingRight:   'max(24px, 4vw)',
          zIndex:         1,
        }}
      >

        {/* ── Currently label ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={
            isIntroComplete
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 16 }
          }
          transition={{ duration: 0.8, delay: 0.1, ease: EASE_REVEAL }}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         10,
            marginBottom: 36,
          }}
        >
          {/* Live pulsing dot */}
          <motion.span
            aria-hidden="true"
            animate={{ opacity: [0.9, 0.25, 0.9] }}
            transition={{
              duration:   2.2,
              repeat:     Infinity,
              ease:       'easeInOut',
            }}
            style={{
              display:      'inline-block',
              width:        6,
              height:       6,
              borderRadius: '50%',
              background:   '#666666',
              flexShrink:   0,
            }}
          />

          {/* Separator dashes */}
          <span
            aria-hidden="true"
            style={{
              color:          '#2a2a2a',
              fontSize:       11,
              letterSpacing:  '0.08em',
              fontFamily:     'var(--font-body)',
              userSelect:     'none',
            }}
          >
            ———
          </span>

          {/* Label text */}
          <span
            style={{
              fontSize:       11,
              color:          '#505050',
              letterSpacing:  '0.14em',
              textTransform:  'uppercase',
              fontFamily:     'var(--font-body)',
              fontWeight:     400,
            }}
          >
            Currently: Building AI-powered systems
          </span>
        </motion.div>

        {/* ── NISHANT BHAVSAR heading block ──────────────────────────────
            This entire div is the GSAP parallax target.
            Framer Motion handles the entrance; GSAP handles the scroll.
        ──────────────────────────────────────────────────────────────── */}
        <div
          ref={headingRef}
          aria-label="Nishant Bhavsar"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* First name */}
          <div
            style={{
              display:     'flex',
              lineHeight:  0.9,
              marginBottom:'0.04em',
            }}
          >
            <LetterReveal
              chars={NISHANT_CHARS}
              baseDelay={0.2}
              style={{
                fontSize:      'clamp(72px, 12vw, 160px)',
                fontFamily:    'var(--font-display)',
                fontWeight:    400,
                letterSpacing: '-0.02em',
                lineHeight:    0.9,
                color:         '#F5F5F5',
              }}
            />
          </div>

          {/* Last name — editorially indented */}
          <div
            style={{
              display:    'flex',
              marginLeft: '4vw',
            }}
          >
            <LetterReveal
              chars={BHAVSAR_CHARS}
              baseDelay={0.5}
              style={{
                fontSize:      'clamp(72px, 12vw, 160px)',
                fontFamily:    'var(--font-display)',
                fontWeight:    400,
                letterSpacing: '-0.02em',
                lineHeight:    0.9,
                color:         '#F5F5F5',
              }}
            />
          </div>
        </div>

        {/* ── Subtitle — separate GSAP parallax target ─────────────────── */}
        <motion.p
          ref={subtitleRef}
          initial={{ opacity: 0, y: 20 }}
          animate={
            isIntroComplete
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 20 }
          }
          transition={{ duration: 0.85, delay: 0.7, ease: EASE_REVEAL }}
          style={{
            fontSize:      18,
            color:         '#A1A1AA',
            fontWeight:    300,
            maxWidth:      480,
            lineHeight:    1.65,
            fontFamily:    'var(--font-body)',
            margin:        '36px 0 0 0',
            willChange:    'transform, opacity',
          }}
        >
          Building intelligent systems,<br />
          digital experiences, and AI-driven products.
        </motion.p>

        {/* ── Meta row ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={
            isIntroComplete
              ? { opacity: 1 }
              : { opacity: 0 }
          }
          transition={{ duration: 0.9, delay: 0.9, ease: 'easeOut' }}
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           14,
            marginTop:     22,
            fontSize:      12,
            color:         '#505050',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily:    'var(--font-body)',
            fontWeight:    400,
          }}
        >
          <span>Class 11 Student</span>
          <span aria-hidden="true" style={{ color: '#2a2a2a' }}>·</span>
          <span>Developer</span>
          <span aria-hidden="true" style={{ color: '#2a2a2a' }}>·</span>
          <span>AI Enthusiast</span>
        </motion.div>

        {/* ── CTA row ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={
            isIntroComplete
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 20 }
          }
          transition={{ duration: 0.85, delay: 1.0, ease: EASE_REVEAL }}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        28,
            marginTop:  44,
          }}
        >
          {/* Primary pill button */}
          <motion.button
            data-cursor="hover"
            onClick={() => scrollTo('#projects')}
            whileHover={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderColor:     'rgba(255,255,255,0.38)',
            }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              fontSize:        13,
              color:           '#F5F5F5',
              letterSpacing:   '0.08em',
              padding:         '14px 28px',
              borderRadius:    100,
              fontFamily:      'var(--font-body)',
              fontWeight:      400,
              background:      'transparent',
              border:          '0.5px solid rgba(255,255,255,0.20)',
              // Transitions handled by Framer Motion whileHover
              cursor:          'pointer',
            }}
          >
            View Projects ↓
          </motion.button>

          {/* Ghost text button with animated underline */}
          <motion.button
            data-cursor="hover"
            onClick={() => scrollTo('#contact')}
            initial="rest"
            whileHover="hover"
            style={{
              position:   'relative',
              padding:    '4px 0',
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {/* Text — colour shifts on hover */}
            <motion.span
              variants={{
                rest:  { color: '#71717A' },
                hover: { color: '#F5F5F5' },
              }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                fontSize:      13,
                letterSpacing: '0.08em',
                fontWeight:    400,
                display:       'block',
              }}
            >
              Get in Touch
            </motion.span>

            {/* Animated underline — draws in from left on hover */}
            <motion.span
              aria-hidden="true"
              variants={{
                rest:  { scaleX: 0, originX: 0 },
                hover: { scaleX: 1, originX: 0 },
              }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              style={{
                position:        'absolute',
                bottom:          0,
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

      </div>

      {/* ── Scroll cue — bottom-centre ────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        animate={{ opacity: scrolledPast ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position:        'absolute',
          bottom:          36,
          left:            '50%',
          translateX:      '-50%',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          gap:             10,
          zIndex:          2,
          pointerEvents:   'none',
        }}
      >
        {/* Pulsing vertical line — scaleY 0→1→0 loop, origin: top */}
        <motion.span
          animate={{ scaleY: [0, 1, 0] }}
          transition={{
            duration:   2,
            ease:       'easeInOut',
            repeat:     Infinity,
            repeatType: 'loop',
          }}
          style={{
            display:         'block',
            width:           1,
            height:          40,
            background:      'rgba(255,255,255,0.28)',
            transformOrigin: 'top center',
          }}
        />

        {/* SCROLL text */}
        <span
          style={{
            fontSize:      10,
            color:         '#333333',
            letterSpacing: '0.22em',
            fontFamily:    'var(--font-body)',
            fontWeight:    400,
            textTransform: 'uppercase',
            // Extra padding-left to optically balance letter-spacing
            paddingLeft:   '0.22em',
          }}
        >
          Scroll
        </span>
      </motion.div>

    </section>
  )
}
