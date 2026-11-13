import { randomPassword } from './random'

const firstName = (name: string) =>
  name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'

const pad = (n: number) => String(n).padStart(2, '0')

/** Student portal username, e.g. "aarav.lkg.01" — unique because roll numbers are unique within a class. */
export const makeUsername = (name: string, classId: string, rollNo: number) =>
  `${firstName(name)}.${classId}.${pad(rollNo)}`

/** Exam username: first name + 2-digit roll number, e.g. "aarav01". */
export const makeExamUsername = (name: string, rollNo: number) => `${firstName(name)}${pad(rollNo)}`

export const makePassword = () => randomPassword(8)
