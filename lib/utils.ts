/**
 * lib/utils.ts
 *
 * Core utility functions used across the portfolio.
 * Kept minimal — only what's needed for the foundation.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — Merge Tailwind classes with conflict resolution.
 * Drop-in for shadcn/ui components.
 *
 * @example
 *   cn('px-4 py-2', condition && 'font-bold', 'px-6')
 *   // → 'py-2 font-bold px-6'  (px-4 overridden by px-6)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * clamp — CSS clamp value generator for fluid typography.
 *
 * @param minPx  - minimum size in px
 * @param maxPx  - maximum size in px
 * @param minVw  - viewport width at which min applies (default 320)
 * @param maxVw  - viewport width at which max applies (default 1280)
 */
export function fluidClamp(
  minPx: number,
  maxPx: number,
  minVw = 320,
  maxVw = 1280,
): string {
  const slope = (maxPx - minPx) / (maxVw - minVw)
  const intercept = minPx - slope * minVw
  const preferred = `${slope * 100}vw + ${intercept}px`
  return `clamp(${minPx}px, calc(${preferred}), ${maxPx}px)`
}

/**
 * mapRange — Map a value from one range to another.
 * Useful for scroll-driven animation calculations.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

/**
 * lerp — Linear interpolation.
 * Used for smooth cursor trailing animations.
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor
}

/**
 * formatDate — Locale-aware date formatter.
 */
export function formatDate(date: Date | string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(typeof date === 'string' ? new Date(date) : date)
}
