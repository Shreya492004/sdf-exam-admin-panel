import { useState, type FormEvent } from 'react'
import Portal from './Portal'
import type { NewStudent, Student } from '../data/students'
import type { ClassInfo } from '../data/classes'
import { CloseIcon, CopyIcon } from './Icons'
import { todayISO } from '../utils/format'
import * as V from '../utils/validate'
import type { Errors } from '../utils/validate'

type Field = 'name' | 'classId' | 'dob' | 'parent' | 'phone' | 'joiningDate'

type Props = {
  /** Subtitle under the title (e.g. the class name). */
  subtitle: string
  /** When given, the form shows a class picker (used on the Students page). */
  classOptions?: ClassInfo[]
  onClose: () => void
  /** Saves the student and returns it (with its generated login). */
  onSave: (student: NewStudent, classId: string | null) => Promise<Student | undefined> | undefined
}

const empty: NewStudent = {
  name: '',
  gender: 'Male',
  dob: '',
  parent: '',
  phone: '',
  joiningDate: todayISO(),
}

export default function AddStudentModal({ subtitle, classOptions, onClose, onSave }: Props) {
  const [form, setForm] = useState<NewStudent>(empty)
  const [classId, setClassId] = useState('')
  const [created, setCreated] = useState<Student | null>(null)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Errors<Field>>({})
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<'username' | 'password' | 'both' | null>(null)
  // Close only on a click that both starts and ends on the backdrop, so dragging to select text
  // inside the modal and releasing outside it doesn't close the dialog.
  const [downOnBackdrop, setDownOnBackdrop] = useState(false)

  const copyText = async (text: string, which: 'username' | 'password' | 'both') => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard blocked — the values stay on screen and can be selected by hand.
      return
    }
    setCopied(which)
    window.setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500)
  }

  const set = <K extends keyof NewStudent>(key: K, value: NewStudent[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const validate = (f: NewStudent): Errors<Field> => ({
    name: V.personName(f.name, 'Student name'),
    classId: classOptions && !classId ? 'Select a class.' : '',
    dob: V.dateOfBirth(f.dob),
    parent: V.personName(f.parent, 'Parent name'),
    phone: V.phone(f.phone),
    joiningDate: V.joiningDate(f.joiningDate, f.dob),
  })

  /** Updates a field and clears its error (and the joining-date error when the DOB changes). */
  const change = <K extends keyof NewStudent>(key: K, value: NewStudent[K]) => {
    set(key, value)
    setErrors((e) => ({ ...e, [key]: '', ...(key === 'dob' ? { joiningDate: '' } : {}) }))
    setError('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    const clean = {
      ...form,
      name: form.name.trim().replace(/\s+/g, ' '),
      parent: form.parent.trim().replace(/\s+/g, ' '),
      phone: form.phone.replace(/[\s-]/g, ''),
    }
    const found = validate(clean)
    setErrors(found)
    if (!V.isValid(found)) {
      setError('Please fix the highlighted fields.')
      return
    }
    const pending = onSave(clean, classOptions ? classId : null)
    if (!pending) return onClose()
    setSaving(true)
    const student = await pending
    setSaving(false)
    if (student) setCreated(student)
    else setError('The student could not be saved. Please try again.')
  }

  /** Class name + error message for a field. */
  const fieldProps = (key: Field, extra = '') => ({
    className: `field${extra}${errors[key] ? ' has-error' : ''}`,
  })
  const fieldError = (key: Field) =>
    errors[key] ? (
      <small className="field-error" id={`student-${key}-error`}>
        {errors[key]}
      </small>
    ) : null
  const describedBy = (key: Field) => (errors[key] ? `student-${key}-error` : undefined)

  if (created) {
    return (
      <Portal>
        {/* No backdrop-close here: the login must stay up until the admin presses Done or ✕. */}
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-added-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h3 id="student-added-title">Student Added</h3>
                <p>
                  {created.name} · Roll {String(created.rollNo).padStart(2, '0')}
                </p>
              </div>
              <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
                <CloseIcon width={18} height={18} />
              </button>
            </div>
            <div className="modal-form">
              <p className="field-full modal-note">
                A login was generated automatically. Give these details to the student — they need them to attend
                exams.
              </p>
              <div className="field-full credentials">
                <div>
                  <span>Username</span>
                  <div className="credentials__value">
                    <code>{created.username}</code>
                    <button
                      type="button"
                      className="mini-btn"
                      title="Copy username"
                      aria-label="Copy username"
                      onClick={() => copyText(created.username, 'username')}
                    >
                      {copied === 'username' ? '✓' : <CopyIcon width={14} height={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <span>Password</span>
                  <div className="credentials__value">
                    <code>{created.password}</code>
                    <button
                      type="button"
                      className="mini-btn"
                      title="Copy password"
                      aria-label="Copy password"
                      onClick={() => copyText(created.password, 'password')}
                    >
                      {copied === 'password' ? '✓' : <CopyIcon width={14} height={14} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => copyText(`Username: ${created.username}\nPassword: ${created.password}`, 'both')}
                >
                  {copied === 'both' ? 'Copied!' : 'Copy Login'}
                </button>
                <button type="button" className="btn-primary" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    )
  }

  return (
    <Portal>
    <div
      className="modal-backdrop"
      onMouseDown={(e) => setDownOnBackdrop(e.target === e.currentTarget)}
      onClick={(e) => {
        if (downOnBackdrop && e.target === e.currentTarget) onClose()
        setDownOnBackdrop(false)
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h3 id="add-student-title">Add Student</h3>
            <p>{subtitle} · username and password are generated automatically</p>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <form className="modal-form" onSubmit={submit} noValidate>
          <label {...fieldProps('name', ' field-full')}>
            <span>Student Name</span>
            <input
              autoFocus
              maxLength={60}
              value={form.name}
              onChange={(e) => change('name', e.target.value)}
              placeholder="Enter full name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy('name')}
            />
            {fieldError('name')}
          </label>
          {classOptions && (
            <label {...fieldProps('classId')}>
              <span>Class</span>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value)
                  setErrors((er) => ({ ...er, classId: '' }))
                }}
                aria-invalid={Boolean(errors.classId)}
                aria-describedby={describedBy('classId')}
              >
                <option value="" disabled>
                  Select class
                </option>
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              {fieldError('classId')}
            </label>
          )}
          <label className="field">
            <span>Gender</span>
            <select value={form.gender} onChange={(e) => change('gender', e.target.value as Student['gender'])}>
              <option>Male</option>
              <option>Female</option>
            </select>
          </label>
          <label {...fieldProps('dob')}>
            <span>Date of Birth</span>
            <input
              type="date"
              max={todayISO()}
              value={form.dob}
              onChange={(e) => change('dob', e.target.value)}
              aria-invalid={Boolean(errors.dob)}
              aria-describedby={describedBy('dob')}
            />
            {fieldError('dob')}
          </label>
          <label {...fieldProps('parent')}>
            <span>Parent Name</span>
            <input
              maxLength={60}
              value={form.parent}
              onChange={(e) => change('parent', e.target.value)}
              placeholder="Father / Mother name"
              aria-invalid={Boolean(errors.parent)}
              aria-describedby={describedBy('parent')}
            />
            {fieldError('parent')}
          </label>
          <label {...fieldProps('phone')}>
            <span>Phone</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.phone}
              onChange={(e) => change('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit number"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy('phone')}
            />
            {fieldError('phone')}
          </label>
          <label {...fieldProps('joiningDate', classOptions ? '' : ' field-full')}>
            <span>Joining Date</span>
            <input
              type="date"
              min={form.dob || undefined}
              max={todayISO()}
              value={form.joiningDate}
              onChange={(e) => change('joiningDate', e.target.value)}
              aria-invalid={Boolean(errors.joiningDate)}
              aria-describedby={describedBy('joiningDate')}
            />
            {fieldError('joiningDate')}
          </label>

          {error && <div className="form-error field-full">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Portal>
  )
}
