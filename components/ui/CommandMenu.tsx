'use client'

/**
 * components/ui/CommandMenu.tsx
 *
 * ⌘J command palette — production-quality easter egg.
 *
 * ── Open/close ─────────────────────────────────────────────────────────────
 *   ⌘J / Ctrl+J          keyboard shortcut (global listener)
 *   Bottom-right pill     click — animates ⌘J → × when open
 *   Escape                close
 *   Click outside         close (backdrop onClick)
 *
 * ── Navigation ─────────────────────────────────────────────────────────────
 *   ↑ / ↓    move selection across items (wraps at edges)
 *   ↵ Enter  execute selected item action
 *
 * ── State ──────────────────────────────────────────────────────────────────
 *   isOpen / open / close / toggle → CommandMenuContext (global)
 *   query / selectedIndex / toast  → local (menu-specific UI)
 *
 * ── Toast ──────────────────────────────────────────────────────────────────
 *   Shown on "Copy Email". AnimatePresence y:8→0, auto-dismissed after 2s.
 *   Separate fixed element, not inside the panel.
 *
 * ── z-index stack ──────────────────────────────────────────────────────────
 *   Trigger pill:   7900
 *   Toast:          9050
 *   Overlay:        9100
 *   Panel:          9200
 *   CustomCursor:   99999  (always above everything)
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type JSX,
  type ElementType,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Home,
  User,
  FolderOpen,
  Mail,
  ExternalLink,
  Copy,
  FileText,
  X,
  Command,
  ArrowRight,
  Check,
} from 'lucide-react'
import { useCommandMenu } from '@/lib/command-menu-context'
import { useLenis }       from '@/components/providers/SmoothScrollProvider'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandItem {
  id:        string
  group:     'Navigate' | 'Actions'
  label:     string
  icon:      ElementType
  shortcut?: string            // e.g. "↵" shown on the right
  hint?:     string            // secondary descriptor (URL, kbd chord, etc.)
  action:    () => void
}

// ─── Easing presets ───────────────────────────────────────────────────────────

const SPRING = { type: 'spring', stiffness: 400, damping: 30 } as const
const EASE_REVEAL = [0.16, 1, 0.3, 1] as [number, number, number, number]

// ─── Utility ──────────────────────────────────────────────────────────────────

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for browsers without async clipboard API
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
/**
 * Standalone toast that appears at bottom-right.
 * Self-dismisses after `duration` ms via the `onDismiss` callback.
 */
function Toast({
  message,
  onDismiss,
  duration = 2000,
}: {
  message:   string
  onDismiss: () => void
  duration?: number
}): JSX.Element {
  useEffect(() => {
    const id = setTimeout(onDismiss, duration)
    return () => clearTimeout(id)
  }, [onDismiss, duration])

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{    opacity: 0, y: 4 }}
      transition={{ duration: 0.22, ease: EASE_REVEAL }}
      style={{
        position:       'fixed',
        bottom:         80,
        right:          28,
        zIndex:         9050,
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        padding:        '10px 16px',
        background:     '#111111',
        border:         '0.5px solid rgba(255,255,255,0.10)',
        borderRadius:   8,
        boxShadow:      '0 8px 32px rgba(0,0,0,0.5)',
        fontSize:       13,
        color:          '#A1A1AA',
        fontFamily:     'var(--font-body)',
        fontWeight:     400,
        pointerEvents:  'none',
        userSelect:     'none',
        whiteSpace:     'nowrap',
      }}
    >
      <Check size={13} strokeWidth={2} style={{ color: '#555', flexShrink: 0 }} />
      {message}
    </motion.div>
  )
}

// ─── useCommands ──────────────────────────────────────────────────────────────
/**
 * Builds the full command list. Memoised — only rebuilt when dependencies change.
 * `showToast` and `close` are stable callbacks from parent.
 */
