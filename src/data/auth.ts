/**
 * Admin sign-in. The username and password are checked by the backend (POST /api/auth/login),
 * which returns a token. Only that token is kept in the browser; all school data lives on the server.
 *
 * "Remember me" keeps the token in localStorage (stays signed in after the browser closes).
 * Otherwise it goes in sessionStorage and is cleared when the browser is closed.
 */
const TOKEN_KEY = 'sm-admin-token'
/** Last username used with "Remember me", to prefill the login form. */
const USERNAME_KEY = 'sm-admin-remember-username'

let memoryToken: string | null = null

const read = (store: Storage, key: string) => {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

const write = (store: Storage, key: string, value: string | null) => {
  try {
    if (value) store.setItem(key, value)
    else store.removeItem(key)
  } catch {
    // Storage blocked — the in-memory token still works for this tab.
  }
}

export const getToken = (): string | null =>
  read(localStorage, TOKEN_KEY) ?? read(sessionStorage, TOKEN_KEY) ?? memoryToken

/** Saves the token (remember = survive closing the browser), or clears it everywhere when null. */
export const setToken = (token: string | null, remember = false) => {
  memoryToken = token
  write(localStorage, TOKEN_KEY, token && remember ? token : null)
  write(sessionStorage, TOKEN_KEY, token && !remember ? token : null)
}

export const isSignedIn = () => Boolean(getToken())

export const getRememberedUsername = () => read(localStorage, USERNAME_KEY) ?? ''

export const setRememberedUsername = (username: string | null) => write(localStorage, USERNAME_KEY, username)
