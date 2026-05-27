'use client'

/**
 * components/sections/Projects.tsx
 *
 * Premium editorial projects section. Each project occupies a full-width
 * row with alternating image/text columns — a design exhibition, not a grid.
 *
 * ── Layout per row ─────────────────────────────────────────────────────────
 *   Even index (0, 2…): [Image 55%] [Text 45%]
 *   Odd  index (1, 3…): [Text 45%] [Image 55%]
 *   Mobile: always [Image] stacked above [Text]
 *
 * ── Animation systems ──────────────────────────────────────────────────────
 *   Entrance:  GSAP ScrollTrigger per row
 *              Image → slides in from outer edge (x ±60 → 0)
 *              Text  → rises from below (y 40 → 0)
 *              Both use clearProps:'all' so Framer Motion takes over after.
 *
 *   Hover:     Framer Motion variants propagated from the row container
 *              Image  → scale 1 → 1.02
 *              Title  → color #F5F5F5 → #FFFFFF
 *              Border → scaleY 0 → 1 draw-in on text column left edge
 *
 * ── Cursor ─────────────────────────────────────────────────────────────────
 *   Image placeholder: data-cursor="view"  → CustomCursor shows "VIEW"
 *   "View Project" link: data-cursor="hover" → ring expansion
 */

import {
  useRef,
  useState,
  type JSX,
} from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id:          string
  number:      string
  title:       string
  description: string
  tags:        string[]
  year:        string
  status:      'Live' | 'In Progress' | 'Archived'
  link?:       string
  image:       string   // solid colour placeholder
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PROJECTS: Project[] = [
  {
    id:          'p1',
    number:      '001',
    title:       'ClipMind',
    description: 'A local-first macOS second brain that watches your clipboard and uses on-device AI to decide what\'s worth keeping. Everything stays on your Mac — no accounts, no cloud, no subscriptions.',
    tags:        ['Swift', 'MLX', 'SQLite', 'Apple Silicon'],
    year:        '2025',
    status:      'In Progress',
    image:       '/Images/clipmind.png',
    link:        'https://github.com/Nishantbhavsar2009/ClipMind',
  },
  {
    id:          'p2',
    number:      '002',
    title:       'AI Shot Analyzer',
    description: 'Upload a video of your basketball shot and get frame-by-frame coaching. MediaPipe extracts 33 body landmarks, scores 5 shooting mechanics, and generates an annotated video with a PDF drill report.',
    tags:        ['Python', 'MediaPipe', 'OpenCV', 'Streamlit'],
    year:        '2025',
    status:      'Live',
    image:       '/Images/basketball shot analyser.png',
    link:        'https://github.com/Nishantbhavsar2009/Shot-Analyser',
  },
  {
    id:          'p3',
    number:      '003',
    title:       'Scholar OS',
    description: 'A privacy-first student productivity PWA that bridges your browser with macOS — syncing tasks to Apple Reminders, running automation macros, and working fully offline. Zero cloud by default.',
    tags:        ['React', 'Node.js', 'SQLite', 'PWA'],
    year:        '2025',
    status:      'In Progress',
    image:       '/Images/Scholar OS.png',
    link:        'https://github.com/Nishantbhavsar2009/Scholar-OS',
  },
]

// ─── Easing ───────────────────────────────────────────────────────────────────

const EASE_REVEAL = [0.16, 1, 0.3, 1] as [number, number, number, number]

// ─── Scoped styles ────────────────────────────────────────────────────────────

