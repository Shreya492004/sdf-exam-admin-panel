import { useState } from 'react'
import type { ClassInfo } from '../data/classes'
import type { NewStudent, Student } from '../data/students'
import AddStudentModal from '../components/AddStudentModal'
import { ArrowLeftIcon, PhoneIcon, PlusIcon, SearchIcon, UsersIcon } from '../components/Icons'
import { formatDate } from '../utils/format'

type Props = {
  cls: ClassInfo
  students: Student[]
  onBack: () => void
  onClasses: () => void
  onAdd: (student: NewStudent) => Promise<Student | undefined>
}

export default function ClassStudents({ cls, students, onBack, onClasses, onAdd }: Props) {
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const qDigits = q.replace(/\s/g, '')
  const rows = students.filter(
    (s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.parent.toLowerCase().includes(q) ||
      String(s.rollNo).padStart(2, '0').includes(q) ||
      (qDigits !== '' && s.phone.replace(/\s/g, '').includes(qDigits)),
  )

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__left">
          <button type="button" className="back-button" aria-label="Back" onClick={onBack}>
            <ArrowLeftIcon width={18} height={18} />
          </button>
          <div>
            <h1>{cls.label} Students</h1>
            <div className="breadcrumb">
              Home <span>/</span>
              <button type="button" className="breadcrumb-link" onClick={onClasses}>
                Classes
              </button>
              <span>/</span>
              <button type="button" className="breadcrumb-link" onClick={onBack}>
                {cls.name}
              </button>
              <span>/</span> Students
            </div>
          </div>
        </div>
        <button type="button" className="add-class-button" onClick={() => setAdding(true)}>
          <PlusIcon width={18} height={18} />
          Add Student
        </button>
      </header>

      <div className="option-panel">
        <div className="list-head">
          <div>
            <h2>Student List</h2>
            <p>All students enrolled in {cls.label}.</p>
          </div>
          <span className="count-pill">
            <UsersIcon width={16} height={16} />
            {students.length} {students.length === 1 ? 'Student' : 'Students'}
          </span>
        </div>

        {students.length > 0 && (
          <div className="toolbar">
            <label className="search-box">
              <SearchIcon width={16} height={16} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, roll no, parent or phone"
                aria-label="Search students"
              />
            </label>
          </div>
        )}

        {students.length === 0 ? (
          <div className="empty-state">No students yet. Use “Add Student” to add one.</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">No students match “{query.trim()}”.</div>
        ) : (
          <div className="table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Gender</th>
                  <th>Date of Birth</th>
                  <th>Joining Date</th>
                  <th>Parent Name</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="roll">{String(s.rollNo).padStart(2, '0')}</td>
                    <td>
                      <div className="student-cell">
                        <span className="student-name">{s.name}</span>
                      </div>
                    </td>
                    <td>{s.gender}</td>
                    <td>{formatDate(s.dob)}</td>
                    <td>{formatDate(s.joiningDate)}</td>
                    <td>{s.parent}</td>
                    <td>
                      <span className="phone">
                        <PhoneIcon width={14} height={14} />
                        {s.phone}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adding && (
        <AddStudentModal
          subtitle={cls.label}
          onClose={() => setAdding(false)}
          onSave={(student) => onAdd(student)}
        />
      )}
    </div>
  )
}
