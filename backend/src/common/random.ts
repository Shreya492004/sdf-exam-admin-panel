import { randomBytes } from 'crypto'

// No look-alike characters (0/O, 1/l/I), so codes are easy to read out and type.
const CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
const LOWER = 'abcdefghjkmnpqrstuvwxyz23456789'

const pick = (alphabet: string, length: number) =>
  Array.from(randomBytes(length), (b) => alphabet[b % alphabet.length]).join('')

/** Random lowercase code, e.g. for exam links. */
export const randomCode = (length = 8) => pick(LOWER, length)

/** Random password with mixed case and digits. */
export const randomPassword = (length = 8) => pick(CHARS, length)

/** Short unique id with a readable prefix, e.g. "stu_k3j9x2ab". */
export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${randomCode(4)}`
