import type { ReactNode } from 'react'
import { classes } from '../data/classes'
import { examStatus, examWindow, type Exam, type QuestionSet } from '../data/exams'
import type { Student } from '../data/students'
import type { Subject } from '../data/subjects'
import type { PageKey } from '../components/Sidebar'
import type { ClassTarget } from './ClassesPage'
import PageHeader from '../components/PageHeader'
import ExamStatusPill from '../components/ExamStatusPill'
import { BookIcon, CalendarIcon, ClassIcon, ClockIcon, ExamIcon, PlusIcon, TrendIcon, UsersIcon } from '../components/Icons'
import { formatDate, formatTimeRange } from '../utils/format'
import { grade } from '../utils/score'

type Props = {
  studentsByClass: Record<string, Student[]>
  examsByClass: Record<string, Exam[]>
  subjectsByClass: Record<string, Subject[]>
  questionBank: QuestionSet[]
  onNavigate: (page: PageKey) => void
  onOpenClass: (target: ClassTarget) => void
}

export default function Dashboard({
  studentsByClass,
  examsByClass,
  subjectsByClass,
  questionBank,
  onNavigate,
  onOpenClass,
}: Props) {
  const now = new Date()

  const allExams = classes.flatMap((cls) =>
    (examsByClass[cls.id] ?? []).map((exam) => ({
      exam,
      cls,
      subject: (subjectsByClass[cls.id] ?? []).find((s) => s.id === exam.subjectId)?.name ?? '—',
      status: examStatus(exam, now),
    })),
  )
  const totalStudents = classes.reduce((t, c) => t + (studentsByClass[c.id] ?? []).length, 0)
  const liveCount = allExams.filter((e) => e.status === 'live').length
  const upcomingCount = allExams.filter((e) => e.status === 'upcoming').length

  // Every submitted result, graded.
  const results = allExams.flatMap(({ exam, cls }) =>
    Object.entries(exam.results).map(([studentId, result]) => ({
      exam,
      cls,
      student: (studentsByClass[cls.id] ?? []).find((s) => s.id === studentId),
      submittedAt: result.submittedAt,
      grade: grade(exam, result.answers),
    })),
  )

  // Live first, then upcoming by start time.
  const startOf = (exam: Exam) => examWindow(exam)?.start.getTime() ?? new Date(exam.date).getTime()
  const upcoming = allExams
    .filter((e) => e.status === 'live' || e.status === 'upcoming')
    .sort((a, b) => (a.status === b.status ? startOf(a.exam) - startOf(b.exam) : a.status === 'live' ? -1 : 1))
    .slice(0, 6)

  const recent = [...results].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 6)

  return (
    <div className="page">
      <PageHeader title="Dashboard" crumbs={[{ label: 'Dashboard' }]} />

      <div className="dash">
        <section className="dash-welcome">
          <div>
            <h2>Welcome back, Administrator</h2>
            <p>
              {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {liveCount > 0 && (
                <>
                  {' · '}
                  <strong>
                    {liveCount} {liveCount === 1 ? 'exam is' : 'exams are'} live now
                  </strong>
                </>
              )}
            </p>
          </div>
          <div className="dash-welcome__actions">
            <button type="button" className="btn-primary" onClick={() => onNavigate('create-exam')}>
              <PlusIcon width={16} height={16} />
              Create Test
            </button>
            <button type="button" className="btn-secondary" onClick={() => onNavigate('questions')}>
              <BookIcon width={16} height={16} />
              Add Questions
            </button>
            <button type="button" className="btn-secondary" onClick={() => onNavigate('students')}>
              <UsersIcon width={16} height={16} />
              Students
            </button>
          </div>
        </section>

        <section className="dash-stats">
          <StatCard
            tone="blue"
            icon={<UsersIcon width={20} height={20} />}
            label="Total Students"
            value={totalStudents}
            sub={`Across ${classes.length} classes`}
            onClick={() => onNavigate('students')}
          />
          <StatCard
            tone="violet"
            icon={<ExamIcon width={20} height={20} />}
            label="MCQ Exams"
            value={allExams.length}
            sub={`${liveCount} live · ${upcomingCount} upcoming`}
            onClick={() => onNavigate('classes')}
          />
          <StatCard
            tone="amber"
            icon={<BookIcon width={20} height={20} />}
            label="Question Sets"
            value={questionBank.length}
            sub="Saved in question banks"
            onClick={() => onNavigate('questions')}
          />
        </section>

        <div className="dash-row">
          <section className="dash-card">
            <header className="dash-card__head">
              <h3>
                <ClockIcon width={18} height={18} />
                Live &amp; Upcoming Exams
              </h3>
              <button type="button" className="btn-link" onClick={() => onNavigate('create-exam')}>
                + New exam
              </button>
            </header>
            {upcoming.length === 0 ? (
              <div className="dash-empty">No live or upcoming exams. Create one to get started.</div>
            ) : (
              <ul className="dash-list">
                {upcoming.map(({ exam, cls, subject, status }) => (
                  <li key={`${cls.id}-${exam.id}`}>
                    <button
                      type="button"
                      className="dash-list__row"
                      onClick={() => onOpenClass({ classId: cls.id, view: 'exams', examId: exam.id })}
                    >
                      <span className="dash-date">
                        <strong>{new Date(exam.date).getDate()}</strong>
                        <span>{new Date(exam.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                      </span>
                      <span className="dash-list__main">
                        <strong>{exam.name}</strong>
                        <span>
                          {cls.label} · {subject} · {formatTimeRange(exam.startTime, exam.endTime)}
                        </span>
                      </span>
                      <ExamStatusPill status={status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dash-card">
            <header className="dash-card__head">
              <h3>
                <TrendIcon width={18} height={18} />
                Recent Results
              </h3>
            </header>
            {recent.length === 0 ? (
              <div className="dash-empty">No exam results yet. They appear here as students submit.</div>
            ) : (
              <ul className="dash-list">
                {recent.map((r) => (
                  <li key={`${r.exam.id}-${r.student?.id ?? r.submittedAt}`}>
                    <button
                      type="button"
                      className="dash-list__row"
                      onClick={() => onOpenClass({ classId: r.cls.id, view: 'exams', examId: r.exam.id })}
                    >
                      <span className="dash-list__main">
                        <strong>{r.student?.name ?? 'Student'}</strong>
                        <span>
                          {r.exam.name} · {r.cls.label} · {formatDate(r.submittedAt)}
                        </span>
                      </span>
                      <span className="dash-score">
                        <strong>{r.grade.percent}%</strong>
                        <span className={`result-pill${r.grade.passed ? ' is-pass' : ' is-fail'}`}>
                          {r.grade.passed ? 'Pass' : 'Fail'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="dash-card">
          <header className="dash-card__head">
            <h3>
              <ClassIcon width={18} height={18} />
              Classes at a Glance
            </h3>
            <button type="button" className="btn-link" onClick={() => onNavigate('classes')}>
              View all classes
            </button>
          </header>
          <div className="table-wrap">
            <table className="student-table dash-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Students</th>
                  <th>Subjects</th>
                  <th>Exams</th>
                  <th>Question Sets</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls.id}>
                    <td className="student-name">{cls.label}</td>
                    <td>{(studentsByClass[cls.id] ?? []).length}</td>
                    <td>{(subjectsByClass[cls.id] ?? []).length}</td>
                    <td>{(examsByClass[cls.id] ?? []).length}</td>
                    <td>{questionBank.filter((s) => s.classId === cls.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="dash-foot">
          <CalendarIcon width={14} height={14} />
          Click any exam or result to open it.
        </p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
  onClick,
}: {
  icon: ReactNode
  label: string
  value: number | string
  sub: string
  tone: 'blue' | 'violet' | 'amber' | 'green'
  onClick?: () => void
}) {
  const body = (
    <>
      <span className={`dash-stat__icon is-${tone}`}>{icon}</span>
      <span className="dash-stat__body">
        <span className="dash-stat__label">{label}</span>
        <strong className="dash-stat__value">{value}</strong>
        <span className="dash-stat__sub">{sub}</span>
      </span>
    </>
  )
  return onClick ? (
    <button type="button" className="dash-stat is-clickable" onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="dash-stat">{body}</div>
  )
}
