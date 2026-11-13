/**
 * Form validation rules shared by the admin forms. Each returns an error message, or '' when valid.
 * The backend checks the same rules, so a bad value can't be saved by any other route.
 */
import { todayISO } from './format'

export type Errors<K extends string> = Partial<Record<K, string>>

/** True when no field has an error. */
export const isValid = (errors: Errors<string>) => Object.values(errors).every((e) => !e)

const yearsBetween = (fromISO: string, toISO: string) => {
  const from = new Date(fromISO)
  const to = new Date(toISO)
  let years = to.getFullYear() - from.getFullYear()
  if (to.getMonth() < from.getMonth() || (to.getMonth() === from.getMonth() && to.getDate() < from.getDate())) years--
  return years
}

/** Person's name: letters, spaces, dots, apostrophes and hyphens; 2–60 characters. */
export const personName = (value: string, label = 'Name') => {
  const v = value.trim()
  if (!v) return `${label} is required.`
  if (v.length < 2) return `${label} must be at least 2 characters.`
  if (v.length > 60) return `${label} must be 60 characters or fewer.`
  if (!/^[\p{L}][\p{L} .'-]*$/u.test(v)) return `${label} can only contain letters, spaces, dots, apostrophes and hyphens.`
  return ''
}

/** 10-digit mobile number (spaces and dashes are ignored). */
export const phone = (value: string) => {
  const digits = value.replace(/[\s-]/g, '')
  if (!digits) return 'Phone number is required.'
  if (!/^\d+$/.test(digits)) return 'Phone number can only contain digits.'
  if (digits.length !== 10) return 'Phone number must be exactly 10 digits.'
  return ''
}

export const dateOfBirth = (value: string) => {
  if (!value) return 'Date of birth is required.'
  if (value > todayISO()) return 'Date of birth cannot be in the future.'
  const age = yearsBetween(value, todayISO())
  if (age < 2) return 'The student must be at least 2 years old.'
  if (age > 25) return 'Please check the date of birth — the student would be over 25.'
  return ''
}

export const joiningDate = (value: string, dob: string) => {
  if (!value) return 'Joining date is required.'
  if (value > todayISO()) return 'Joining date cannot be in the future.'
  if (dob && value <= dob) return 'Joining date must be after the date of birth.'
  return ''
}

/** Subject name: letters, numbers, spaces and & . - ( ) /; 2–40 characters. */
export const subjectName = (value: string) => {
  const v = value.trim()
  if (!v) return 'Enter a subject name.'
  if (v.length < 2) return 'Subject name must be at least 2 characters.'
  if (v.length > 40) return 'Subject name must be 40 characters or fewer.'
  if (!/^[\p{L}\p{N}][\p{L}\p{N} &.()/-]*$/u.test(v))
    return 'Subject name can only contain letters, numbers, spaces and & . - ( ) /'
  return ''
}

/** A title such as an exam name or question set heading: 3–80 characters. */
export const title = (value: string, label: string) => {
  const v = value.trim()
  if (!v) return `${label} is required.`
  if (v.length < 3) return `${label} must be at least 3 characters.`
  if (v.length > 80) return `${label} must be 80 characters or fewer.`
  return ''
}

/** Pass mark as a whole-number percentage, 1–100. */
export const passMark = (value: string) => {
  if (!value.trim()) return 'Pass mark is required.'
  const n = Number(value)
  if (!Number.isInteger(n)) return 'Pass mark must be a whole number.'
  if (n < 1 || n > 100) return 'Pass mark must be between 1 and 100.'
  return ''
}

/** Exam date for a new exam: required and not in the past. */
export const examDate = (value: string) => {
  if (!value) return 'Exam date is required.'
  if (value < todayISO()) return 'Exam date cannot be in the past.'
  return ''
}
