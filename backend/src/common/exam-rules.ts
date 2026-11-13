import type { Question } from './types'

/** Minimum percentage needed to pass an exam. */
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

export const totalMarks = (questions: Question[]) => questions.reduce((t, q) => t + q.marks, 0)

/** Validates a student's answers against the answer key, using each question's own marks. */
export function grade(questions: Question[], answers: Record<string, number>, passPercent = PASS_PERCENT): Grade {
  const right = questions.filter((q) => answers[q.id] === q.answer)
  const score = right.reduce((t, q) => t + q.marks, 0)
  const max = totalMarks(questions)
  const percent = max ? Math.round((score / max) * 100) : 0
  return {
    correct: right.length,
    total: questions.length,
    score,
    max,
    percent,
    passed: percent >= passPercent,
    passPercent,
  }
}

export type ExamStatus = 'upcoming' | 'live' | 'ended' | 'open'

type Timed = { date: string; startTime?: string | null; endTime?: string | null }

export const examWindow = (exam: Timed) =>
  exam.startTime && exam.endTime
    ? { start: new Date(`${exam.date}T${exam.startTime}`), end: new Date(`${exam.date}T${exam.endTime}`) }
    : undefined

/** Whether the exam can be attended right now. Exams without a time window are always "open". */
export const examStatus = (exam: Timed, now = new Date()): ExamStatus => {
  const w = examWindow(exam)
  if (!w) return 'open'
  if (now < w.start) return 'upcoming'
  if (now >= w.end) return 'ended'
  return 'live'
}