function useCommands(
  lenis:     ReturnType<typeof useLenis>,
  close:     () => void,
  showToast: (msg: string) => void,
): CommandItem[] {
  const scrollTo = useCallback(
    (target: string) => {
      close()
      setTimeout(() => {
        if (lenis) {
          lenis.scrollTo(target, {
            duration: 1.4,
            easing:   (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          })
        } else {
          document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
        }
      }, 150)
    },
    [lenis, close],
  )

  return useMemo<CommandItem[]>(
    () => [
      // ── Navigate ────────────────────────────────────────────────────────
      {
        id:       'nav-home',
        group:    'Navigate',
        label:    'Home',
        icon:     Home,
        shortcut: '↵',
        action:   () => scrollTo('#hero'),
      },
      {
        id:       'nav-about',
        group:    'Navigate',
        label:    'About',
        icon:     User,
        shortcut: '↵',
        action:   () => scrollTo('#about'),
      },
      {
        id:       'nav-projects',
        group:    'Navigate',
        label:    'Projects',
        icon:     FolderOpen,
        shortcut: '↵',
        action:   () => scrollTo('#projects'),
      },
      {
        id:       'nav-contact',
        group:    'Navigate',
        label:    'Contact',
        icon:     Mail,
        shortcut: '↵',
        action:   () => scrollTo('#contact'),
      },

      // ── Actions ──────────────────────────────────────────────────────────
      {
        id:       'act-github',
        group:    'Actions',
        label:    'View GitHub',
        icon:     ExternalLink,
        shortcut: '↗',
        hint:     'github.com/Nishantbhavsar2009',
        action:   () => {
          close()
          window.open('https://github.com/Nishantbhavsar2009', '_blank', 'noopener,noreferrer')
        },
      },
      {
        id:       'act-resume',
        group:    'Actions',
        label:    'View Résumé',
        icon:     FileText,
        shortcut: '↗',
        hint:     'PDF · 2026',
        action:   () => {
          close()
          window.open('/Nishant%20Bhavsar-Resume.pdf', '_blank', 'noopener,noreferrer')
        },
      },
      {
        id:       'act-email',
        group:    'Actions',
        label:    'Copy Email Address',
        icon:     Copy,
        hint:     'nishantbhavsar2001@gmail.com',
        action:   () => {
          writeClipboard('nishantbhavsar2001@gmail.com').then(() => {
            close()
            showToast('Email copied ✓')
          })
        },
      },
    ],
    [scrollTo, close, showToast],
  )
}

// ─── CommandItemRow ───────────────────────────────────────────────────────────

function CommandItemRow({
  item,
  isActive,
  onMouseEnter,
  onClick,
}: {
  item:         CommandItem
  isActive:     boolean
  onMouseEnter: () => void
  onClick:      () => void
}): JSX.Element {
  const Icon = item.icon

  return (
    <button
      id={`cmd-item-${item.id}`}
      role="option"
      aria-selected={isActive}
      data-cursor="hover"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        width:        '100%',
        padding:      '10px 20px',
        background:   isActive ? 'rgba(255,255,255,0.055)' : 'transparent',
        border:       'none',
        borderLeft:   isActive
          ? '1.5px solid rgba(255,255,255,0.16)'
          : '1.5px solid transparent',
        borderRadius: 0,
        cursor:       'pointer',
        textAlign:    'left',
        transition:   'background 0.1s ease, border-color 0.1s ease',
      }}
    >
      {/* Icon */}
      <span style={{
        display:    'flex',
        alignItems: 'center',
        color:      isActive ? '#666666' : '#444444',
        flexShrink: 0,
        transition: 'color 0.1s ease',
      }}>
        <Icon size={15} strokeWidth={1.5} />
      </span>

      {/* Label */}
      <span style={{
        fontSize:   14,
        color:      isActive ? '#C0C0C0' : '#666666',
        fontFamily: 'var(--font-body)',
        fontWeight: 400,
        flexGrow:   1,
        transition: 'color 0.1s ease',
      }}>
        {item.label}
      </span>

      {/* Hint (secondary text — URL, descriptor) */}
      {item.hint && !isActive && (
        <span style={{
          fontSize:     12,
          color:        '#2A2A2A',
          fontFamily:   'var(--font-body)',
          maxWidth:     160,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
          flexShrink:   0,
        }}>
          {item.hint}
        </span>
      )}

      {/* Shortcut hint — always on right, visible on active */}
      {item.shortcut && (
        <kbd style={{
          fontSize:      11,
          color:         isActive ? '#444444' : '#252525',
          fontFamily:    'var(--font-body)',
          border:        `0.5px solid ${isActive ? '#2A2A2A' : '#1A1A1A'}`,
          borderRadius:  4,
          padding:       '2px 5px',
          lineHeight:    1,
          flexShrink:    0,
          transition:    'color 0.1s ease, border-color 0.1s ease',
          userSelect:    'none',
        }}>
          {item.shortcut}
        </kbd>
      )}

      {/* Arrow chevron on active */}
      {isActive && (
        <span style={{ color: '#333333', flexShrink: 0, display: 'flex' }}>
          <ArrowRight size={12} strokeWidth={1.5} />
        </span>
      )}
    </button>
  )
}

