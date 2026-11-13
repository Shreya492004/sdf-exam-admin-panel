import { useState } from 'react'
import type { Student } from '../data/students'
import { CopyIcon, RefreshIcon } from './Icons'

type Props = {
  student: Student
  onResetPassword?: () => void
}

/** Copy-login and new-password buttons for one student. */
export function LoginActions({ student, onResetPassword }: Props) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Username: ${student.username}\nPassword: ${student.password}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — the values are visible to copy by hand.
    }
  }

  return (
    <div className="login-cell__actions">
      <button
        type="button"
        className="mini-btn"
        onClick={copy}
        title="Copy username and password"
        aria-label={`Copy login for ${student.name}`}
      >
        {copied ? '✓' : <CopyIcon width={14} height={14} />}
      </button>
      {onResetPassword && (
        <button
          type="button"
          className="mini-btn"
          onClick={() => {
            if (window.confirm(`Generate a new password for ${student.name}? The old one will stop working.`))
              onResetPassword()
          }}
          title="Generate a new password"
          aria-label={`Generate a new password for ${student.name}`}
        >
          <RefreshIcon width={14} height={14} />
        </button>
      )}
    </div>
  )
}

/** Username + password stacked in one cell, with copy and reset. */
export default function LoginCell({ student, onResetPassword }: Props) {
  return (
    <div className="login-cell">
      <div className="login-cell__values">
        <span>
          <em>User</em> <code>{student.username}</code>
        </span>
        <span>
          <em>Pass</em> <code>{student.password}</code>
        </span>
      </div>
      <LoginActions student={student} onResetPassword={onResetPassword} />
    </div>
  )
}
