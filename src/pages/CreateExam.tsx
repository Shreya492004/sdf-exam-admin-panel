import { useState, type ReactNode } from 'react'
import { classes } from '../data/classes'
import { makeExamCode, totalMarks, type Exam, type NewExam, type QuestionSet } from '../data/exams'
import type { Subject } from '../data/subjects'
import PageHeader from '../components/PageHeader'
import TimePicker from '../components/TimePicker'
import QuestionBankPicker from '../components/QuestionBankPicker'
import QuestionsModal from '../components/QuestionsModal'
import { examDate, passMark as passMarkError, title as titleRule } from '../utils/validate'
import Portal from '../components/Portal'
import { CheckIcon, LinkIcon } from '../components/Icons'
import { formatDate, formatTimeRange, todayISO } from '../utils/format'
import { examLink } from '../utils/examLink'
import { PASS_PERCENT } from '../utils/score'

type Props = {
  /** Class preselected in the Class dropdown. */
  defaultClassId?: string
  subjectsByClass: Record<string, Subject[]>
  questionBank: QuestionSet[]
  onManageSubjects: (classId: string) => void
  /** Saves the exam under `classId` with the given link code and returns it. */
  onCreate: (classId: string, exam: NewExam, code: string) => Promise<Exam | undefined>
  onOpenExam: (classId: string, examId: string) => void
}

const emptyDetails = (classId: string) => ({
  classId,
  name: '',
  subjectId: '',
  date: todayISO(),
  startTime: '',
  endTime: '',
  passPercent: String(PASS_PERCENT),
})
type Details = ReturnType<typeof emptyDetails>

