type Props = {
  /** 24-hour "HH:MM", or "" when not chosen yet. */
  value: string
  onChange: (value: string) => void
  label: string
  /** Shows the picker in an error state (e.g. end time before start time). */
  invalid?: boolean
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1) // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5) // 00, 05 … 55

const split = (value: string) => {
  if (!value) return { hour: '', minute: '', period: '' }
  const [h, m] = value.split(':').map(Number)
  return { hour: String(h % 12 || 12), minute: String(m), period: h >= 12 ? 'PM' : 'AM' }
}

/** Time picker in one box: Hour : Minute plus an AM/PM switch. Emits 24-hour "HH:MM". */
export default function TimePicker({ value, onChange, label, invalid }: Props) {
  const parts = split(value)

  const update = (next: Partial<typeof parts>) => {
    const p = { ...parts, ...next }
    // Fill sensible defaults so picking any one part gives a complete time.
    const hour = Number(p.hour || 9)
    const minute = Number(p.minute || 0)
    const period = p.period || 'AM'
    const h24 = (hour % 12) + (period === 'PM' ? 12 : 0)
    onChange(`${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  return (
    <div
      className={`time-picker${invalid ? ' is-invalid' : ''}${value ? '' : ' is-empty'}`}
      role="group"
      aria-label={label}
    >
      <select value={parts.hour} onChange={(e) => update({ hour: e.target.value })} aria-label={`${label} hour`}>
        <option value="" disabled>
          --
        </option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, '0')}
          </option>
        ))}
      </select>
      <span className="time-picker__colon">:</span>
      <select value={parts.minute} onChange={(e) => update({ minute: e.target.value })} aria-label={`${label} minute`}>
        <option value="" disabled>
          --
        </option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, '0')}
          </option>
        ))}
      </select>
      <div className="time-picker__period" role="radiogroup" aria-label={`${label} AM or PM`}>
        {(['AM', 'PM'] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={parts.period === p}
            className={parts.period === p ? 'is-active' : ''}
            onClick={() => update({ period: p })}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
