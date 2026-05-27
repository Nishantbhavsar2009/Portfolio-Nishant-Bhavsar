import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background scale — pure monochrome, no hues
        'bg-primary':  '#000000',
        'bg-rich':     '#050505',
        'bg-soft':     '#0B0B0B',
        'bg-elevated': '#111111',
        'bg-card':     '#0D0D0D',
        // Text scale
        'text-primary':   '#F5F5F5',
        'text-secondary': '#A1A1AA',
        'text-muted':     '#71717A',
        // Borders / dividers
        'border-subtle': 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        display: ['var(--font-neue-montreal)', 'var(--font-inter)', 'sans-serif'],
        body:    ['var(--font-inter)', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Cinematic display scale
        'display-2xl': ['clamp(4rem, 12vw, 10rem)',     { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-xl':  ['clamp(3rem, 8vw, 7rem)',       { lineHeight: '1',    letterSpacing: '-0.03em' }],
        'display-lg':  ['clamp(2rem, 5vw, 4.5rem)',     { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-md':  ['clamp(1.5rem, 3vw, 2.75rem)', { lineHeight: '1.1',  letterSpacing: '-0.02em' }],
      },
      spacing: {
        'section':     '120px',
        'section-sm':  '80px',
        'section-lg':  '160px',
      },
      borderRadius: {
        'card': '12px',
        'pill': '9999px',
      },
      borderWidth: {
        '0.5': '0.5px',
      },
      transitionTimingFunction: {
        // Custom cinematic easings — weighted, controlled
        'cinema':   'cubic-bezier(0.76, 0, 0.24, 1)',
        'reveal':   'cubic-bezier(0.16, 1, 0.3, 1)',
        'magnetic': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      transitionDuration: {
        '400':  '400ms',
        '600':  '600ms',
        '800':  '800ms',
        '1000': '1000ms',
        '1200': '1200ms',
      },
      animation: {
        'fade-in':        'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up':       'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'blur-in':        'blurIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        blurIn: {
          from: { opacity: '0', filter: 'blur(12px)' },
          to:   { opacity: '1', filter: 'blur(0px)' },
        },
      },
      backgroundImage: {
        // Grain texture via CSS — no external assets needed for base
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3CfilterFilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filterFilter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
