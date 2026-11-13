import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders children into <body>, so modals sit above the sidebar.
 * (.main uses `isolation: isolate`, which would otherwise trap their z-index.)
 */
export default function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}