// ─── CommandMenu ──────────────────────────────────────────────────────────────

export default function CommandMenu(): JSX.Element {
  const { isOpen, open, close, toggle } = useCommandMenu()
  const lenis = useLenis()

  // Local UI state ─────────────────────────────────────────────────────────
  const [query,         setQuery]         = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [toast,         setToast]         = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Toast helpers ─────────────────────────────────────────────────────
  const showToast  = useCallback((msg: string) => setToast(msg),  [])
  const dismissToast = useCallback(() => setToast(null), [])

  // ── Command list ──────────────────────────────────────────────────────
  const ALL_COMMANDS = useCommands(lenis, close, showToast)

  // ── Filtered items ────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_COMMANDS
    return ALL_COMMANDS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        (item.hint?.toLowerCase().includes(q) ?? false),
    )
  }, [query, ALL_COMMANDS])

  // Reset selection on filter change
  useEffect(() => { setSelectedIndex(0) }, [query])

  // Scroll selected item into view
  useEffect(() => {
    document
      .getElementById(`cmd-item-${filteredItems[selectedIndex]?.id}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex, filteredItems])

  // Reset query when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // ── Global keyboard listener ──────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // ⌘J / Ctrl+J — toggle
      if (e.key.toLowerCase() === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
        return
      }
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          close()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => (i < filteredItems.length - 1 ? i + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => (i > 0 ? i - 1 : filteredItems.length - 1))
          break
        case 'Enter':
          e.preventDefault()
          filteredItems[selectedIndex]?.action()
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, filteredItems, selectedIndex, close, toggle])

  // ── Focus input on open ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // ── Grouped rendering helpers ─────────────────────────────────────────
  const groups = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []
    for (const item of filteredItems) {
      if (!seen.has(item.group)) { seen.add(item.group); order.push(item.group) }
    }
    return order
  }, [filteredItems])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toast ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <Toast
            key="cmd-toast"
            message={toast}
            onDismiss={dismissToast}
          />
        )}
      </AnimatePresence>

      {/* ── Trigger pill — animates ⌘J → × ──────────────────────────────── */}
      <motion.button
        data-cursor="hover"
        onClick={toggle}
        aria-label={isOpen ? 'Close command menu' : 'Open command menu'}
        aria-keyshortcuts="Meta+j"
        aria-expanded={isOpen}
        whileHover={{
          borderColor: isOpen ? '#2A2A2A' : '#2E2E2E',
          color:       '#777777',
        }}
        transition={{ duration: 0.2 }}
        style={{
          position:       'fixed',
          bottom:         28,
          right:          28,
          zIndex:         7900,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            5,
          minWidth:       52,
          padding:        '6px 10px',
          background:     'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border:         `0.5px solid ${isOpen ? '#2A2A2A' : '#1E1E1E'}`,
          borderRadius:   6,
          cursor:         'pointer',
          color:          isOpen ? '#666666' : '#333333',
          fontSize:       11,
          fontFamily:     'var(--font-body)',
          letterSpacing:  '0.08em',
          userSelect:     'none',
          overflow:       'hidden',
          transition:     'border-color 0.2s, color 0.2s',
        }}
      >
        {/* Icon animates between Command and X */}
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="x-icon"
              initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0,   scale: 1   }}
              exit={{    opacity: 0, rotate: 45,   scale: 0.6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <X size={12} strokeWidth={2} />
            </motion.span>
          ) : (
            <motion.span
              key="cmd-icon"
              initial={{ opacity: 0, rotate: 45,  scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0,   scale: 1   }}
              exit={{    opacity: 0, rotate: -45, scale: 0.6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Command size={11} strokeWidth={1.5} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Text: J when closed, nothing when open */}
        <AnimatePresence mode="wait" initial={false}>
          {!isOpen && (
            <motion.span
              key="j-text"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{    opacity: 0, x: 4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              J
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Menu portal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="cmd-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={close}
              aria-hidden="true"
              style={{
                position:       'fixed',
                inset:          0,
                zIndex:         9100,
                background:     'rgba(0,0,0,0.72)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            />

            {/* Panel */}
            <motion.div
              key="cmd-panel"
              role="dialog"
              aria-label="Command menu"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.96, y: -6 }}
              transition={SPRING}
              style={{
                position:     'fixed',
                top:          '30%',
                left:         '50%',
                translateX:   '-50%',
                translateY:   '-50%',
                zIndex:       9200,
                width:        520,
                maxWidth:     '90vw',
                background:   '#0A0A0A',
                border:       '0.5px solid rgba(255,255,255,0.10)',
                borderRadius: 16,
                boxShadow:    '0 24px 80px rgba(0,0,0,0.65), inset 0 0 0 0.5px rgba(255,255,255,0.04)',
                overflow:     'hidden',
              }}
            >
              {/* ── Search bar ─────────────────────────────────────────── */}
              <div style={{
                display:      'flex',
                alignItems:   'center',
                gap:          12,
                padding:      '0 20px',
                borderBottom: '0.5px solid rgba(255,255,255,0.07)',
              }}>
                <span aria-hidden="true" style={{ color: '#444', display: 'flex', flexShrink: 0 }}>
                  <Search size={16} strokeWidth={1.5} />
                </span>

                <input
                  ref={inputRef}
                  role="combobox"
                  aria-expanded={true}
                  aria-autocomplete="list"
                  aria-controls="cmd-listbox"
                  aria-activedescendant={
                    filteredItems[selectedIndex]
                      ? `cmd-item-${filteredItems[selectedIndex].id}`
                      : undefined
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search or jump to..."
                  spellCheck={false}
                  autoComplete="off"
                  style={{
                    flex:       1,
                    padding:    '18px 0',
                    background: 'transparent',
                    border:     'none',
                    outline:    'none',
                    fontSize:   15,
                    color:      '#F5F5F5',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    caretColor: '#555',
                    // Placeholder via global CSS injected below
                  }}
                />

                <kbd style={{
                  fontSize:      11,
                  color:         '#252525',
                  fontFamily:    'var(--font-body)',
                  border:        '0.5px solid #1A1A1A',
                  borderRadius:  4,
                  padding:       '3px 6px',
                  flexShrink:    0,
                  userSelect:    'none',
                }}>
                  ESC
                </kbd>
              </div>

              {/* ── Results ──────────────────────────────────────────────── */}
              <div
                id="cmd-listbox"
                role="listbox"
                aria-label="Commands"
                style={{
                  maxHeight:      352,
                  overflowY:      'auto',
                  overflowX:      'hidden',
                  padding:        '6px 0 4px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#1A1A1A transparent',
                }}
              >
                {filteredItems.length === 0 ? (
                  <div style={{
                    padding:    '24px 20px',
                    textAlign:  'center',
                    color:      '#444444',
                    fontSize:   14,
                    fontFamily: 'var(--font-body)',
                  }}>
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  groups.map((group) => (
                    <div key={group} role="group" aria-label={group}>
                      {/* Group label */}
                      <div aria-hidden="true" style={{
                        fontSize:      10,
                        letterSpacing: '0.12em',
                        color:         '#333333',
                        textTransform: 'uppercase',
                        fontFamily:    'var(--font-body)',
                        fontWeight:    500,
                        padding:       '12px 20px 6px',
                        userSelect:    'none',
                      }}>
                        {group}
                      </div>

                      {/* Items */}
                      {filteredItems
                        .filter((item) => item.group === group)
                        .map((item) => {
                          const flatIndex = filteredItems.indexOf(item)
                          return (
                            <CommandItemRow
                              key={item.id}
                              item={item}
                              isActive={flatIndex === selectedIndex}
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              onClick={() => item.action()}
                            />
                          )
                        })}
                    </div>
                  ))
                )}
              </div>

              {/* ── Footer ───────────────────────────────────────────────── */}
              <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '10px 20px',
                borderTop:      '0.5px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        14,
                  fontSize:   11,
                  color:      '#252525',
                  fontFamily: 'var(--font-body)',
                  userSelect: 'none',
                }}>
                  <span>
                    <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate
                  </span>
                  <span>
                    <Kbd>↵</Kbd> select
                  </span>
                </div>

                <span style={{
                  fontSize:   11,
                  color:      '#1E1E1E',
                  fontFamily: 'var(--font-body)',
                  userSelect: 'none',
                }}>
                  {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
                </span>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Placeholder input style (scoped) ─────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        #cmd-listbox { }
        input[role="combobox"]::placeholder { color: #3A3A3A; }
      `}} />
    </>
  )
}

// ─── Kbd helper ───────────────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <kbd style={{
      display:      'inline-block',
      fontSize:     10,
      color:        '#2A2A2A',
      border:       '0.5px solid #1A1A1A',
      borderRadius: 3,
      padding:      '1px 4px',
      fontFamily:   'var(--font-body)',
      userSelect:   'none',
    }}>
      {children}
    </kbd>
  )
}
