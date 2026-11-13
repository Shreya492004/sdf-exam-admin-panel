import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { QuestionSet } from '../data/exams'
import { BookIcon, CheckIcon, CloseIcon, SearchIcon } from './Icons'
import { formatDate } from '../utils/format'

type Props = {
  /** Question sets of the chosen class + subject. */
  sets: QuestionSet[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onPreview: (set: QuestionSet) => void
  /** Shown when there is no subject yet, so the box is disabled. */
  disabledReason?: string
}

const setMarks = (set: QuestionSet) => set.questions.reduce((t, q) => t + q.marks, 0)
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * Searchable multi-select for question-bank topics.
 * The dropdown lists the most recent sets first; typing filters by title or question text.
 */
export default function QuestionBankPicker({ sets, selectedIds, onChange, onPreview, disabledReason }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  // Newest first, then filtered by the search text.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...sets]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter(
        (s) =>
          !q ||
          s.title.toLowerCase().includes(q) ||
          s.questions.some((question) => question.text.toLowerCase().includes(q)),
      )
  }, [sets, query])

  const selected = sets.filter((s) => selectedIds.includes(s.id))
  const totalQuestions = selected.reduce((t, s) => t + s.questions.length, 0)
  const totalMarksSelected = selected.reduce((t, s) => t + setMarks(s), 0)

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])

  /** Choosing from the dropdown selects (or unselects) the topic and closes the list. */
  const pick = (id: string) => {
    toggle(id)
    setOpen(false)
    setQuery('')
    setActive(0)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && results[active]) pick(results[active].id)
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(0)
    }
  }

  const disabled = Boolean(disabledReason)

  return (
    <div className="qb">
      <div className={`qb-combo${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`} ref={boxRef}>
        <div className="qb-combo__input">
          <SearchIcon width={16} height={16} />
          <input
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            disabled={disabled}
            value={query}
            placeholder={disabledReason ?? (sets.length ? `Search ${plural(sets.length, 'question bank topic')}…` : 'No question banks for this subject yet')}
            onFocus={() => {
              setActive(0)
              setOpen(true)
            }}
            onClick={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
              setOpen(true)
            }}
            onKeyDown={onKeyDown}
          />
          {query && (
            <button type="button" className="qb-combo__clear" aria-label="Clear search" onClick={() => setQuery('')}>
              <CloseIcon width={14} height={14} />
            </button>
          )}
        </div>

        {open && !disabled && (
          <div className="qb-menu" id={listId} role="listbox" aria-multiselectable="true">
            <div className="qb-menu__head">
              {query ? `${results.length} matching “${query.trim()}”` : 'Recent question banks'}
            </div>
            {results.length === 0 ? (
              <div className="qb-menu__empty">
                {sets.length === 0
                  ? 'No question banks saved for this subject yet. Create one from the Questions page.'
                  : 'No topics match your search.'}
              </div>
            ) : (
              results.map((s, i) => {
                const isSelected = selectedIds.includes(s.id)
                return (
                  <button
                    type="button"
                    key={s.id}
                    role="option"
                    aria-selected={isSelected}
                    className={`qb-option${isSelected ? ' is-selected' : ''}${i === active ? ' is-active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(s.id)}
                  >
                    <span className="qb-option__check">{isSelected && <CheckIcon width={12} height={12} />}</span>
                    <span className="qb-option__body">
                      <span className="qb-option__title">{s.title}</span>
                      <span className="qb-option__meta">
                        {plural(s.questions.length, 'question')} · {plural(setMarks(s), 'mark')} · Saved{' '}
                        {formatDate(s.createdAt)}
                      </span>
                    </span>
                    {i === 0 && !query && <span className="qb-option__badge">Latest</span>}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="qb-empty">
          <BookIcon width={20} height={20} />
          <span>
            {disabled
              ? 'Pick a class and subject to see its question banks.'
              : 'No topics selected yet. Search above and pick one or more question banks.'}
          </span>
        </div>
      ) : (
        <>
          <div className="qb-selected">
            {selected.map((s) => (
              <div key={s.id} className="qb-card">
                <span className="qb-card__icon">
                  <BookIcon width={18} height={18} />
                </span>
                <div className="qb-card__body">
                  <div className="qb-card__title">{s.title}</div>
                  <div className="qb-card__meta">
                    {plural(s.questions.length, 'question')} · {plural(setMarks(s), 'mark')}
                  </div>
                </div>
                <button type="button" className="btn-small btn-outline" onClick={() => onPreview(s)}>
                  Preview
                </button>
                <button
                  type="button"
                  className="icon-action"
                  aria-label={`Remove ${s.title}`}
                  onClick={() => toggle(s.id)}
                >
                  <CloseIcon width={16} height={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="qb-total">
            <strong>{selected.length}</strong> {selected.length === 1 ? 'topic' : 'topics'} selected ·{' '}
            <strong>{totalQuestions}</strong> {totalQuestions === 1 ? 'question' : 'questions'} ·{' '}
            <strong>{totalMarksSelected}</strong> {totalMarksSelected === 1 ? 'mark' : 'marks'}
          </div>
        </>
      )}
    </div>
  )
}
