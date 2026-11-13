import { useMemo, useState } from 'react'
import { classes } from '../data/classes'
import type { NewStudent, Student } from '../data/students'
import AddStudentModal from '../components/AddStudentModal'
import { PhoneIcon, PlusIcon, SearchIcon, UsersIcon } from '../components/Icons'
import { formatDate } from '../utils/format'

type Props = {
  studentsByClass: Record<string, Student[]>
  onAdd: (classId: string, student: NewStudent) => Promise<Student | undefined>
}

export default function StudentsPage({ studentsByClass, onAdd }: Props) {
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const qDigits = q.replace(/\s/g, '')
    return classes
      .filter((c) => classFilter === 'all' || c.id === classFilter)
      .flatMap((c) => (studentsByClass[c.id] ?? []).map((s) => ({ ...s, cls: c })))
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.parent.toLowerCase().includes(q) ||
          s.phone.replace(/\s/g, '').includes(qDigits),
      )
  }, [studentsByClass, query, classFilter])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Students</h1>
          <div className="breadcrumb">Home <span>/</span> Students</div>
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
            <p>All students across every class.</p>
          </div>
          <span className="count-pill">
            <UsersIcon width={16} height={16} />
            {rows.length} {rows.length === 1 ? 'Student' : 'Students'}
          </span>
        </div>

        <div className="toolbar">
          <label className="search-box">
            <SearchIcon width={16} height={16} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, parent or phone"
              aria-label="Search students"
            />
          </label>
          <select
            className="filter-select"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            aria-label="Filter by class"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">No students match your search.</div>
        ) : (
          <div className="table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Roll No</th>
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
                    <td>
                      <div className="student-cell">
                        <span className="student-name">{s.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="class-tag">{s.cls.name}</span>
                    </td>
                    <td className="roll">{String(s.rollNo).padStart(2, '0')}</td>
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
          subtitle="Choose a class for the new student"
          classOptions={classes}
          onClose={() => setAdding(false)}
          onSave={(student, classId) => (classId ? onAdd(classId, student) : undefined)}
        />
      )}
    </div>
  )
}
