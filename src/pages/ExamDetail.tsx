import { useState, type ReactNode } from 'react'
import type { ClassInfo } from '../data/classes'
import { examStatus, totalMarks, type Exam } from '../data/exams'
import type { Student } from '../data/students'
import type { Subject } from '../data/subjects'
import PageHeader from '../components/PageHeader'
import ConductExamModal from '../components/ConductExamModal'
import ExamStudentsPanel from '../components/ExamStudentsPanel'
import {
  BookIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  ExamIcon,
  LinkIcon,
  TrendIcon,
  UsersIcon,
} from '../components/Icons'
import { QuestionList } from '../components/QuestionEditor'
import { formatDate, formatTimeRange } from '../utils/format'
import ExamStatusPill from '../components/ExamStatusPill'
import { examLink } from '../utils/examLink'
import { grade, passMarkOf } from '../utils/score'

type Props = {
  cls: ClassInfo
  exam: Exam
  subject: Subject | undefined
  students: Student[]
  onBack: () => void
  onClassMenu: () => void
  onClasses: () => void
  onSubmitResult: (studentId: string, answers: Record<string, number>) => void
  onSetStudents: (studentIds: string[]) => void
  onResetExamPassword: (studentId: string) => void
}

type Tab = 'students' | 'questions' | 'results'