const ROW_STYLES = `
  .project-row-grid {
    display: grid;
    align-items: center;
    gap: 60px;
  }
  @media (max-width: 768px) {
    .project-row-grid {
      grid-template-columns: 1fr !important;
      grid-template-areas: "img" "txt" !important;
      gap: 28px !important;
    }
  }
`

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Project['status'] }): JSX.Element {
  return (
    <span
      style={{
        display:    'inline-flex',
        alignItems: 'center',
        gap:        6,
      }}
    >
      {status === 'Live' && (
        <motion.span
          aria-hidden="true"
          animate={{ opacity: [0.9, 0.28, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            display:      'inline-block',
            width:        5,
            height:       5,
            borderRadius: '50%',
            background:   'rgba(255,255,255,0.52)',
            flexShrink:   0,
          }}
        />
      )}
      <span>{status}</span>
    </span>
  )
}

// ─── ProjectRow ───────────────────────────────────────────────────────────────
/**
 * One full-width project row.
 *
 * GSAP owns the entrance (clearProps:'all' after, hands off to Framer Motion).
 * Framer Motion owns hover — variants cascade from the outer motion.div.
 *
 * Architecture to prevent GSAP ↔ Framer Motion conflicts:
 *   - imgRef / txtRef → plain div wrappers that GSAP animates
 *   - motion.div elements live *inside* those wrappers
 *   - clearProps:'all' ensures no GSAP inline styles remain after entrance
 */
function ProjectRow({
  project,
  index,
}: {
  project: Project
  index:   number
}): JSX.Element {
  const isEven = index % 2 === 0

  const rowRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const txtRef = useRef<HTMLDivElement>(null)

  // ── GSAP: entrance animation ──────────────────────────────────────────
  useGSAP(
    () => {
      if (!imgRef.current || !txtRef.current) return

      // Set initial invisible state before trigger fires
      gsap.set(imgRef.current, { opacity: 0, x: isEven ? -60 : 60 })
      gsap.set(txtRef.current, { opacity: 0, y: 40 })

      const trigger = {
        trigger:       rowRef.current,
        start:         'top 75%',
        toggleActions: 'play none none none',
      }

      // Image: slides in from the outer edge of the layout
      gsap.to(imgRef.current, {
        opacity:    1,
        x:          0,
        duration:   1,
        ease:       'power3.out',
        clearProps: 'opacity,transform', // hand off to Framer Motion after entrance
        scrollTrigger: trigger,
      })

      // Text: rises from below with a 0.1s offset
      gsap.to(txtRef.current, {
        opacity:    1,
        y:          0,
        duration:   1,
        ease:       'power3.out',
        delay:      0.1,
        clearProps: 'opacity,transform',
        scrollTrigger: trigger,
      })

      ScrollTrigger.refresh()
    },
    { scope: rowRef, dependencies: [isEven] },
  )

  return (
    <div ref={rowRef}>
      {/*
        Hover controller — Framer Motion variants cascade to all children.
        initial="rest" + whileHover="hover" propagates the "hover" variant
        string to any motion child that declares matching variants.
      */}
      <motion.div
        initial="rest"
        animate="rest"
        whileHover="hover"
        className="project-row-grid"
        style={{
          gridTemplateColumns: isEven ? '55fr 45fr' : '45fr 55fr',
          gridTemplateAreas:   isEven ? '"img txt"' : '"txt img"',
        }}
      >

        {/* ── Image column ─────────────────────────────────────────────── */}
        <div
          ref={imgRef}
          style={{
            gridArea: 'img',
            opacity: 0,
            transform: `translateX(${isEven ? -60 : 60}px)`,
          }}
        >
          {/*
            The motion.div inside the GSAP wrapper handles hover scale.
            GSAP's clearProps removes its transform after entrance,
            so Framer Motion can apply scale freely without conflict.
          */}
          <motion.div
            data-cursor="view"
            variants={{
              rest:  { scale: 1 },
              hover: { scale: 1.02 },
            }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position:     'relative',
              aspectRatio:  '16 / 10',
              background:   '#0D0D0D',
              border:       '0.5px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              overflow:     'hidden',
              cursor:       'pointer',
            }}
          >
            <Image
              src={project.image}
              alt={`${project.title} screenshot`}
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              priority={index === 0}
              style={{
                objectFit: 'cover',
                opacity: 0.85,
              }}
            />

            {/* Subtle inner texture — barely-visible grid pattern */}
            <div
              aria-hidden="true"
              style={{
                position:        'absolute',
                inset:           0,
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  rgba(255,255,255,0.012) 0px,
                  rgba(255,255,255,0.012) 1px,
                  transparent 1px,
                  transparent 48px
                )`,
                pointerEvents: 'none',
                zIndex:        1,
              }}
            />
          </motion.div>
        </div>

        {/* ── Text column ──────────────────────────────────────────────── */}
        <div
          ref={txtRef}
          style={{
            gridArea: 'txt',
            position: 'relative',
            // Left-side padding gives room for the hover border
            paddingLeft: 24,
            opacity: 0,
            transform: 'translateY(40px)',
          }}
        >
          {/*
            Hover border-left: draws in from top on hover (scaleY 0→1).
            transformOrigin:'top center' is set inline — variants control scaleY only.
          */}
          <motion.span
            aria-hidden="true"
            variants={{
              rest:  { scaleY: 0 },
              hover: { scaleY: 1 },
            }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{
              position:        'absolute',
              left:            0,
              top:             '8%',
              bottom:          '8%',
              width:           1.5,
              background:      'rgba(255,255,255,0.14)',
              transformOrigin: 'top center',
              display:         'block',
            }}
          />

          {/* Project number */}
          <div
            style={{
              fontSize:      11,
              fontFamily:    '"Courier New", monospace',
              color:         '#333333',
              letterSpacing: '0.10em',
              marginBottom:  20,
            }}
          >
            {project.number}
          </div>

          {/* Project title — brightens on row hover */}
          <motion.h3
            variants={{
              rest:  { color: '#F5F5F5' },
              hover: { color: '#FFFFFF' },
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              fontSize:      'clamp(24px, 3vw, 32px)',
              fontFamily:    'var(--font-display)',
              fontWeight:    400,
              letterSpacing: '-0.01em',
              lineHeight:    1.15,
              margin:        '0 0 16px 0',
            }}
          >
            {project.title}
          </motion.h3>

          {/* Description */}
          <p
            style={{
              fontSize:   15,
              color:      '#71717A',
              lineHeight: 1.65,
              maxWidth:   380,
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              margin:     '0 0 20px 0',
            }}
          >
            {project.description}
          </p>

          {/* Tags */}
          <div
            style={{
              display:       'flex',
              flexWrap:      'wrap',
              gap:           '6px 12px',
              marginBottom:  24,
            }}
          >
            {project.tags.map((tag, i) => (
              <span key={tag}>
                <span
                  style={{
                    fontSize:      12,
                    color:         '#444444',
                    letterSpacing: '0.06em',
                    fontFamily:    'var(--font-body)',
                  }}
                >
                  {tag}
                </span>
                {i < project.tags.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{ color: '#222', marginLeft: 12, fontSize: 12 }}
                  >
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>

          {/* Footer row: year + status */}
          <div
            style={{
              display:       'flex',
              alignItems:    'center',
              gap:           24,
              marginBottom:  28,
              fontSize:      11,
              color:         '#333333',
              letterSpacing: '0.08em',
              fontFamily:    'var(--font-body)',
              textTransform: 'uppercase',
            }}
          >
            <span>{project.year}</span>
            <span aria-hidden="true" style={{ color: '#1e1e1e' }}>—</span>
            <StatusBadge status={project.status} />
          </div>

          {/* View Project link — animated underline on hover */}
          <motion.a
            href={project.link ?? '#'}
            data-cursor="hover"
            aria-label={`View ${project.title}`}
            initial="rest"
            whileHover="hover"
            style={{
              position:   'relative',
              display:    'inline-block',
              cursor:     'pointer',
              textDecoration: 'none',
            }}
          >
            <motion.span
              variants={{
                rest:  { color: '#A1A1AA' },
                hover: { color: '#E8E8E8' },
              }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                fontSize:      13,
                fontFamily:    'var(--font-body)',
                letterSpacing: '0.04em',
                fontWeight:    400,
                display:       'block',
              }}
            >
              View Project →
            </motion.span>

            {/* Underline draws left → right */}
            <motion.span
              aria-hidden="true"
              variants={{
                rest:  { scaleX: 0 },
                hover: { scaleX: 1 },
              }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{
                position:        'absolute',
                bottom:          -2,
                left:            0,
                right:           0,
                height:          '0.5px',
                background:      '#E8E8E8',
                transformOrigin: 'left center',
                display:         'block',
              }}
            />
          </motion.a>
        </div>

      </motion.div>
    </div>
  )
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export default function Projects(): JSX.Element {
  return (
    <section
      id="projects"
      aria-label="Selected Work"
      style={{
        minHeight:  '100svh',
        background: 'var(--bg-primary)',
        position:   'relative',
      }}
    >
      {/* Scoped responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: ROW_STYLES }} />

      {/* Top divider */}
      <div
        aria-hidden="true"
        style={{ height: 1, background: 'rgba(255,255,255,0.055)' }}
      />

      <div className="container-main" style={{ paddingBlock: 'var(--section-padding)' }}>

        {/* ── Section header ──────────────────────────────────────────── */}
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
            marginBottom:  32,
          }}
        >
          03 &mdash; Selected Work
        </motion.div>

        {/* ── Section heading ─────────────────────────────────────────── */}
        {/*
          Editorial typographic statement. "P" is rendered as a drop-initial
          — heavier presence pulls the eye, "rojects" sits lighter beside it.
          The contrast within the single word creates tension and visual weight.
        */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, ease: EASE_REVEAL }}
          aria-label="Projects"
          style={{
            marginBottom:  80,
            lineHeight:    0.9,
            userSelect:    'none',
          }}
        >
          <span
            style={{
              fontSize:      'clamp(56px, 9vw, 112px)',
              fontFamily:    'var(--font-display)',
              fontWeight:    300,
              color:         '#F5F5F5',
              letterSpacing: '-0.03em',
              display:       'inline',
            }}
          >
            P
          </span>
          <span
            style={{
              fontSize:      'clamp(48px, 8vw, 96px)',
              fontFamily:    'var(--font-display)',
              fontWeight:    400,
              color:         '#F5F5F5',
              letterSpacing: '-0.02em',
              display:       'inline',
            }}
          >
            rojects
          </span>
        </motion.div>

        {/* ── Project rows ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {PROJECTS.map((project, index) => (
            <div key={project.id}>
              {/* Inter-row divider */}
              {index > 0 && (
                <div
                  aria-hidden="true"
                  style={{
                    height:       '0.5px',
                    background:   'rgba(255,255,255,0.04)',
                    margin:       '80px 0',
                  }}
                />
              )}

              <ProjectRow project={project} index={index} />
            </div>
          ))}
        </div>

        {/* ── Bottom rule ─────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            height:    '0.5px',
            background:'rgba(255,255,255,0.04)',
            marginTop: 80,
          }}
        />

      </div>
    </section>
  )
}
