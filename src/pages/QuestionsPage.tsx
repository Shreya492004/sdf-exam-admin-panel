import { useState } from 'react'
import { classes } from '../data/classes'
import type { Question, QuestionSet } from '../data/exams'
import type { Subject } from '../data/subjects'
import type { AddSubjectResult } from '../data/store'
import { ExamIcon } from '../components/Icons'
import PageHeader from '../components/PageHeader'
import QuickAddSubject from '../components/QuickAddSubject'
import { QuestionBuilder, QuestionList } from '../components/QuestionEditor'
import { title as titleRule } from '../utils/validate'

type Props = {
  subjectsByClass: Record<string, Subject[]>
  onSaveSet: (classId: string, subjectId: string, title: string, questions: Question[]) => Promise<QuestionSet | undefined>
  onAddSubject: (classId: string, name: string) => Promise<AddSubjectResult>
}

type Field = 'subject' | 'title' | 'questions'

export default function QuestionsPage({ subjectsByClass, onSaveSet, onAddSubject }: Props) {
  const [classId, setClassId] = useState(classes[0].id)
  const [subjectId, setSubjectId] = useState('')
  const [title, setTitle] = useState('')
  const [draftQuestions, setDraftQuestions] = useState<Question[]>([])
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const subjects = subjectsByClass[classId] ?? []
  const selectedClass = classes.find((item) => item.id === classId)
  const selectedSubject = subjects.find((subject) => subject.id === subjectId)

  const changeClass = (nextClassId: string) => {
    setClassId(nextClassId)
    setSubjectId('')
    setErrors({})
    setError('')
  }

  const saveSet = async () => {
    if (saving) return
    const heading = title.trim().replace(/\s+/g, ' ')
    const found = {
      subject: subjectId ? '' : 'Select a subject for this question set.',
      title: titleRule(heading, 'Question set heading'),
      questions: draftQuestions.length ? '' : 'Add at least one question before saving.',
    }
    setErrors(found)
    const first = Object.values(found).find(Boolean)
    if (first) return setError(first)

    setSaving(true)
    const set = await onSaveSet(classId, subjectId, heading, draftQuestions)
    setSaving(false)
    // Keep the draft when saving fails, so nothing is lost.
    if (!set) return setError('The question set could not be saved. Your draft is still here — please try again.')
    setTitle('')
    setDraftQuestions([])
    setError('')
    setSaved(`“${heading}” saved to ${selectedClass?.label} · ${selectedSubject?.name} Question Bank.`)
  }

  return (
    <div className="page">
      <PageHeader title="Questions" crumbs={[{ label: 'Questions' }]} />

      <div className="option-panel question-bank">
        <div className="list-head">
          <div>
            <h2>Create a Question Set</h2>
            <p>Add as many questions as you need. They stay here as a draft until you save the set.</p>
          </div>
          <span className="count-pill">
            <ExamIcon width={16} height={16} />
            {draftQuestions.length} {draftQuestions.length === 1 ? 'Draft Question' : 'Draft Questions'}
          </span>
        </div>

        <div className="question-bank__filters">
          <label className="field">
            <span>Class</span>
            <select
              value={classId}
              disabled={draftQuestions.length > 0}
              onChange={(event) => changeClass(event.target.value)}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
          <div className={`field${errors.subject ? ' has-error' : ''}`}>
            <label htmlFor="qs-subject">
              <span>Subject</span>
            </label>
            <select
              id="qs-subject"
              value={subjectId}
              disabled={subjects.length === 0 || draftQuestions.length > 0}
              onChange={(event) => {
                setSubjectId(event.target.value)
                setErrors((e) => ({ ...e, subject: '' }))
                setError('')
              }}
              aria-invalid={Boolean(errors.subject)}
            >
              <option value="">{subjects.length ? 'Select subject' : 'No subjects in this class'}</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
            {errors.subject && <small className="field-error">{errors.subject}</small>}
            {draftQuestions.length === 0 && (
              <QuickAddSubject
                classLabel={selectedClass?.label ?? 'this class'}
                subjects={subjects}
                onAdd={(name) => onAddSubject(classId, name)}
                onAdded={(subject) => {
                  setSubjectId(subject.id)
                  setErrors((e) => ({ ...e, subject: '' }))
                }}
              />
            )}
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="notice question-bank__notice">
            {selectedClass?.label ?? 'This class'} has no subjects yet. Use “Add subject” above to create one, then
            add questions.
          </div>
        ) : (
          <>
            <div className="question-bank__builder">
              <label className={`field${errors.title ? ' has-error' : ''}`}>
                <span>Question Set Heading</span>
                <input
                  value={title}
                  maxLength={80}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    setErrors((e) => ({ ...e, title: '' }))
                    setError('')
                  }}
                  placeholder="e.g. Chapter 1 Revision"
                  aria-label="Question set heading"
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && <small className="field-error">{errors.title}</small>}
              </label>
              <p className="summary-hint">
                {selectedSubject
                  ? `Questions will be saved under ${selectedClass?.label} · ${selectedSubject.name} with the save date and time.`
                  : 'Select a subject, then add questions to this draft set.'}
              </p>
              {subjectId && (
                <QuestionBuilder
                  number={draftQuestions.length + 1}
                  onAdd={(question) => {
                    setDraftQuestions((current) => [...current, question])
                    setErrors((e) => ({ ...e, questions: '' }))
                    setError('')
                    setSaved('')
                  }}
                />
              )}
            </div>

            <section className="question-bank__list">
              <div className="question-bank__draft-heading">
                <h3>Draft Questions</h3>
                <span>{draftQuestions.length} {draftQuestions.length === 1 ? 'question' : 'questions'}</span>
              </div>
              {draftQuestions.length === 0 ? (
                <div className="empty-state">Questions you add will appear here until you save the set.</div>
              ) : (
                <>
                  <QuestionList
                    questions={draftQuestions}
                    onRemove={(id) => setDraftQuestions((current) => current.filter((question) => question.id !== id))}
                  />
                </>
              )}
              <button
                type="button"
                className="btn-primary question-bank__save"
                onClick={() => void saveSet()}
                disabled={draftQuestions.length === 0 || saving}
              >
                {saving ? 'Saving…' : 'Save Question Set'}
              </button>
              {error && <div className="form-error">{error}</div>}
              {saved && <div className="notice question-bank__saved">{saved}</div>}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