export default function ExamDetail(props: Props) {
  const { cls, exam, subject, students, onBack, onClassMenu, onClasses, onSubmitResult, onSetStudents, onResetExamPassword } =
    props
  const addedCount = Object.keys(exam.access ?? {}).length
  // Every exam opens on Add Students.
  const [tab, setTab] = useState<Tab>('students')
  const [reviewing, setReviewing] = useState<Student | null>(null)

  const subjectName = subject?.name ?? 'Unknown subject'
  // Results only cover students the admin added (plus anyone who submitted before being removed).
  const resultStudents = students.filter((s) => exam.access?.[s.id] || exam.results[s.id])
  const attempted = resultStudents.filter((s) => exam.results[s.id]).length
  const maxMarks = totalMarks(exam)

  const tabs: { key: Tab; label: string; count: string; icon: ReactNode }[] = [
    { key: 'questions', label: 'Questions', count: String(exam.questions.length), icon: <BookIcon width={16} height={16} /> },
    {
      key: 'students',
      label: 'Add Students',
      count: `${addedCount}/${students.length}`,
      icon: <UsersIcon width={16} height={16} />,
    },
    {
      key: 'results',
      label: 'Conduct & Results',
      count: `${attempted}/${resultStudents.length}`,
      icon: <TrendIcon width={16} height={16} />,
    },
  ]

  return (
    <div className="page">
      <PageHeader
        title={exam.name}
        onBack={onBack}
        crumbs={[
          { label: 'Classes', onClick: onClasses },
          { label: cls.name, onClick: onClassMenu },
          { label: 'Exams', onClick: onBack },
          { label: exam.name },
        ]}
      />

      <div className="option-panel ed">
        <section className="ed-summary">
          <div className="ed-summary__top">
            <div>
              <div className="ed-summary__tags">
                <span className="class-tag">{subjectName}</span>
                <span className="ed-summary__class">{cls.label}</span>
              </div>
              <h2>{exam.name}</h2>
            </div>
            <ExamStatusPill status={examStatus(exam)} />
          </div>

          <div className="ed-facts">
            <Fact icon={<CalendarIcon width={18} height={18} />} label="Date" value={formatDate(exam.date)} />
            <Fact
              icon={<ClockIcon width={18} height={18} />}
              label="Time"
              value={formatTimeRange(exam.startTime, exam.endTime)}
            />
            <Fact icon={<ExamIcon width={18} height={18} />} label="Questions" value={String(exam.questions.length)} />
            <Fact icon={<TrendIcon width={18} height={18} />} label="Max Marks" value={String(maxMarks)} />
            <Fact icon={<CheckIcon width={18} height={18} />} label="Pass Mark" value={`${passMarkOf(exam)}%`} />
          </div>

          <ExamLinkBox exam={exam} />
        </section>

        <div className="ed-tabs" role="tablist" aria-label="Exam sections">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`ed-tab${tab === t.key ? ' is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.icon}
              <span>{t.label}</span>
              <span className="ed-tab__count">{t.count}</span>
            </button>
          ))}
        </div>

        {tab === 'students' ? (
          <ExamStudentsPanel
            exam={exam}
            classLabel={cls.label}
            students={students}
            onSave={onSetStudents}
            onResetPassword={onResetExamPassword}
          />
        ) : tab === 'questions' ? (
          <QuestionsTab exam={exam} />
        ) : (
          <ResultsTab
            exam={exam}
            students={resultStudents}
            onReview={setReviewing}
            onAddStudents={() => setTab('students')}
          />
        )}
      </div>

      {reviewing && exam.results[reviewing.id] && (
        <ConductExamModal
          exam={exam}
          subjectName={subjectName}
          student={reviewing}
          result={exam.results[reviewing.id]}
          onClose={() => setReviewing(null)}
          onSubmit={(answers) => onSubmitResult(reviewing.id, answers)}
        />
      )}
    </div>
  )
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="ed-fact">
      <span className="ed-fact__icon">{icon}</span>
      <span className="ed-fact__body">
        <span>{label}</span>
        <strong>{value}</strong>
      </span>
    </div>
  )
}

/** Shareable link students open to attend the exam. */
function ExamLinkBox({ exam }: { exam: Exam }) {
  const [copied, setCopied] = useState(false)

  if (exam.questions.length === 0) {
    return (
      <div className="exam-link is-pending">
        <LinkIcon width={18} height={18} />
        <span>This exam has no questions, so no link was generated.</span>
      </div>
    )
  }

  const url = examLink(exam.code)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Clipboard blocked — select the text so it can be copied manually.
      document.getElementById('exam-link-input')?.focus()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="ed-link">
      <div className="ed-link__label">
        <LinkIcon width={16} height={16} />
        <div>
          <strong>Exam link</strong>
          <span>Share with the added students. They log in with their exam username and password.</span>
        </div>
      </div>
      <div className="ed-link__row">
        <input
          id="exam-link-input"
          className="exam-link__url"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          aria-label="Exam link"
        />
        <button type="button" className="btn-primary ed-link__btn" onClick={copy}>
          <CopyIcon width={15} height={15} />
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <a className="btn-secondary ed-link__btn" href={url} target="_blank" rel="noreferrer">
          Open
        </a>
      </div>
    </div>
  )
}

/* ---------------- Questions (view only — questions are written in Create MCQ Exam) ---------------- */

function QuestionsTab({ exam }: { exam: Exam }) {
  return (
    <div className="tab-panel">
      {exam.questions.length === 0 ? (
        <div className="empty-state">This exam has no questions.</div>
      ) : (
        <QuestionList questions={exam.questions} />
      )}
    </div>
  )
}

/* ---------------- Results ---------------- */

function ResultsTab({
  exam,
  students,
  onReview,
  onAddStudents,
}: {
  exam: Exam
  /** Only the students added to the exam. */
  students: Student[]
  onReview: (s: Student) => void
  onAddStudents: () => void
}) {
  if (exam.questions.length === 0) {
    return (
      <div className="tab-panel">
        <div className="empty-state">
          This exam has no questions, so it can’t be conducted. Create a new test with questions from Create Test.
        </div>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="tab-panel">
        <div className="es-empty">
          <span className="es-empty__icon">
            <UsersIcon width={26} height={26} />
          </span>
          <strong>No students added to this exam</strong>
          <p>Results appear here once you add students and they submit the exam.</p>
          <button type="button" className="btn-primary es-btn" onClick={onAddStudents}>
            Go to Add Students
          </button>
        </div>
      </div>
    )
  }

  const grades = students.filter((s) => exam.results[s.id]).map((s) => grade(exam, exam.results[s.id].answers))
  const avg = grades.length ? Math.round(grades.reduce((t, g) => t + g.percent, 0) / grades.length) : 0
  const passed = grades.filter((g) => g.passed).length
  const highest = grades.reduce((m, g) => Math.max(m, g.score), 0)
  const max = totalMarks(exam)

  return (
    <div className="tab-panel">
      <div className="stat-grid">
        <Stat label="Attempted" value={`${grades.length} / ${students.length}`} />
        <Stat label="Average" value={grades.length ? `${avg}%` : '—'} />
        <Stat label="Passed" value={grades.length ? `${passed} / ${grades.length}` : '—'} />
        <Stat label="Highest Score" value={grades.length ? `${highest} / ${max}` : '—'} />
      </div>

      <div className="table-wrap es-table-wrap">
        <table className="student-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Correct</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Result</th>
              <th title="Times the student switched away from the test screen">Left Screen</th>
              <th>Answers</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const result = exam.results[s.id]
              const g = result ? grade(exam, result.answers) : null
              return (
                <tr key={s.id}>
                  <td className="roll">{String(s.rollNo).padStart(2, '0')}</td>
                  <td className="student-name">{s.name}</td>
                  <td>{g ? `${g.correct} / ${g.total}` : '—'}</td>
                  <td className="roll">{g ? `${g.score} / ${g.max}` : '—'}</td>
                  <td>{g ? `${g.percent}%` : '—'}</td>
                  <td>
                    {g ? (
                      <span className={`result-pill${g.passed ? ' is-pass' : ' is-fail'}`}>
                        {g.passed ? 'Pass' : 'Fail'}
                      </span>
                    ) : (
                      <span className="status-pill">Not attempted</span>
                    )}
                  </td>
                  <td>
                    {!result ? (
                      <span className="muted-text">—</span>
                    ) : result.leftScreenCount ? (
                      <span
                        className="left-screen-pill"
                        title="Switched to another tab or app, or exited full screen, during the test"
                      >
                        {result.leftScreenCount} {result.leftScreenCount === 1 ? 'time' : 'times'}
                      </span>
                    ) : (
                      <span className="muted-text">None</span>
                    )}
                  </td>
                  <td>
                    {result ? (
                      <button type="button" className="btn-link" onClick={() => onReview(s)}>
                        View Answers
                      </button>
                    ) : (
                      <span className="muted-text">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
