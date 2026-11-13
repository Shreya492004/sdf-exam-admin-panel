import { useState } from 'react'
import type { ClassInfo } from '../data/classes'
import type { QuestionSet } from '../data/exams'
import type { Subject } from '../data/subjects'
import { ExamIcon, EyeIcon, PencilIcon, PlusIcon, TrashIcon } from '../components/Icons'
import PageHeader from '../components/PageHeader'
import { title as titleRule } from '../utils/validate'
import { EditableQuestionCard, QuestionList } from '../components/QuestionEditor'
import { blankDraft, fromDraft, questionError, toDraft, type QuestionDraft } from '../utils/questionDraft'

type Props = {
  cls: ClassInfo
  questionSets: QuestionSet[]
  subjects: Subject[]
  /** Saves the set; resolves to a falsy value when saving failed. */
  onUpdateSet: (questionSet: QuestionSet) => Promise<unknown>
  onDeleteSet: (questionSetId: string) => void
  onBack: () => void
  onClasses: () => void
}

/** The set being edited: heading + every question as editable fields. */
type Draft = { title: string; questions: QuestionDraft[] }

export default function ClassQuestionBank({
  cls,
  questionSets,
  subjects,
  onUpdateSet,
  onDeleteSet,
  onBack,
  onClasses,
}: Props) {
  const [subjectId, setSubjectId] = useState('')
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [titleError, setTitleError] = useState('')
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Newest question sets first.
  const visibleSets = questionSets
    .filter((set) => !subjectId || set.subjectId === subjectId)
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0))
  const setCount = visibleSets.length
  const selectedSet = questionSets.find((set) => set.id === selectedSetId)
  const editing = Boolean(draft)
  const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.name ?? 'Subject'

  const clearErrors = () => {
    setTitleError('')
    setQuestionErrors({})
    setError('')
  }

  const openSet = (set: QuestionSet, edit = false) => {
    setSelectedSetId(set.id)
    setDraft(edit ? { title: set.title, questions: set.questions.map(toDraft) } : null)
    clearErrors()
    window.scrollTo(0, 0)
  }

  const backToList = () => {
    setSelectedSetId(null)
    setDraft(null)
    clearErrors()
  }

  const cancelEdit = () => {
    if (!window.confirm('Discard your changes to this question set?')) return
    setDraft(null)
    clearErrors()
  }

  const deleteSet = (set: QuestionSet) => {
    if (!window.confirm(`Delete “${set.title}” and all its questions?`)) return
    onDeleteSet(set.id)
    if (selectedSetId === set.id) backToList()
  }

  const updateQuestion = (next: QuestionDraft) => {
    setDraft((d) => d && { ...d, questions: d.questions.map((q) => (q.id === next.id ? next : q)) })
    setQuestionErrors((e) => ({ ...e, [next.id]: '' }))
    setError('')
  }

  const removeQuestion = (id: string) => {
    setDraft((d) => d && { ...d, questions: d.questions.filter((q) => q.id !== id) })
    setError('')
  }

  const addQuestion = () => {
    const q = blankDraft()
    setDraft((d) => d && { ...d, questions: [...d.questions, q] })
    // Scroll the new, empty question into view once it has rendered.
    window.setTimeout(() => document.getElementById(`qcard-${q.id}`)?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const saveChanges = async () => {
    if (!draft || !selectedSet || saving) return
    const heading = draft.title.trim().replace(/\s+/g, ' ')
    const tErr = titleRule(heading, 'Question set heading')
    const qErrs = Object.fromEntries(draft.questions.map((q) => [q.id, questionError(q)]))
    const badCount = Object.values(qErrs).filter(Boolean).length
    setTitleError(tErr)
    setQuestionErrors(qErrs)
    if (draft.questions.length === 0) return setError('A question set must contain at least one question.')
    if (tErr || badCount) {
      setError(
        badCount
          ? `${badCount} ${badCount === 1 ? 'question needs' : 'questions need'} fixing before you can update.`
          : tErr,
      )
      const firstBad = draft.questions.find((q) => qErrs[q.id])
      if (firstBad) document.getElementById(`qcard-${firstBad.id}`)?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setSaving(true)
    const ok = await onUpdateSet({ ...selectedSet, title: heading, questions: draft.questions.map(fromDraft) })
    setSaving(false)
    // Stay in edit mode if saving fails, so the changes aren't lost.
    if (!ok) return setError('The changes could not be saved. Please try again.')
    setDraft(null)
    clearErrors()
    window.scrollTo(0, 0)
  }

  return (
    <div className="page">
      <PageHeader
        title={`${cls.label} Question Bank`}
        onBack={selectedSetId ? backToList : onBack}
        crumbs={[
          { label: 'Classes', onClick: onClasses },
          { label: cls.name, onClick: selectedSetId ? backToList : onBack },
          { label: 'Question Bank', onClick: selectedSetId ? backToList : undefined },
          ...(selectedSet ? [{ label: selectedSet.title }] : []),
        ]}
      />

      {selectedSet ? (
        <div className="option-panel question-bank">
          <div className="question-set-detail__head">
            <div className="question-set-detail__info">
              <button type="button" className="btn-link" onClick={backToList}>
                ‹ Back to Question Bank
              </button>
              {draft ? (
                <label className={`field question-set-detail__title-field${titleError ? ' has-error' : ''}`}>
                  <span>Set heading</span>
                  <input
                    maxLength={80}
                    value={draft.title}
                    onChange={(event) => {
                      setDraft((d) => d && { ...d, title: event.target.value })
                      setTitleError('')
                    }}
                  />
                  {titleError && <small className="field-error">{titleError}</small>}
                </label>
              ) : (
                <h2>{selectedSet.title}</h2>
              )}
              <p>
                {subjectName(selectedSet.subjectId)} · Created {formatCreatedDate(selectedSet.createdAt)} at{' '}
                {formatCreatedTime(selectedSet.createdAt)}
              </p>
            </div>
            <div className="question-set-detail__actions">
              {editing ? (
                <span className="qb-editing-pill">Editing</span>
              ) : (
                <>
                  <button type="button" className="btn-secondary es-btn" onClick={() => openSet(selectedSet, true)}>
                    <PencilIcon width={15} height={15} /> Edit
                  </button>
                  <button type="button" className="btn-danger-outline es-btn" onClick={() => deleteSet(selectedSet)}>
                    <TrashIcon width={15} height={15} /> Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {draft ? (
            <section className="question-bank__list">
              <div className="question-bank__draft-heading">
                <h3>Questions</h3>
                <span>
                  {draft.questions.length} {draft.questions.length === 1 ? 'question' : 'questions'} · edit any field,
                  then press Update
                </span>
              </div>
              <ol className="question-list">
                {draft.questions.map((q, i) => (
                  <EditableQuestionCard
                    key={q.id}
                    number={i + 1}
                    draft={q}
                    error={questionErrors[q.id]}
                    onChange={updateQuestion}
                    onRemove={() => removeQuestion(q.id)}
                  />
                ))}
              </ol>
              <button type="button" className="qb-add-question" onClick={addQuestion}>
                <PlusIcon width={16} height={16} /> Add Question
              </button>

              {/* Save bar stays at the bottom of the screen while editing. */}
              <div className="qb-save-bar">
                {error ? (
                  <div className="form-error" role="alert">
                    {error}
                  </div>
                ) : (
                  <span>Changes are saved only when you press Update.</span>
                )}
                <div className="qb-save-bar__actions">
                  <button type="button" className="btn-secondary" onClick={cancelEdit} disabled={saving}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary" onClick={() => void saveChanges()} disabled={saving}>
                    {saving ? 'Updating…' : 'Update Question Set'}
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="question-bank__list">
              <div className="question-bank__draft-heading">
                <h3>Questions</h3>
                <span>{selectedSet.questions.length}</span>
              </div>
              <QuestionList questions={selectedSet.questions} />
            </section>
          )}
        </div>
      ) : (
        <div className="option-panel question-bank">
          <div className="list-head">
            <div>
              <h2>Question Bank</h2>
              <p>Saved question sets for {cls.label}, organized by subject.</p>
            </div>
            <span className="count-pill">
              <ExamIcon width={16} height={16} />
              {setCount} {setCount === 1 ? 'Question Set' : 'Question Sets'}
            </span>
          </div>

          <div className="question-bank__filters question-bank__filters--single">
            <label className="field">
              <span>Subject</span>
              <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>
          </div>

          {visibleSets.length === 0 ? (
            <div className="empty-state question-bank__list">
              No saved question sets for {cls.label}{subjectId ? ' in this subject' : ''} yet. Use the Questions page to create and save one.
            </div>
          ) : (
            <div className="table-wrap question-bank__table-wrap">
              <table className="student-table es-table question-bank__table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Heading</th>
                    <th>Created</th>
                    <th>Questions</th>
                    <th className="es-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSets.map((set) => (
                    <tr key={set.id}>
                      <td>
                        <span className="class-tag">{subjectName(set.subjectId)}</span>
                      </td>
                      <td className="student-name">{set.title}</td>
                      <td className="nowrap qb-created">
                        {formatCreatedDate(set.createdAt)}
                        <small>{formatCreatedTime(set.createdAt)}</small>
                      </td>
                      <td>{set.questions.length}</td>
                      <td className="es-td-actions">
                        <div className="es-row-actions">
                          <button
                            type="button"
                            className="es-icon-btn"
                            title="View questions"
                            aria-label={`View ${set.title}`}
                            onClick={() => openSet(set)}
                          >
                            <EyeIcon width={15} height={15} />
                          </button>
                          <button
                            type="button"
                            className="es-icon-btn"
                            title="Edit question set"
                            aria-label={`Edit ${set.title}`}
                            onClick={() => openSet(set, true)}
                          >
                            <PencilIcon width={15} height={15} />
                          </button>
                          <span className="es-row-actions__sep" aria-hidden="true" />
                          <button
                            type="button"
                            className="es-icon-btn is-danger"
                            title="Delete question set"
                            aria-label={`Delete ${set.title}`}
                            onClick={() => deleteSet(set)}
                          >
                            <TrashIcon width={15} height={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatCreatedDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function formatCreatedTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
