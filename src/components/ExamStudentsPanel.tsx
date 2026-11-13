import { useEffect, useRef, useState } from 'react'
import type { Exam } from '../data/exams'
import type { Student } from '../data/students'
import { CheckIcon, CopyIcon, PlusIcon, RefreshIcon, SearchIcon, TrashIcon } from './Icons'
import ShareMenu from './ShareMenu'
import { examLink } from '../utils/examLink'

type Props = {
  exam: Exam
  classLabel: string
  students: Student[]
  /** Saves the full list of students on the exam; new ones get a username + password generated. */
  onSave: (studentIds: string[]) => void
  onResetPassword: (studentId: string) => void
}

const roll = (s: Student) => String(s.rollNo).padStart(2, '0')

/** On the exam page: the students who can take the exam, with their exam logins. */
export default function ExamStudentsPanel({ exam, classLabel, students, onSave, onResetPassword }: Props) {
  const saved = exam.access ?? {}
  const savedIds = Object.keys(saved)
  const added = students.filter((s) => saved[s.id])
  const available = students.filter((s) => !saved[s.id])

  // The pick list is open straight away only while nobody is added yet;
  // after that it's hidden until "Add Students" is pressed.
  const [picking, setPicking] = useState(added.length === 0)
  const [notice, setNotice] = useState('')
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedRow, setCopiedRow] = useState<string | null>(null)

  const flash = (text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice((cur) => (cur === text ? '' : cur)), 4000)
  }

  const addStudents = (ids: string[]) => {
    onSave([...savedIds, ...ids])
    setPicking(false)
    flash(`${ids.length} ${ids.length === 1 ? 'student' : 'students'} added. Their logins are ready below.`)
  }

  const remove = (s: Student) => {
    if (!window.confirm(`Remove ${s.name} from this exam? Their exam login will stop working.`)) return
    onSave(savedIds.filter((id) => id !== s.id))
    flash(`${s.name} was removed from this exam.`)
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Clipboard blocked — the logins stay visible to copy by hand.
      return false
    }
  }

  const link = examLink(exam.code)
  const shareTitle = `${exam.name} (${classLabel})`

  /** All logins, ready to send to a class group. */
  const allLoginsText = () => {
    const lines = added.map(
      (s) => `${roll(s)}  ${s.name}  —  Username: ${saved[s.id].username}  Password: ${saved[s.id].password}`,
    )
    return `${shareTitle} — Student Logins\nExam link: ${link}\n\n${lines.join('\n')}`
  }

  /** One student's login, ready to send to that student / parent. */
  const studentLoginText = (s: Student) => {
    const login = saved[s.id]
    return `${shareTitle}\nStudent: ${s.name} (Roll ${roll(s)})\nExam link: ${link}\nUsername: ${login.username}\nPassword: ${login.password}`
  }

  const copyAll = async () => {
    if (await copyText(allLoginsText())) {
      setCopiedAll(true)
      window.setTimeout(() => setCopiedAll(false), 1500)
    }
  }

  const copyRow = async (s: Student) => {
    if (await copyText(studentLoginText(s))) {
      setCopiedRow(s.id)
      window.setTimeout(() => setCopiedRow((cur) => (cur === s.id ? null : cur)), 1500)
    }
  }

  if (students.length === 0) {
    return (
      <div className="tab-panel">
        <div className="empty-state">No students in {classLabel} yet. Add them from the class’s Student List.</div>
      </div>
    )
  }

  return (
    <div className="tab-panel es">
      <div className="es-head">
        <div>
          <h3>Students taking this exam</h3>
          <p>
            Each added student gets a username and password for the exam link. Only these students can log in.
          </p>
        </div>
        {added.length > 0 && (
          <div className="es-head__actions">
            <span className="es-progress" title={`${added.length} of ${students.length} students added`}>
              <span className="es-progress__bar">
                <span style={{ width: `${(added.length / students.length) * 100}%` }} />
              </span>
              {added.length} / {students.length} added
            </span>
          </div>
        )}
      </div>

      {notice && (
        <div className="es-notice" role="status">
          {notice}
        </div>
      )}

      {/* Pick list of students not yet on the exam — shown on demand. */}
      {available.length > 0 ? (
        picking ? (
          <AddStudentsPicker
            key={savedIds.length}
            classLabel={classLabel}
            students={available}
            onAdd={addStudents}
            onCancel={added.length > 0 ? () => setPicking(false) : undefined}
          />
        ) : (
          <div className="es-add-bar">
            <span>
              {available.length} {classLabel} {available.length === 1 ? 'student is' : 'students are'} not added yet.
            </span>
            <button type="button" className="btn-primary es-btn" onClick={() => setPicking(true)}>
              <PlusIcon width={15} height={15} />
              Add Students
            </button>
          </div>
        )
      ) : (
        <div className="es-all-added">
          <CheckIcon width={16} height={16} />
          All {classLabel} students are added to this exam.
        </div>
      )}

      {added.length > 0 && (
        <div className="es-added">
          <div className="es-added__head">
            <h4 className="es-added__title">
              Added students <span>{added.length}</span>
            </h4>
            <div className="es-added__actions">
              <button type="button" className="btn-secondary es-btn" onClick={copyAll}>
                {copiedAll ? <CheckIcon width={15} height={15} /> : <CopyIcon width={15} height={15} />}
                {copiedAll ? 'Copied!' : 'Copy All Logins'}
              </button>
              <ShareMenu title={`${shareTitle} — Student Logins`} text={allLoginsText()} label="Share All" />
            </div>
          </div>
          <div className="table-wrap es-table-wrap">
            <table className="student-table es-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th className="es-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {added.map((s) => {
                  const login = saved[s.id]
                  return (
                    <tr key={s.id}>
                      <td className="roll">{roll(s)}</td>
                      <td className="student-name">{s.name}</td>
                      <td>
                        <code className="es-cred">{login.username}</code>
                      </td>
                      <td>
                        <code className="es-cred">{login.password}</code>
                      </td>
                      <td className="es-td-actions">
                        <div className="es-row-actions">
                          <button
                            type="button"
                            className="es-icon-btn"
                            title="Copy login"
                            aria-label={`Copy login for ${s.name}`}
                            onClick={() => copyRow(s)}
                          >
                            {copiedRow === s.id ? <CheckIcon width={15} height={15} /> : <CopyIcon width={15} height={15} />}
                          </button>
                          <ShareMenu
                            variant="icon"
                            label="Share login"
                            ariaLabel={`Share login for ${s.name}`}
                            title={shareTitle}
                            text={studentLoginText(s)}
                          />
                          <button
                            type="button"
                            className="es-icon-btn"
                            title="New password"
                            aria-label={`Generate a new password for ${s.name}`}
                            onClick={() => {
                              if (window.confirm(`Generate a new exam password for ${s.name}? The old one will stop working.`))
                                onResetPassword(s.id)
                            }}
                          >
                            <RefreshIcon width={15} height={15} />
                          </button>
                          <span className="es-row-actions__sep" aria-hidden="true" />
                          <button
                            type="button"
                            className="es-icon-btn is-danger"
                            title="Remove from exam"
                            aria-label={`Remove ${s.name} from this exam`}
                            onClick={() => remove(s)}
                          >
                            <TrashIcon width={15} height={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/** List of the students not yet on the exam, shown directly on the Add Students tab. */
function AddStudentsPicker({
  classLabel,
  students,
  onAdd,
  onCancel,
}: {
  classLabel: string
  students: Student[]
  onAdd: (ids: string[]) => void
  /** Hides the list again (only offered once some students are added). */
  onCancel?: () => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const allRef = useRef<HTMLInputElement>(null)

  const q = query.trim().toLowerCase()
  const visible = students.filter((s) => !q || s.name.toLowerCase().includes(q) || roll(s).includes(q))
  const allVisiblePicked = visible.length > 0 && visible.every((s) => picked.includes(s.id))
  const someVisiblePicked = visible.some((s) => picked.includes(s.id)) && !allVisiblePicked

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = someVisiblePicked
  }, [someVisiblePicked])

  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  const toggleAll = () =>
    setPicked((cur) =>
      allVisiblePicked
        ? cur.filter((id) => !visible.some((s) => s.id === id))
        : [...new Set([...cur, ...visible.map((s) => s.id)])],
    )

  return (
        <section className="es-dialog es-inline" aria-labelledby="es-picker-title">
          <div className="es-inline__head">
            <div>
              <h4 id="es-picker-title">Select students to add</h4>
              <p>
                {students.length} {classLabel} {students.length === 1 ? 'student' : 'students'} not yet added
              </p>
            </div>
          </div>

          <div className="es-dialog__body">
            <div className="es-dialog__tools">
              <label className="search-box">
                <SearchIcon width={16} height={16} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or roll no"
                  aria-label="Search students"
                />
              </label>
              <label className="es-dialog__all">
                <input
                  ref={allRef}
                  type="checkbox"
                  checked={allVisiblePicked}
                  onChange={toggleAll}
                  disabled={visible.length === 0}
                />
                Select all
              </label>
            </div>

            {visible.length === 0 ? (
              <div className="es-dialog__none">No students match “{query.trim()}”.</div>
            ) : (
              <ul className="es-pick-list">
                {visible.map((s) => {
                  const isPicked = picked.includes(s.id)
                  return (
                    <li key={s.id}>
                      <label className={`es-pick${isPicked ? ' is-picked' : ''}`}>
                        <input type="checkbox" checked={isPicked} onChange={() => toggle(s.id)} />
                        <span className="es-pick__roll">{roll(s)}</span>
                        <span className="es-pick__name">{s.name}</span>
                        <span className="es-pick__parent">{s.parent}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="es-dialog__foot">
            <span>{picked.length} selected</span>
            <div>
              {picked.length > 0 && (
                <button type="button" className="btn-secondary" onClick={() => setPicked([])}>
                  Clear
                </button>
              )}
              {onCancel && (
                <button type="button" className="btn-secondary" onClick={onCancel}>
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="btn-primary"
                disabled={picked.length === 0}
                onClick={() => onAdd(picked)}
              >
                Add &amp; Generate Logins{picked.length ? ` (${picked.length})` : ''}
              </button>
            </div>
          </div>
        </section>
  )
}
