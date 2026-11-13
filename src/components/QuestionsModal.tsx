import type { Question } from '../data/exams'
import Portal from './Portal'
import { CloseIcon } from './Icons'
import { QuestionList } from './QuestionEditor'

type Props = {
  title: string
  subtitle?: string
  questions: Question[]
  /** Pass to allow deleting questions (used while creating an exam). */
  onRemove?: (id: string) => void
  onClose: () => void
}

/** Popup listing an exam's questions with the correct answers and marks. */
export default function QuestionsModal({ title, subtitle, questions, onRemove, onClose }: Props) {
  const total = questions.reduce((t, q) => t + q.marks, 0)

  return (
    <Portal>
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal modal-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="questions-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-head">
            <div>
              <h3 id="questions-modal-title">{title}</h3>
              <p>
                {subtitle ? `${subtitle} · ` : ''}
                {questions.length} {questions.length === 1 ? 'question' : 'questions'} · {total}{' '}
                {total === 1 ? 'mark' : 'marks'}
              </p>
            </div>
            <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
              <CloseIcon width={18} height={18} />
            </button>
          </div>
          <div className="conduct-body">
            {questions.length === 0 ? (
              <div className="empty-state">No questions.</div>
            ) : (
              <QuestionList questions={questions} onRemove={onRemove} />
            )}
          </div>
          <div className="conduct-foot">
            <button type="button" className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