/** Page to set up an MCQ exam using questions selected from the question bank. */
export default function CreateExam({
  defaultClassId,
  subjectsByClass,
  questionBank,
  onManageSubjects,
  onCreate,
  onOpenExam,
}: Props) {
  const [details, setDetails] = useState(() => emptyDetails(defaultClassId ?? classes[0].id))
  const [selectedQuestionSetIds, setSelectedQuestionSetIds] = useState<string[]>([])
  const [previewSet, setPreviewSet] = useState<QuestionSet | null>(null)
  // The link code is generated up front so the link can be shown while the exam is being written.
  const [code, setCode] = useState(makeExamCode)
  const [created, setCreated] = useState<Exam | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const examClass = classes.find((c) => c.id === details.classId) ?? classes[0]
  const subjects = subjectsByClass[details.classId] ?? []
  const subject = subjects.find((s) => s.id === details.subjectId)
  const availableQuestionSets = questionBank.filter(
    (set) => set.classId === details.classId && set.subjectId === details.subjectId,
  )
  const selectedQuestionSets = availableQuestionSets.filter((set) => selectedQuestionSetIds.includes(set.id))
  const questions = selectedQuestionSets.flatMap((set) => set.questions)
  const total = totalMarks({ questions })
  // Marks a student needs to pass, rounded up (e.g. 35% of 10 marks → 4).
  const passScore = Math.ceil((Number(details.passPercent) / 100) * total * 2) / 2
  const timeSet = Boolean(details.startTime && details.endTime)
  const timeValid = timeSet && details.endTime > details.startTime
  const durationLabel = timeValid ? formatDuration(details.startTime, details.endTime) : ''

  // Field errors. Missing values are only flagged after "Create Exam" is pressed;
  // wrong values (e.g. a past date) are flagged as soon as they're entered.
  const now = new Date()
  const nowHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const fieldErrors = {
    subject: details.subjectId ? '' : 'Select a subject.',
    name: titleRule(details.name, 'Test name'),
    date: examDate(details.date),
    time: !timeSet
      ? 'Set both the start and end time.'
      : !timeValid
        ? 'End time must be after start time.'
        : details.date === todayISO() && details.startTime < nowHM
          ? 'Start time has already passed today.'
          : '',
    questions: questions.length ? '' : 'Select at least one question bank topic.',
    passPercent: passMarkError(details.passPercent),
  }
  const shown = {
    subject: submitted ? fieldErrors.subject : '',
    name: submitted || details.name.trim() ? fieldErrors.name : '',
    date: fieldErrors.date,
    time: submitted || timeSet ? fieldErrors.time : '',
    questions: submitted ? fieldErrors.questions : '',
    passPercent: fieldErrors.passPercent,
  }

  const checks = [
    { label: 'Class and subject selected', done: !fieldErrors.subject },
    { label: 'Test name entered', done: !fieldErrors.name },
    { label: 'Pass mark set', done: !fieldErrors.passPercent },
    { label: 'Date, start and end time set', done: !fieldErrors.date && !fieldErrors.time },
    { label: 'At least one question bank topic selected', done: !fieldErrors.questions },
  ]

  const set = (key: keyof Details, value: string) => {
    // Subjects belong to a class, so changing the class clears the chosen subject.
    setDetails((d) => ({ ...d, [key]: value, ...(key === 'classId' ? { subjectId: '' } : {}) }))
    if (key === 'classId' || key === 'subjectId') setSelectedQuestionSetIds([])
    setError('')
  }

  const create = async () => {
    if (saving) return
    setSubmitted(true)
    const firstError = Object.values(fieldErrors).find(Boolean)
    if (firstError) return setError(`Please fix: ${firstError}`)
    setSaving(true)
    const exam = await onCreate(
      details.classId,
      {
        name: details.name.trim(),
        subjectId: details.subjectId,
        date: details.date,
        startTime: details.startTime,
        endTime: details.endTime,
        questions,
        passPercent: Number(details.passPercent),
      },
      code,
    )
    setSaving(false)
    if (!exam) return setError('The test could not be saved. Please try again.')
    setCreated(exam)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reset = () => {
    setDetails(emptyDetails(details.classId))
    setSelectedQuestionSetIds([])
    setCode(makeExamCode())
    setCreated(null)
    setSubmitted(false)
    setError('')
  }

  const clearForm = () => {
    if (questions.length === 0 || window.confirm('Clear this test and its selected questions?')) reset()
  }

  const header = (
    <PageHeader title="Create Test" crumbs={[{ label: 'Create Test' }]} />
  )

  /* ---------- Builder ---------- */
  return (
    <div className="page">
      {header}

      <div className="create-layout">
        <div className="create-main">
          {/* 1. Exam details */}
          <FormCard
            step={1}
            title="Test Details"
            subtitle="Choose the class and subject, name the test and set when students can attend."
          >
            <div className="details-grid">
              <label className="field">
                <span>Class</span>
                <select value={details.classId} onChange={(e) => set('classId', e.target.value)}>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className={`field${shown.subject ? ' has-error' : ''}`}>
                <label htmlFor="ce-subject">
                  <span>Subject</span>
                </label>
                <select
                  id="ce-subject"
                  value={details.subjectId}
                  onChange={(e) => set('subjectId', e.target.value)}
                  disabled={subjects.length === 0}
                  aria-invalid={Boolean(shown.subject)}
                >
                  <option value="" disabled>
                    {subjects.length ? 'Select subject' : 'No subjects in this class'}
                  </option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {shown.subject && <small className="field-error">{shown.subject}</small>}
              </div>
              <label className={`field${shown.name ? ' has-error' : ''}`}>
                <span>Test Name</span>
                <input
                  autoFocus
                  maxLength={80}
                  value={details.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Science Unit Test 2"
                  aria-invalid={Boolean(shown.name)}
                />
                {shown.name && <small className="field-error">{shown.name}</small>}
              </label>
              <label className={`field${shown.passPercent ? ' has-error' : ''}`}>
                <span>Pass Mark</span>
                <div className="suffix-input">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    step={1}
                    value={details.passPercent}
                    onChange={(e) => set('passPercent', e.target.value)}
                    aria-invalid={Boolean(shown.passPercent)}
                    aria-describedby="ce-pass-hint"
                  />
                  <span aria-hidden="true">%</span>
                </div>
                {shown.passPercent ? (
                  <small className="field-error">{shown.passPercent}</small>
                ) : (
                  <small className="field__hint" id="ce-pass-hint">
                    {total
                      ? `Students need ${passScore} of ${total} marks to pass.`
                      : 'Percentage of total marks needed to pass.'}
                  </small>
                )}
              </label>
            </div>

            <div className="schedule">
              <div className="schedule__head">
                <h4>Test Schedule</h4>
                {timeValid ? (
                  <span className="schedule__chip">
                    {formatTimeRange(details.startTime, details.endTime)} · {durationLabel}
                  </span>
                ) : shown.time ? (
                  <span className="schedule__chip is-error">{shown.time}</span>
                ) : (
                  <span className="schedule__chip is-muted">Not set yet</span>
                )}
              </div>

              <div className="schedule__grid">
                <label className={`field schedule__date${shown.date ? ' has-error' : ''}`}>
                  <span>Test Date</span>
                  <input
                    type="date"
                    min={todayISO()}
                    value={details.date}
                    onChange={(e) => set('date', e.target.value)}
                    aria-invalid={Boolean(shown.date)}
                  />
                  {shown.date && <small className="field-error">{shown.date}</small>}
                </label>
                <div className="schedule__times">
                  <div className="field">
                    <span>Start Time</span>
                    <TimePicker
                      label="Start time"
                      value={details.startTime}
                      onChange={(v) => set('startTime', v)}
                    />
                  </div>
                  <span className="schedule__arrow" aria-hidden="true">
                    →
                  </span>
                  <div className="field">
                    <span>End Time</span>
                    <TimePicker
                      label="End time"
                      value={details.endTime}
                      onChange={(v) => set('endTime', v)}
                      invalid={Boolean(shown.time)}
                    />
                  </div>
                </div>
              </div>

              <p className="time-hint">
                Students can only attend between the start and end time. When the end time is reached, their test is
                submitted automatically.
              </p>
            </div>

            {subjects.length === 0 && (
              <div className="notice create-notice">
                {examClass.label} has no subjects yet.{' '}
                <button type="button" className="btn-link" onClick={() => onManageSubjects(details.classId)}>
                  Add subjects
                </button>{' '}
                to create a test for it.
              </div>
            )}
          </FormCard>

          {/* 2. Question bank topics */}
          <FormCard
            step={2}
            title="Question Bank"
            subtitle={
              subject
                ? `Pick one or more ${subject.name} topics for ${examClass.label}. Recent topics are listed first — type to search.`
                : 'Choose a class and subject first, then pick topics from its question bank.'
            }
          >
            <QuestionBankPicker
              sets={availableQuestionSets}
              selectedIds={selectedQuestionSetIds}
              onChange={(ids) => {
                setSelectedQuestionSetIds(ids)
                setError('')
              }}
              onPreview={setPreviewSet}
              disabledReason={subject ? undefined : 'Select a subject to search its question bank'}
            />
            {shown.questions && <small className="field-error">{shown.questions}</small>}
          </FormCard>
        </div>

        {/* Summary, link and create button — stays in view while scrolling */}
        <aside className="create-aside">
          <div className="summary-card">
            <h3>Test Summary</h3>
            <dl className="summary-list">
              <SummaryRow label="Class" value={examClass.label} />
              <SummaryRow label="Subject" value={subject?.name} />
              <SummaryRow label="Test" value={details.name.trim()} />
              <SummaryRow label="Date" value={details.date ? formatDate(details.date) : undefined} />
              <SummaryRow label="Time" value={timeValid ? formatTimeRange(details.startTime, details.endTime) : undefined} />
              <SummaryRow label="Questions" value={String(questions.length)} />
              <SummaryRow label="Total Marks" value={String(total)} />
              <SummaryRow label="Pass Mark" value={fieldErrors.passPercent ? undefined : `${Number(details.passPercent)}% (${passScore} of ${total} marks)`} />
            </dl>

            <div className="summary-section">
              <h4>
                <LinkIcon width={15} height={15} /> Test Link
              </h4>
              <LinkField url={examLink(code)} active={false} />
              <p className="summary-hint">This link becomes active as soon as you create the test.</p>
            </div>

            <div className="summary-section">
              <h4>Ready to create</h4>
              <ul className="checklist">
                {checks.map((c) => (
                  <li key={c.label} className={c.done ? 'is-done' : ''}>
                    <span className="checklist__mark">{c.done ? <CheckIcon width={12} height={12} /> : null}</span>
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="summary-actions">
              <button type="button" className="btn-primary" onClick={() => void create()} disabled={saving}>
                {saving ? 'Creating…' : 'Create Test'}
              </button>
              <button type="button" className="btn-secondary" onClick={clearForm}>
                Clear Form
              </button>
            </div>
          </div>
        </aside>
      </div>

      {previewSet && (
        <QuestionsModal
          title={previewSet.title}
          subtitle={`${examClass.label}${subject ? ` · ${subject.name}` : ''}`}
          questions={previewSet.questions}
          onClose={() => setPreviewSet(null)}
        />
      )}

      {/* After creating: a small popup with the exam link. Closing it starts a fresh form. */}
      {created && (
        <Portal>
          <div className="modal-backdrop" onClick={reset}>
            <div
              className="modal created-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="exam-created-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="created-modal__icon">
                <CheckIcon width={26} height={26} />
              </div>
              <h3 id="exam-created-title">Test created</h3>
              <p>
                <strong>{created.name}</strong> · {examClass.label} · {subject?.name ?? ''}
                <br />
                {formatDate(created.date)}, {formatTimeRange(created.startTime, created.endTime)} ·{' '}
                {created.questions.length} questions · {totalMarks(created)} marks
              </p>
              <LinkField url={examLink(created.code)} active />
              <p className="created-modal__hint">
                Next, click <strong>View Test</strong> and open the <strong>Add Students</strong> tab to choose students
                and generate their logins.
              </p>
              <div className="created-modal__actions">
                <button type="button" className="btn-secondary" onClick={() => onOpenExam(details.classId, created.id)}>
                  View Test
                </button>
                <button type="button" className="btn-primary" onClick={reset}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

/* ---------------- Pieces ---------------- */

function FormCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: number
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="form-card">
      <header className="form-card__head">
        <span className="form-card__step">{step}</span>
        <div className="form-card__titles">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </header>
      <div className="form-card__body">{children}</div>
    </section>
  )
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className={value ? '' : 'is-empty'}>{value || 'Not set'}</dd>
    </>
  )
}

/** Read-only link with copy / open. Inactive links show a "pending" badge instead. */
function LinkField({ url, active }: { url: string; active: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — the link is selectable in the box.
    }
  }

  return (
    <div className={`link-field${active ? ' is-active' : ''}`}>
      <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Test link" />
      {active ? (
        <>
          <button type="button" className="btn-small" onClick={copy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <a className="btn-small btn-outline" href={url} target="_blank" rel="noreferrer">
            Open
          </a>
        </>
      ) : (
        <span className="link-field__badge">Pending</span>
      )}
    </div>
  )
}

/** "09:00", "10:30" → "1 hr 30 min" */
function formatDuration(start: string, end: string) {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const mins = toMin(end) - toMin(start)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`
}
