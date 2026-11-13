import { useState, type FormEvent } from 'react'
import type { Subject } from '../data/subjects'
import type { AddSubjectResult } from '../data/store'
import { subjectName } from '../utils/validate'
import { PlusIcon } from './Icons'

type Props = {
  classLabel: string
  subjects: Subject[]
  onAdd: (name: string) => Promise<AddSubjectResult>
  /** Called with the new subject so the form can select it. */
  onAdded: (subject: Subject) => void
}

/** "+ Add subject" link that opens a small inline form, used next to subject pickers. */
export default function QuickAddSubject({ classLabel, subjects, onAdd, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const close = () => {
    setOpen(false)
    setName('')
    setError('')
  }

  // Not a <form>: this sits inside other forms, and nested forms aren't allowed.
  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (saving) return
    const trimmed = name.trim().replace(/\s+/g, ' ')
    const invalid = subjectName(trimmed)
    if (invalid) return setError(invalid)
    if (subjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      return setError(`${trimmed} is already a subject in ${classLabel}.`)
    }
    setSaving(true)
    const res = await onAdd(trimmed)
    setSaving(false)
    if (res.error) return setError(`Could not add ${trimmed}: ${res.error}`)
    if (res.subject) onAdded(res.subject)
    close()
  }

  if (!open) {
    return (
      <button type="button" className="btn-link quick-subject__open" onClick={() => setOpen(true)}>
        <PlusIcon width={14} height={14} /> Add subject to {classLabel}
      </button>
    )
  }

  return (
    <div className="quick-subject">
      <div className={`inline-form${error ? ' has-error' : ''}`}>
        <input
          autoFocus
          value={name}
          maxLength={40}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void submit()
            }
            if (e.key === 'Escape') close()
          }}
          placeholder={`New subject for ${classLabel}`}
          aria-label="New subject name"
          aria-invalid={Boolean(error)}
        />
        <button type="button" className="btn-primary" disabled={saving} onClick={() => void submit()}>
          {saving ? 'Adding…' : 'Add'}
        </button>
        <button type="button" className="btn-secondary" onClick={close}>
          Cancel
        </button>
      </div>
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}
