import { useState, type FormEvent } from 'react'
import type { ClassInfo } from '../data/classes'
import type { Subject } from '../data/subjects'
import type { AddSubjectResult } from '../data/store'
import type { Exam, BankQuestion } from '../data/exams'
import PageHeader from '../components/PageHeader'
import { subjectName } from '../utils/validate'
import { BookIcon, CloseIcon, PlusIcon } from '../components/Icons'

type Props = {
  cls: ClassInfo
  subjects: Subject[]
  exams: Exam[]
  questions: BankQuestion[]
  onBack: () => void
  onClasses: () => void
  /** Returns the new subject, or why it failed. */
  onAdd: (name: string) => Promise<AddSubjectResult>
  onRemove: (subjectId: string) => void
}

export default function ClassSubjects({
  cls,
  subjects,
  exams,
  questions,
  onBack,
  onClasses,
  onAdd,
  onRemove,
}: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [added, setAdded] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    const trimmed = name.trim().replace(/\s+/g, ' ')
    const invalid = subjectName(trimmed)
    if (invalid) return setError(invalid)
    if (subjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      return setError(`${trimmed} is already added to ${cls.label}.`)
    }
    setSaving(true)
    const { error: failed } = await onAdd(trimmed)
    setSaving(false)
    // Keep the typed name when saving fails, so it can be retried.
    if (failed) return setError(`Could not add ${trimmed}: ${failed}`)
    setName('')
    setError('')
    setAdded(`${trimmed} added to ${cls.label}.`)
    window.setTimeout(() => setAdded((cur) => (cur.startsWith(trimmed) ? '' : cur)), 3000)
  }

  return (
    <div className="page">
      <PageHeader
        title={`${cls.label} Subjects`}
        onBack={onBack}
        crumbs={[
          { label: 'Classes', onClick: onClasses },
          { label: cls.name, onClick: onBack },
          { label: 'Subjects' },
        ]}
      />

      <div className="option-panel">
        <div className="list-head">
          <div>
            <h2>Subjects</h2>
            <p>Subjects taught in {cls.label}. Exams are created per subject.</p>
          </div>
          <span className="count-pill">
            <BookIcon width={16} height={16} />
            {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
          </span>
        </div>

        <form className={`inline-form${error ? ' has-error' : ''}`} onSubmit={submit} noValidate>
          <input
            value={name}
            maxLength={40}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
              setAdded('')
            }}
            placeholder="New subject name, e.g. Computer"
            aria-label="Subject name"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'subject-error' : undefined}
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            <PlusIcon width={16} height={16} /> {saving ? 'Adding…' : 'Add Subject'}
          </button>
        </form>
        {error && (
          <div className="form-error" id="subject-error" role="alert">
            {error}
          </div>
        )}
        {added && (
          <div className="es-notice" role="status">
            {added}
          </div>
        )}

        {subjects.length === 0 ? (
          <div className="empty-state">No subjects yet. Add one above.</div>
        ) : (
          <div className="subject-grid">
            {subjects.map((s) => {
              const examCount = exams.filter((e) => e.subjectId === s.id).length
              const questionCount = questions.filter((question) => question.subjectId === s.id).length
              const hasContent = examCount > 0 || questionCount > 0
              return (
                <div key={s.id} className="subject-card">
                  <span className="action-card__icon subject-card__icon">
                    <BookIcon width={20} height={20} />
                  </span>
                  <div className="subject-card__body">
                    <div className="subject-card__name">{s.name}</div>
                    <div className="subject-card__meta">
                      {examCount} {examCount === 1 ? 'exam' : 'exams'}
                      {' · '}
                      {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="icon-action"
                    aria-label={`Remove ${s.name}`}
                    title={hasContent ? 'Remove its exams and questions first' : `Remove ${s.name}`}
                    disabled={hasContent}
                    onClick={() => onRemove(s.id)}
                  >
                    <CloseIcon width={16} height={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
