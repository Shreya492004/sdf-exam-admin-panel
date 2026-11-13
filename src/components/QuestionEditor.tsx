import { useState, type FormEvent } from 'react'
import type { Question } from '../data/exams'
import { CheckIcon, PlusIcon, TrashIcon } from './Icons'
import type { QuestionDraft } from '../utils/questionDraft'

const LETTERS = ['A', 'B', 'C', 'D']
const emptyDraft = { text: '', options: ['', '', '', ''], answer: -1, marks: '1' }

/** Form for one MCQ question: text, four options, the correct one, and its marks. */
export function QuestionBuilder({
  number,
  onAdd,
  initialQuestion,
}: {
  number: number
  onAdd: (q: Question) => void
  initialQuestion?: Question
}) {
  const [draft, setDraft] = useState(() =>
    initialQuestion
      ? {
          text: initialQuestion.text,
          options: [...initialQuestion.options],
          answer: initialQuestion.answer,
          marks: String(initialQuestion.marks),
        }
      : emptyDraft,
  )
  const [error, setError] = useState('')

  const setOption = (i: number, value: string) =>
    setDraft((d) => ({ ...d, options: d.options.map((o, j) => (j === i ? value : o)) }))

  const add = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.text.trim()
    const options = draft.options.map((o) => o.trim())
    const marks = Number(draft.marks)
    if (!text) return setError('Enter the question.')
    if (options.some((o) => !o)) return setError('Fill in all four options.')
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length)
      return setError('Options must be different from each other.')
    if (draft.answer < 0) return setError('Select the correct answer.')
    if (!Number.isFinite(marks) || marks <= 0) return setError('Marks must be more than 0.')

    onAdd({
      id: initialQuestion?.id ?? `q-${Date.now()}-${number}`,
      text,
      options,
      answer: draft.answer,
      marks,
    })
    setDraft(emptyDraft)
    setError('')
  }

  return (
    <form className="question-form" onSubmit={add}>
      <h3>{initialQuestion ? `Edit Question ${number}` : `Add Question ${number}`}</h3>
      <div className="question-form__row">
        <label className="field">
          <span>Question</span>
          <textarea
            rows={2}
            value={draft.text}
            onChange={(e) => {
              setDraft((d) => ({ ...d, text: e.target.value }))
              setError('')
            }}
            placeholder="Type the question"
          />
        </label>
        <label className="field marks-field">
          <span>Marks</span>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={draft.marks}
            onChange={(e) => setDraft((d) => ({ ...d, marks: e.target.value }))}
            aria-label="Marks for this question"
          />
        </label>
      </div>
      <div className="field">
        <span>Options — select the correct answer</span>
        <div className="option-inputs">
          {draft.options.map((o, i) => (
            <label key={i} className={`option-input${draft.answer === i ? ' is-correct' : ''}`}>
              <input
                type="radio"
                name="correct"
                checked={draft.answer === i}
                onChange={() => {
                  setDraft((d) => ({ ...d, answer: i }))
                  setError('')
                }}
                aria-label={`Mark option ${LETTERS[i]} as correct`}
              />
              <span className="option-letter">{LETTERS[i]}</span>
              <input
                value={o}
                onChange={(e) => {
                  setOption(i, e.target.value)
                  setError('')
                }}
                placeholder={`Option ${LETTERS[i]}`}
              />
            </label>
          ))}
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="modal-actions">
        <button type="submit" className="btn-primary">
          {!initialQuestion && <PlusIcon width={16} height={16} />}
          {initialQuestion ? 'Update Question' : 'Add Question'}
        </button>
      </div>
    </form>
  )
}

/** Numbered list of questions with the correct answer and marks shown. */
export function QuestionList({
  questions,
  onRemove,
}: {
  questions: Question[]
  onRemove?: (id: string) => void
}) {
  return (
    <ol className="question-list">
      {questions.map((q, i) => (
        <li key={q.id} className="question-card">
          <div className="question-card__head">
            <span className="question-card__num">Q{i + 1}</span>
            <span className="question-card__text">{q.text}</span>
            <span className="marks-tag">
              {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
            </span>
            {onRemove && (
              <button
                type="button"
                className="icon-action"
                aria-label={`Delete question ${i + 1}`}
                onClick={() => onRemove(q.id)}
              >
                <TrashIcon width={16} height={16} />
              </button>
            )}
          </div>
          <div className="option-list">
            {q.options.map((o, j) => (
              <div key={j} className={`option-row${j === q.answer ? ' is-correct' : ''}`}>
                <span className="option-letter">{LETTERS[j]}</span>
                <span>{o}</span>
                {j === q.answer && (
                  <span className="option-tag">
                    <CheckIcon width={14} height={14} /> Correct
                  </span>
                )}
              </div>
            ))}
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ---------- Edit a whole question set at once ---------- */

/** One question shown as editable fields — used when a whole set is being edited. */
export function EditableQuestionCard({
  number,
  draft,
  error,
  onChange,
  onRemove,
}: {
  number: number
  draft: QuestionDraft
  error?: string
  onChange: (next: QuestionDraft) => void
  onRemove: () => void
}) {
  const update = (patch: Partial<QuestionDraft>) => onChange({ ...draft, ...patch })
  return (
    <li id={`qcard-${draft.id}`} className={`question-card question-card--edit${error ? ' has-error' : ''}`}>
      <div className="question-card__head">
        <span className="question-card__num">Q{number}</span>
        <label className="field question-card__text-field">
          <span>Question</span>
          <textarea
            rows={2}
            value={draft.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Type the question"
            aria-label={`Question ${number}`}
          />
        </label>
        <label className="field marks-field question-card__marks">
          <span>Marks</span>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={draft.marks}
            onChange={(e) => update({ marks: e.target.value })}
            aria-label={`Marks for question ${number}`}
          />
        </label>
        <button
          type="button"
          className="es-icon-btn is-danger"
          title="Delete question"
          aria-label={`Delete question ${number}`}
          onClick={onRemove}
        >
          <TrashIcon width={15} height={15} />
        </button>
      </div>
      <div className="option-inputs">
        {draft.options.map((o, i) => (
          <label key={i} className={`option-input${draft.answer === i ? ' is-correct' : ''}`}>
            <input
              type="radio"
              name={`correct-${draft.id}`}
              checked={draft.answer === i}
              onChange={() => update({ answer: i })}
              aria-label={`Mark option ${LETTERS[i]} of question ${number} as correct`}
            />
            <span className="option-letter">{LETTERS[i]}</span>
            <input
              value={o}
              onChange={(e) => update({ options: draft.options.map((x, j) => (j === i ? e.target.value : x)) })}
              placeholder={`Option ${LETTERS[i]}`}
              aria-label={`Question ${number} option ${LETTERS[i]}`}
            />
          </label>
        ))}
      </div>
      <p className="question-card__hint">Select the circle next to the correct answer.</p>
      {error && <small className="field-error">{error}</small>}
    </li>
  )
}
