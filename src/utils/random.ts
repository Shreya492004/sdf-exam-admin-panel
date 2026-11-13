// No look-alike characters (0/O, 1/l/I), so codes are easy to read out and type.
const CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
const LOWER = 'abcdefghjkmnpqrstuvwxyz23456789'

const pick = (alphabet: string, length: number) => {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

/** Random lowercase code, e.g. for exam links. */
export const randomCode = (length = 8) => pick(LOWER, length)

/** Random password with mixed case and digits. */
export const randomPassword = (length = 8) => pick(CHARS, length)
