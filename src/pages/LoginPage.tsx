import { useState, type FormEvent } from 'react'
import { api, errorMessage } from '../data/api'
import { getRememberedUsername, setRememberedUsername } from '../data/auth'
import { EyeIcon, EyeOffIcon, LockIcon } from '../components/Icons'

type Props = {
  /** Called with the token from the server after a successful sign-in. */
  onLogin: (token: string, remember: boolean) => void
  /** Optional note shown above the form (e.g. after logout or an expired session). */
  note?: string
}

/** Admin sign-in, checked by the backend. */
export default function LoginPage({ onLogin, note }: Props) {
  const [username, setUsername] = useState(getRememberedUsername)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(() => getRememberedUsername() !== '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return setError('Enter your username and password.')
    setBusy(true)
    try {
      const res = await api<{ token: string }>('/auth/login', {
        method: 'POST',
        body: { username: username.trim(), password, remember },
        token: null,
      })
      setRememberedUsername(remember ? username.trim() : null)
      onLogin(res.token, remember)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-card__brand">
          <div className="brand-mark">
            <span>SM</span>
          </div>
          <div>
            <h1>Student Management</h1>
            <p>Admin Panel</p>
          </div>
        </div>

        <div className="login-card__note">
          <LockIcon width={16} height={16} />
          {note ?? 'Sign in to continue.'}
        </div>

        <label className="field">
          <span>Username</span>
          <input
            autoFocus={!username}
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError('')
            }}
            placeholder="Enter username"
          />
        </label>
        <div className="field">
          <label htmlFor="login-password">
            <span>Password</span>
          </label>
          <div className="password-input">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoFocus={Boolean(username)}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              placeholder="Enter password"
            />
            <button
              type="button"
              className="password-input__toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
            </button>
          </div>
        </div>

        <label className="login-card__remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember me
        </label>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn-primary login-card__submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <footer className="login-footer">2026 © Student Management Academy</footer>
    </div>
  )
}
