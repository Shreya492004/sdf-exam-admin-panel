import { randomCode } from '../utils/random'

export type Question = {
  id: string
  text: string
  options: string[]
  /** Index into `options` of the correct answer. */
  answer: number
  /** Marks awarded for a correct answer. */
  marks: number
}

export type BankQuestion = Question & {
  classId: string
  subjectId: string
}

export type QuestionSet = {
  id: string
  title: string
  classId: string
  subjectId: string
  createdAt: string
  questions: Question[]
}

export type ExamResult = {
  /** Selected option index, keyed by question id. */
  answers: Record<string, number>
  submittedAt: string
  /** Times the student left the test screen while attending from the link. */
  leftScreenCount?: number
}

export type Exam = {
  id: string
  name: string
  subjectId: string
  /** Auto-generated code used in the public exam link. */
  code: string
  date: string
  /** Exam window on `date`, as "HH:MM". Students can only attend between these times. */
  startTime?: string
  endTime?: string
  /** When the exam was created (set by the server). */
  createdAt?: string
  /** Minimum percentage needed to pass (defaults to 35 for older exams). */
  passPercent?: number
  questions: Question[]
  /** Results keyed by student id. */
  results: Record<string, ExamResult>
  /**
   * Students added to this exam, keyed by student id, with the login generated for this exam.
   * When set, only these students can log in to the exam link.
   */
  access?: Record<string, ExamLogin>
}

export type ExamLogin = { username: string; password: string }

/** Exam username: first name + 2-digit roll number, e.g. "aarav01". */
export const makeExamUsername = (name: string, rollNo: number) => {
  const first = name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'
  return `${first}${String(rollNo).padStart(2, '0')}`
}

export type NewExam = Pick<Exam, 'name' | 'subjectId' | 'date' | 'startTime' | 'endTime' | 'questions' | 'passPercent'>

export type ExamStatus = 'upcoming' | 'live' | 'ended' | 'open'

/** Start/end of the exam window as Dates (undefined when the exam has no time set). */
export const examWindow = (exam: Pick<Exam, 'date' | 'startTime' | 'endTime'>) =>
  exam.startTime && exam.endTime
    ? { start: new Date(`${exam.date}T${exam.startTime}`), end: new Date(`${exam.date}T${exam.endTime}`) }
    : undefined

/** Whether the exam can be attended right now. Exams without a time window are always "open". */
export const examStatus = (exam: Pick<Exam, 'date' | 'startTime' | 'endTime'>, now = new Date()): ExamStatus => {
  const w = examWindow(exam)
  if (!w) return 'open'
  if (now < w.start) return 'upcoming'
  if (now >= w.end) return 'ended'
  return 'live'
}

/** Random 8-character code for an exam link. */
export const makeExamCode = () => randomCode(8)

/** Total marks of an exam (sum of each question's marks). */
export const totalMarks = (exam: Pick<Exam, 'questions'>) => exam.questions.reduce((t, q) => t + q.marks, 0)

/**
 * Upgrades exams saved before per-question marks existed:
 * each question gets the old exam-wide "marks per question" value.
 */
export const withQuestionMarks = (byClass: Record<string, Exam[]>): Record<string, Exam[]> =>
  Object.fromEntries(
    Object.entries(byClass).map(([classId, list]) => [
      classId,
      list.map((exam) => {
        const { marksPerQuestion, ...rest } = exam as Exam & { marksPerQuestion?: number }
        if (marksPerQuestion === undefined && exam.questions.every((q) => typeof q.marks === 'number')) return exam
        return {
          ...rest,
          questions: exam.questions.map((q) => ({ ...q, marks: q.marks ?? marksPerQuestion ?? 1 })),
        }
      }),
    ]),
  )

