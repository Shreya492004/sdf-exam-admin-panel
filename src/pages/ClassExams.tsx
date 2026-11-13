import { useState } from 'react'
import type { ClassInfo } from '../data/classes'
import { examStatus, totalMarks, type Exam } from '../data/exams'
import type { Subject } from '../data/subjects'
import PageHeader from '../components/PageHeader'
import QuestionsModal from '../components/QuestionsModal'
import ExamStatusPill from '../components/ExamStatusPill'
import { CalendarIcon, ExamIcon } from '../components/Icons'
import { formatDate, formatTimeRange } from '../utils/format'

type Props = {
  cls: ClassInfo
  exams: Exam[]
  subjects: Subject[]
  onBack: () => void
  onClasses: () => void
  onOpen: (examId: string) => void
}

/** List of a class's MCQ exams. New exams are created from "Create Test" in the sidebar. */
export default function ClassExams({ cls, exams, subjects, onBack, onClasses, onOpen }: Props) {
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [viewing, setViewing] = useState<Exam | null>(null)

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? '—'
  const rows = exams
    .filter((e) => subjectFilter === 'all' || e.subjectId === subjectFilter)
    // Newest first, so a just-created exam is on the top row.
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  return (
    <div className="page">
      <PageHeader
        title={`${cls.label} Exams`}
        onBack={onBack}
        crumbs={[
          { label: 'Classes', onClick: onClasses },
          { label: cls.name, onClick: onBack },
          { label: 'Exams' },
        ]}
      />

      <div className="option-panel">
        <div className="list-head">
          <div>
            <h2>MCQ Exams</h2>
            <p>View questions, open an exam to share its link, conduct it and see scores.</p>
          </div>
          <span className="count-pill">
            <ExamIcon width={16} height={16} />
            {exams.length} {exams.length === 1 ? 'Exam' : 'Exams'}
          </span>
        </div>

        <div className="toolbar">
          <select
            className="filter-select"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            aria-label="Filter by subject"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">No exams yet. Use “Create Test” in the sidebar to add one.</div>
        ) : (
          <div className="table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Questions</th>
                  <th>Max Marks</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                    <tr key={e.id}>
                      <td className="student-name">{e.name}</td>
                      <td>
                        <span className="class-tag">{subjectName(e.subjectId)}</span>
                      </td>
                      <td className="nowrap">
                        <span className="phone">
                          <CalendarIcon width={14} height={14} />
                          {formatDate(e.date)}
                        </span>
                      </td>
                      <td className="nowrap">{formatTimeRange(e.startTime, e.endTime)}</td>
                      <td>
                        <ExamStatusPill status={examStatus(e)} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-small btn-outline"
                          disabled={e.questions.length === 0}
                          onClick={() => setViewing(e)}
                        >
                          View
                        </button>
                      </td>
                      <td>{totalMarks(e)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => onOpen(e.id)}
                        >
                          Open ›
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && (
        <QuestionsModal
          title={viewing.name}
          subtitle={`${cls.label} · ${subjectName(viewing.subjectId)}`}
          questions={viewing.questions}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  )
}
