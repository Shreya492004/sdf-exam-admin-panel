import type { Question } from '../data/exams'

/** A question while it is being edited (marks kept as text so the field can be cleared). */
export type QuestionDraft = { id: string; text: string; options: string[]; answer: number; marks: string }

export const toDraft = (q: Question): QuestionDraft => ({
  id: q.id,
  text: q.text,
  options: [...q.options, '', '', '', ''].slice(0, 4),
  answer: q.answer,
  marks: String(q.marks),
})

export const blankDraft = (): QuestionDraft => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  text: '',
  options: ['', '', '', ''],
  answer: -1,
  marks: '1',
})

/** Same rules as the Add Question form. Returns '' when the question is complete. */
export const questionError = (d: QuestionDraft) => {
  const options = d.options.map((o) => o.trim())
  const marks = Number(d.marks)
  if (!d.text.trim()) return 'Enter the question.'
  if (options.some((o) => !o)) return 'Fill in all four options.'
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length)
    return 'Options must be different from each other.'
  if (d.answer < 0) return 'Select the correct answer.'
  if (!Number.isFinite(marks) || marks <= 0) return 'Marks must be more than 0.'
  return ''
}

export const fromDraft = (d: QuestionDraft): Question => ({
  id: d.id,
  text: d.text.trim(),
  options: d.options.map((o) => o.trim()),
  answer: d.answer,
  marks: Number(d.marks),
})

