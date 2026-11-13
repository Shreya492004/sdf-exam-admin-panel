import { useState } from 'react'
import Portal from './Portal'
import AnswerSheet, { ScoreCard } from './AnswerSheet'
import type { Exam, ExamResult } from '../data/exams'
import type { Student } from '../data/students'
import { CloseIcon } from './Icons'
import { grade } from '../utils/score'

type Props = {
  exam: Exam
  subjectName: string
  student: Student
  /** When given, opens straight into the answer review. */
  result?: ExamResult
  onClose: () => void
  onSubmit: (answers: Record<string, number>) => void
}

export default function ConductExamModal({ exam, subjectName, student, result, onClose, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>(result?.answers ?? {})
  const [submitted, setSubmitted] = useState(Boolean(result))
  const [error, setError] = useState('')

  const remaining = exam.questions.filter((q) => answers[q.id] === undefined).length

  const submit = () => {
    if (remaining > 0) {
      setError(`Please answer all questions — ${remaining} left.`)
      return
    }
    onSubmit(answers)
    setSubmitted(true)
    setError('')
  }

  return (
    <Portal>
      <div className="modal-backdrop">
        <div className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="conduct-title">
          <div className="modal-head">
            <div>
              <h3 id="conduct-title">
                {exam.name} — {submitted ? 'Result' : 'Answer Sheet'}
              </h3>
              <p>
                {student.name} · Roll {String(student.rollNo).padStart(2, '0')} · {subjectName}
              </p>
            </div>
            <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
              <CloseIcon width={18} height={18} />
            </button>
          </div>

          <div className="conduct-body">
            {submitted && <ScoreCard grade={grade(exam, answers)} />}
            <AnswerSheet
              exam={exam}
              answers={answers}
              onAnswer={
                submitted
                  ? undefined
                  : (qid, option) => {
                      setAnswers((a) => ({ ...a, [qid]: option }))
                      setError('')
                    }
              }
            />
          </div>

          <div className="conduct-foot">
            {error && <div className="form-error">{error}</div>}
            {submitted ? (
              <button type="button" className="btn-primary" onClick={onClose}>
                Done
              </button>
            ) : (
              <>
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={submit}>
                  Submit &amp; Validate
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
