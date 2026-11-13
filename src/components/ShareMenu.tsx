import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import Portal from './Portal'
import { CopyIcon, ShareIcon } from './Icons'

type Props = {
  /** Subject line for email / title for the device share sheet. */
  title: string
  /** The message that is shared. */
  text: string
  /** How the trigger button looks. */
  variant?: 'button' | 'icon'
  label?: string
  ariaLabel?: string
}

const canNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function'

/** Share button with a small menu: WhatsApp, Email, SMS, Copy, and the device share sheet when available. */
export default function ShareMenu({ title, text, variant = 'button', label = 'Share', ariaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Place the menu under the button (it lives in <body>, so table scrolling can't clip it).
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const place = () => {
      const r = btnRef.current!.getBoundingClientRect()
      const width = 200
      const height = menuRef.current?.offsetHeight ?? 200
      const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8))
      // Open upwards when there isn't room below the button.
      const below = r.bottom + 6
      const top = below + height > window.innerHeight - 8 ? Math.max(8, r.top - 6 - height) : below
      setPos({ top, left })
    }
    place()
    // Re-place once the menu has rendered and its real height is known.
    const frame = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (url: string) => {
    window.open(url, '_blank', 'noopener')
    setOpen(false)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => {
        setCopied(false)
        setOpen(false)
      }, 900)
    } catch {
      setOpen(false)
    }
  }

  const nativeShare = async () => {
    setOpen(false)
    try {
      await navigator.share({ title, text })
    } catch {
      // Cancelled — nothing to do.
    }
  }

  const item = (key: string, icon: ReactNode, name: string, onClick: () => void) => (
    <button key={key} type="button" role="menuitem" className="share-menu__item" onClick={onClick}>
      <span className={`share-menu__icon is-${key}`}>{icon}</span>
      {name}
    </button>
  )

  const enc = encodeURIComponent

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={variant === 'icon' ? 'es-icon-btn' : 'btn-secondary es-btn'}
        title={variant === 'icon' ? label : undefined}
        aria-label={ariaLabel ?? label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <ShareIcon width={15} height={15} />
        {variant === 'button' && label}
      </button>

      {open && pos && (
        <Portal>
          <div ref={menuRef} className="share-menu" role="menu" style={{ top: pos.top, left: pos.left }}>
            {item('whatsapp', 'W', 'WhatsApp', () => go(`https://wa.me/?text=${enc(text)}`))}
            {item('email', '@', 'Email', () => go(`mailto:?subject=${enc(title)}&body=${enc(text)}`))}
            {item('sms', '✉', 'SMS', () => go(`sms:?body=${enc(text)}`))}
            {item('copy', <CopyIcon width={14} height={14} />, copied ? 'Copied!' : 'Copy text', copy)}
            {canNativeShare() && item('more', <ShareIcon width={14} height={14} />, 'More options…', nativeShare)}
          </div>
        </Portal>
      )}
    </>
  )
}
