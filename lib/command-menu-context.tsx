'use client'

/**
 * lib/command-menu-context.tsx
 *
 * Global state for the command menu, following the same pattern as
 * lib/intro-context.tsx. Lets any component open/close the palette
 * without prop-drilling or useEffect message passing.
 *
 * ── Usage ────────────────────────────────────────────────────────────────────
 *
 * Reading state (e.g. LeftNav, to dim itself when menu is open):
 *   const { isOpen } = useCommandMenu()
 *
 * Triggering from anywhere (e.g. a "search" button in the hero):
 *   const { open } = useCommandMenu()
 *   <button onClick={open}>Search</button>
 *
 * The ⌘K keyboard listener lives inside CommandMenu.tsx itself.
 * This context only holds the shared boolean + its mutators.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandMenuContextValue {
  isOpen:  boolean
  open:    () => void
  close:   () => void
  toggle:  () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CommandMenuContext = createContext<CommandMenuContextValue>({
  isOpen: false,
  open:   () => {},
  close:  () => {},
  toggle: () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CommandMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open   = useCallback(() => setIsOpen(true),              [])
  const close  = useCallback(() => setIsOpen(false),             [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev),   [])

  return (
    <CommandMenuContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </CommandMenuContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCommandMenu(): CommandMenuContextValue {
  return useContext(CommandMenuContext)
}
