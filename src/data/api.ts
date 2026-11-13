import { getToken } from './auth'

/** Base URL of the NestJS backend. In development Vite proxies /api to it (see vite.config.ts). */
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  /** Bearer token to send. Defaults to the admin token. Pass null to send none. */
  token?: string | null
}

/** Called when the admin token is rejected, so the app can show the login page. */
let onUnauthorized: (() => void) | undefined
export const setUnauthorizedHandler = (fn: (() => void) | undefined) => {
  onUnauthorized = fn
}

/** Calls the API and returns the JSON response. Throws ApiError with a readable message on failure. */
export async function api<T>(path: string, { method = 'GET', body, token }: Options = {}): Promise<T> {
  const auth = token === undefined ? getToken() : token
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check that the backend is running and try again.')
  }

  const text = await res.text()
  const json = text ? safeJson(text) : undefined
  if (!res.ok) {
    const raw = (json as { message?: string | string[] } | undefined)?.message
    const message = Array.isArray(raw) ? raw.join(', ') : raw || `Request failed (${res.status}).`
    if (res.status === 401 && token === undefined) onUnauthorized?.()
    throw new ApiError(res.status, message)
  }
  return json as T
}

const safeJson = (text: string) => {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong. Please try again.'
