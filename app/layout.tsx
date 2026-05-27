import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'
import { IntroProvider } from '@/lib/intro-context'
import { CommandMenuProvider } from '@/lib/command-menu-context'
import FilmGrain from '@/components/ui/FilmGrain'
import FluidCursor from '@/components/ui/FluidCursor'
import CommandMenu from '@/components/ui/CommandMenu'
import LeftNav from '@/components/layout/LeftNav'
import IntroAnimation from '@/components/intro/IntroAnimation'
import PageTransition from '@/components/layout/PageTransition'
import './globals.css'

/* ─────────────────────────────────────────────
   FONTS
   Inter — body copy (Google Fonts, variable subset)
   
   ⚠️ Neue Montreal (display font) is loaded via next/font/local.
   Download from: https://www.fontshare.com/fonts/neue-montreal
   Place woff2 files in: public/fonts/
   
   Once fonts are in place, uncomment the localFont block below
   and add neueMontreal.variable to the <html> className.
   
   Required file names:
     - NeueMontreal-Light.woff2
     - NeueMontreal-Regular.woff2
     - NeueMontreal-Medium.woff2
     - NeueMontreal-Bold.woff2
     - NeueMontreal-Italic.woff2
     - NeueMontreal-MediumItalic.woff2
───────────────────────────────────────────── */

import localFont from 'next/font/local'

const neueMontreal = localFont({
  src: [
    { path: '../public/fonts/NeueMontreal-Light.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/NeueMontreal-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/NeueMontreal-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/NeueMontreal-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../public/fonts/NeueMontreal-Italic.woff2', weight: '400', style: 'italic' },
    { path: '../public/fonts/NeueMontreal-MediumItalic.woff2', weight: '500', style: 'italic' },
  ],
  variable: '--font-neue-montreal',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

/* ─────────────────────────────────────────────
   METADATA
───────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default:  'Nishant Bhavsar — Developer & AI Enthusiast',
    template: '%s — Nishant Bhavsar',
  },
  description:
    'Class 12 student building intelligent systems, digital experiences, and AI-driven products.',
  keywords: [
    'Nishant Bhavsar', 'developer', 'AI enthusiast',
    'portfolio', 'Next.js', 'React', 'machine learning',
  ],
  authors:  [{ name: 'Nishant Bhavsar' }],
  creator:  'Nishant Bhavsar',
  openGraph: {
    type:        'website',
    locale:      'en_US',
    title:       'Nishant Bhavsar',
    description: 'Developer & AI Enthusiast',
    siteName:    'Nishant Bhavsar',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Nishant Bhavsar — Developer & AI Enthusiast',
    description: 'Class 12 student building intelligent systems, digital experiences, and AI-driven products.',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
}

/* ─────────────────────────────────────────────
   ROOT LAYOUT
───────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${neueMontreal.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Preconnect to Google Fonts CDN for Inter subset download.
          Neue Montreal is local so no preconnect needed.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-bg-primary text-text-primary font-body antialiased">
        {/* ── Skip to main content — visible only on keyboard focus ────── */}
        <a
          href="#main-content"
          className="skip-link"
          aria-label="Skip to main content"
        >
          Skip to content
        </a>

        {/* ── No-JS fallback ────────────────────────────────────────────── */}
        <noscript>
          <style>{`
            /* When JS is disabled, show all sections without animation */
            body { visibility: visible !important; }
            .intro-overlay { display: none !important; }
            [data-framer-motion] { opacity: 1 !important; transform: none !important; }
          `}</style>
        </noscript>

        <CommandMenuProvider>
          <IntroProvider>
            {/*
              Fixed UI layer. z-index stacking (highest = topmost):
                CustomCursor    z: 99999  — always the topmost layer
                PageTransition  z: 9800   — route curtain
                IntroAnimation  z: 9000   — covers site during loading
                CommandMenu     z: 9200   — panel / 7900 trigger pill
                FluidCursor     z: 8500   — canvas trail, behind cursor dot
                FilmGrain       z: 8000   — above content, pointer-events:none
                LeftNav         z: 1000   — above page sections
            */}
            <PageTransition />
            <IntroAnimation />
            <FluidCursor />
            <FilmGrain />
            <CommandMenu />
            <LeftNav />

            {/* Scrollable page content */}
            <SmoothScrollProvider>
              {children}
            </SmoothScrollProvider>
          </IntroProvider>
        </CommandMenuProvider>
      </body>
    </html>
  )
}
