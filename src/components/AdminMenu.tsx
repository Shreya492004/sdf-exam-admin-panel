import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, LogoutIcon } from './Icons'

type Props = {
  onLogout: () => void
}

/** "Administrator" button in the top bar; opens a small menu with Logout. */
export default function AdminMenu({ onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking anywhere else or pressing Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="admin-menu" ref={ref}>
      <button
        type="button"
        className={`admin-pill${open ? ' is-open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="admin-pill__avatar">A</span>
        <span className="admin-pill__name">Administrator</span>
        <ChevronDownIcon className="admin-pill__caret" width={16} height={16} />
      </button>

      {open && (
        <div className="admin-menu__panel" role="menu">
          <div className="admin-menu__head">
            <span className="admin-pill__avatar is-large">A</span>
            <div>
              <strong>Administrator</strong>
              <span>Admin</span>
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            className="admin-menu__item is-danger"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            <LogoutIcon width={16} height={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
