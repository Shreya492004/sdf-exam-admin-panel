import { totalMarks, type Exam } from '../data/exams'

/** Default minimum percentage needed to pass (used when a test has no pass mark of its own). */
export const PASS_PERCENT = 35

export type Grade = {
  correct: number
  total: number
  score: number
  max: number
  percent: number
  passed: boolean
  /** Pass mark (percent) this grade was checked against. */
  passPercent: number
}

/** The test's own pass mark, or the default. */
export const passMarkOf = (exam: Pick<Exam, 'passPercent'>) => exam.passPercent ?? PASS_PERCENT

export const selectedOptionIndex = (value: unknown): number | undefined => {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 ? index : undefined
}

/** Validates a student's answers against the answer key, using each question's own marks. */
export function grade(exam: Exam, answers: Record<string, number>): Grade {
  const right = exam.questions.filter((q) => selectedOptionIndex(answers[q.id]) === q.answer)
  const score = right.reduce((t, q) => t + q.marks, 0)
  const max = totalMarks(exam)
  const percent = max ? Math.round((score / max) * 100) : 0
  const passPercent = passMarkOf(exam)
  return {
    correct: right.length,
    total: exam.questions.length,
    score,
    max,
    percent,
    passed: percent >= passPercent,
    passPercent,
  }
}
