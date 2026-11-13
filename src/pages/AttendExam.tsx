import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { classes } from '../data/classes'
import { examStatus, examWindow } from '../data/exams'
import { api, ApiError, errorMessage } from '../data/api'
import {
  ArrowLeftIcon,
  BookIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  ExamIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LogoutIcon,
} from '../components/Icons'
import { formatCountdown, formatDate, formatTimeRange, initials } from '../utils/format'
import { PASS_PERCENT, type Grade } from '../utils/score'
import '../attend.css'

type Props = {
  code: string
}

/** Exam details from GET /api/attend/:code — the questions come without the correct answers. */
type ExamInfo = {
  id: string
  classId: string
  name: string
  subjectName: string | null
  date: string
  startTime?: string
  endTime?: string
  maxMarks: number
  passPercent?: number
  questions: { id: string; text: string; options: string[]; marks: number }[]
  hasStudents: boolean
}

type Session = {
  token: string
  student: { id: string; name: string; rollNo: number }
  result: Grade | null
}

type Step = 'identify' | 'ready' | 'answer' | 'done' | 'timedout'

/** Why the test is paused behind the lock screen. */
type Lock = 'fullscreen' | 'left' | 'back' | null

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/* Full screen helpers (not every browser supports it, e.g. iPhone Safari). */
const canFullscreen = () => typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen)
const isFullscreen = () => Boolean(document.fullscreenElement)
const enterFullscreen = async () => {
  if (!canFullscreen() || isFullscreen()) return
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
  } catch {
    // Refused (e.g. no user gesture) — the lock screen offers the button again.
  }
}
const exitFullscreen = () => {
  if (isFullscreen()) void document.exitFullscreen().catch(() => undefined)
}

/** Student-facing page opened from an exam link (?exam=<code>). Talks to the public /api/attend endpoints. */
export default function AttendExam({ code }: Props) {
  const [info, setInfo] = useState<ExamInfo | null>(null)
  const [loadError, setLoadError] = useState<{ notFound: boolean; message: string } | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [login, setLogin] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<Step>('identify')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [current, setCurrent] = useState(0)
  const [visited, setVisited] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [lock, setLock] = useState<Lock>(null)
  const [leftCount, setLeftCount] = useState(0)
  const leftCountRef = useRef(0)
  const lockRef = useRef<Lock>(null)
  const autoSubmitted = useRef(false)

  /** Clears the lock screen (state + the ref the event handlers read). */
  const unlock = () => {
    lockRef.current = null
    setLock(null)
  }

  const fetchExam = () =>
    api<ExamInfo>(`/attend/${encodeURIComponent(code)}`, { token: null })
      .then(setInfo)
      .catch((e) =>
        setLoadError({ notFound: e instanceof ApiError && e.status === 404, message: errorMessage(e) }),
      )

  const loadExam = () => {
    setLoadError(null)
    void fetchExam()
  }

  useEffect(() => {
    void fetchExam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // Tick every second so the countdown and the start/end checks stay current.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const status = info ? examStatus(info, now) : 'open'

  /** Moves to a question and remembers it was seen (unanswered + seen = "not answered"). */
  const goTo = (index: number) => {
    const target = info?.questions[index]
    if (!target) return
    setCurrent(index)
    setVisited((v) => (v.includes(target.id) ? v : [...v, target.id]))
    setError('')
  }

  const submitAnswers = async (final: Record<string, number>) => {
    if (!session) return false
    setBusy(true)
    try {
      const res = await api<{ result: Grade }>(`/attend/${encodeURIComponent(code)}/submit`, {
        method: 'POST',
        body: { answers: final, leftScreenCount: leftCountRef.current },
        token: session.token,
      })
      setSession({ ...session, result: res.result })
      // The test is over, so the student may leave full screen again.
      unlock()
      exitFullscreen()
      return true
    } catch (e) {
      setError(errorMessage(e))
      return false
    } finally {
      setBusy(false)
    }
  }

  // When the end time is reached mid-exam, submit what the student has answered.
  const timedOut = step === 'timedout' || ((step === 'answer' || step === 'ready') && status === 'ended')
  useEffect(() => {
    if (step !== 'answer' || status !== 'ended' || !session || session.result || autoSubmitted.current) return
    autoSubmitted.current = true
    setConfirming(false)
    void submitAnswers(answers).then(() => {
      setStep('timedout')
      window.scrollTo({ top: 0 })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, status, session])

  // Keyboard shortcuts while answering: A–D picks an option, ← / → move between questions.
  const inExam = step === 'answer' && Boolean(session) && !session?.result && !timedOut
  useEffect(() => {
    if (!inExam || !info || confirming) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return
      const q = info.questions[current]
      if (!q) return
      const idx = LETTERS.indexOf(e.key.toUpperCase())
      if (idx >= 0 && idx < q.options.length) {
        setAnswers((a) => ({ ...a, [q.id]: idx }))
      } else if (e.key === 'ArrowRight' && current < info.questions.length - 1) {
        goTo(current + 1)
      } else if (e.key === 'ArrowLeft' && current > 0) {
        goTo(current - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inExam, info, current, confirming])

  /*
   * Keep the student on the test until they submit:
   * - closing / reloading the tab asks "Leave site?"
   * - the browser Back button is blocked
   * - leaving full screen or switching to another tab/app pauses the test behind a lock screen,
   *   and each time is counted and sent with the answers so the teacher can see it.
   * (A web page can't stop the device itself from switching apps — it can only notice and record it.)
   */
  useEffect(() => {
    if (!inExam) return
    const markLeft = (reason: Exclude<Lock, null>) => {
      // Switching tabs also exits full screen — count that as one time, not two.
      if (lockRef.current) return
      lockRef.current = reason
      leftCountRef.current += 1
      setLeftCount(leftCountRef.current)
      setLock(reason)
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    const onPopState = () => {
      window.history.pushState({ inTest: true }, '', window.location.href)
      if (!lockRef.current) {
        lockRef.current = 'back'
        setLock('back')
      }
    }
    const onFullscreenChange = () => {
      if (!isFullscreen()) markLeft('fullscreen')
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') markLeft('left')
    }
    const block = (e: Event) => e.preventDefault()

    window.history.pushState({ inTest: true }, '', window.location.href)
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('popstate', onPopState)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('contextmenu', block)
    document.addEventListener('copy', block)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('popstate', onPopState)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('copy', block)
    }
  }, [inExam])

  /** Starts the test in full screen (must run from a click). */
  const startTest = async () => {
    await enterFullscreen()
    unlock()
    setStep('answer')
    window.scrollTo({ top: 0 })
  }

  /** Lock screen "return" button: back to full screen and carry on. */
  const resume = async () => {
    await enterFullscreen()
    // If the browser refuses full screen, let the student carry on rather than get stuck.
    unlock()
  }

  /* ---------- Loading / errors ---------- */

  if (loadError) {
    return (
      <Shell>
        <CenterCard
          tone="error"
          icon={<ExamIcon width={28} height={28} />}
          title={loadError.notFound ? 'Exam not found' : 'Can’t open the exam'}
          text={
            loadError.notFound
              ? 'This exam link is invalid or the exam has been removed. Please check the link with your teacher.'
              : loadError.message
          }
        >
          {!loadError.notFound && (
            <button type="button" className="ax-btn ax-btn--primary" onClick={loadExam}>
              Try Again
            </button>
          )}
        </CenterCard>
      </Shell>
    )
  }

  if (!info) {
    return (
      <Shell>
        <div className="ax-center">
          <div className="ax-spinner" aria-hidden="true" />
          <p className="ax-muted">Loading exam…</p>
        </div>
      </Shell>
    )
  }

  const cls = classes.find((c) => c.id === info.classId)
  const window_ = examWindow(info)
  const timeRange = formatTimeRange(info.startTime, info.endTime)
  const [startLabel, endLabel] = timeRange.split(' – ')
  const durationMin = window_ ? Math.round((window_.end.getTime() - window_.start.getTime()) / 60000) : null
  const student = session?.student
  const saved = session?.result ?? null
  const questions = info.questions

  const meta = (
    <div className="ax-meta">
      <span>
        <BookIcon width={15} height={15} /> {cls?.label ?? 'Class'} · {info.subjectName ?? 'Subject'}
      </span>
      <span>
        <CalendarIcon width={15} height={15} /> {formatDate(info.date)}
      </span>
      {window_ && (
        <span>
          <ClockIcon width={15} height={15} /> {timeRange}
        </span>
      )}
    </div>
  )

  if (questions.length === 0) {
    return (
      <Shell>
        <CenterCard
          icon={<ExamIcon width={28} height={28} />}
          title={info.name}
          text="This exam is not ready yet. Please try again later."
        />
      </Shell>
    )
  }

  const logout = () => {
    setSession(null)
    setLogin({ username: '', password: '' })
    setAnswers({})
    setCurrent(0)
    setVisited([])
    setConfirming(false)
    setError('')
    setStep('identify')
    autoSubmitted.current = false
    leftCountRef.current = 0
    setLeftCount(0)
    unlock()
    exitFullscreen()
  }

  const userChip = student && (
    <div className="ax-user">
      <span className="ax-avatar">{initials(student.name)}</span>
      <span className="ax-user__text">
        <strong>{student.name}</strong>
        <small>Roll {String(student.rollNo).padStart(2, '0')}</small>
      </span>
      {/* No way out while the test is running — only after submitting. */}
      {!inExam && (
        <button type="button" className="ax-icon-btn" onClick={logout} title="Log out" aria-label="Log out">
          <LogoutIcon width={18} height={18} />
        </button>
      )}
    </div>
  )

  /* ---------- Login ---------- */

  if (step === 'identify' || !student) {
    const signIn = async (e: FormEvent) => {
      e.preventDefault()
      if (status === 'upcoming') return setError('The exam has not started yet. Please log in once it opens.')
      if (!login.username.trim() || !login.password) return setError('Enter your username and password.')
      setBusy(true)
      try {
        const res = await api<Session>(`/attend/${encodeURIComponent(code)}/login`, {
          method: 'POST',
          body: { username: login.username.trim(), password: login.password },
          token: null,
        })
        setSession(res)
        setCurrent(0)
        setVisited(questions[0] ? [questions[0].id] : [])
        setError('')
        // After the end time, a student can only see a result — not start the exam.
        setStep(res.result ? 'answer' : examStatus(info) === 'ended' ? 'timedout' : 'ready')
        window.scrollTo({ top: 0 })
      } catch (err) {
        setError(errorMessage(err))
      } finally {
        setBusy(false)
      }
    }

    const statusBox =
      status === 'upcoming' && window_ ? (
        <div className="ax-status is-upcoming">
          <ClockIcon width={18} height={18} />
          <div>
            <strong>Starts in {formatCountdown((window_.start.getTime() - now.getTime()) / 1000)}</strong>
            <span>
              Opens on {formatDate(info.date)} at {startLabel}. You can log in once it opens.
            </span>
          </div>
        </div>
      ) : status === 'ended' ? (
        <div className="ax-status is-ended">
          <LockIcon width={18} height={18} />
          <div>
            <strong>This exam has ended</strong>
            <span>You can log in to see your result, but you can’t attend it any more.</span>
          </div>
        </div>
      ) : status === 'live' && window_ ? (
        <div className="ax-status is-live">
          <span className="ax-live-dot" aria-hidden="true" />
          <div>
            <strong>Exam is live</strong>
            <span>
              Closes at {endLabel} — {formatCountdown((window_.end.getTime() - now.getTime()) / 1000)} left.
            </span>
          </div>
        </div>
      ) : null

    return (
      <Shell>
        <div className="ax-login">
          <section className="ax-panel ax-overview">
            <div className="ax-overview__heading">
              <span className="ax-chip">{info.subjectName ?? 'MCQ Exam'}</span>
              <span className="ax-overview__label">EXAM OVERVIEW</span>
            </div>
            <h1 className="ax-title">{info.name}</h1>
            {meta}

            <div className="ax-stats">
              <Stat label="Questions" value={String(questions.length)} />
              <Stat label="Total marks" value={String(info.maxMarks)} />
              <Stat label="Pass mark" value={`${info.passPercent ?? PASS_PERCENT}%`} />
              <Stat label="Duration" value={durationMin ? `${durationMin} min` : 'No limit'} />
            </div>

            {statusBox}

            <div className="ax-instructions">
              <h2>Instructions</h2>
              <ul>
                <li>Each question has one correct answer. Choose the option you think is right.</li>
                <li>
                  Answering every question is optional — you can skip any question and come back to it. Skipped
                  questions get 0 marks.
                </li>
                <li>The test opens in full screen. You can’t leave the test screen until you submit.</li>
                {window_ && <li>Your answers are submitted automatically when the time runs out.</li>}
                <li>You can submit the test only once.</li>
              </ul>
            </div>
          </section>

          <form className="ax-panel ax-signin" onSubmit={signIn} noValidate>
            <div className="ax-signin__heading">
              <div className="ax-signin__icon">
                <LockIcon width={22} height={22} />
              </div>
              <div>
                <span className="ax-signin__eyebrow">STUDENT PORTAL</span>
                <h2>Student sign in</h2>
              </div>
            </div>
            <p className="ax-muted">Enter the exam username and password provided by your teacher.</p>

            <label className="ax-field">
              <span>Username</span>
              <input
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={login.username}
                onChange={(e) => {
                  setLogin((l) => ({ ...l, username: e.target.value }))
                  setError('')
                }}
                placeholder="e.g. arjun01"
              />
            </label>
            <label className="ax-field">
              <span>Password</span>
              <div className="ax-password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={login.password}
                  onChange={(e) => {
                    setLogin((l) => ({ ...l, password: e.target.value }))
                    setError('')
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="ax-password__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="ax-alert" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="ax-btn ax-btn--primary ax-btn--block"
              disabled={status === 'upcoming' || busy}
            >
              {busy
                ? 'Checking…'
                : status === 'upcoming'
                  ? 'Exam not open yet'
                  : status === 'ended'
                    ? 'Sign in to see result'
                    : 'Sign in & start exam'}
            </button>
          </form>
        </div>
      </Shell>
    )
  }

  /* ---------- Ready to start (after sign-in) ---------- */

  if (step === 'ready' && !saved && !timedOut) {
    return (
      <Shell right={userChip}>
        <div className="ax-ready ax-panel">
          <div className="ax-ready__icon">
            <ExamIcon width={28} height={28} />
          </div>
          <h1>Ready to start, {student.name.split(' ')[0]}?</h1>
          <p className="ax-muted">
            {info.name} · {questions.length} {questions.length === 1 ? 'question' : 'questions'} · {info.maxMarks}{' '}
            marks · pass mark {info.passPercent ?? PASS_PERCENT}%
          </p>
          <ul className="ax-ready__rules">
            <li>
              <strong>Full screen.</strong> The test opens in full screen and stays there until you submit.
            </li>
            <li>
              <strong>Stay on this screen.</strong> Leaving full screen or switching to another tab or app pauses the
              test, and each time is reported to your teacher.
            </li>
            <li>
              <strong>Skipping is allowed.</strong> You don’t have to answer every question — skipped ones get 0
              marks.
            </li>
            {window_ && (
              <li>
                <strong>Timed.</strong> The test closes at {endLabel} and submits automatically.
              </li>
            )}
          </ul>
          <div className="ax-ready__actions">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={logout}>
              Not now
            </button>
            <button type="button" className="ax-btn ax-btn--primary" onClick={() => void startTest()}>
              Start Test
            </button>
          </div>
        </div>
      </Shell>
    )
  }

  /* ---------- Results ---------- */

  if (timedOut || saved) {
    const heading = timedOut
      ? busy
        ? 'Submitting your answers…'
        : saved
          ? 'Time’s up — answers submitted'
          : 'You missed this exam'
      : step === 'done'
        ? 'Exam submitted'
        : 'Already submitted'
    const text = timedOut
      ? saved
        ? `The exam ended at ${endLabel}. Your answers were submitted automatically; unanswered questions get 0 marks.`
        : busy
          ? 'Please wait a moment.'
          : 'You did not attend this exam before the end time.'
      : step === 'done'
        ? `Thank you, ${student.name}. Your answers have been recorded.`
        : `${student.name}, you have already submitted this exam. Contact your teacher if you need a retake.`
    return (
      <Shell right={userChip}>
        <div className="ax-result">
          <div className={`ax-result__icon${saved ? ' is-done' : ' is-ended'}`}>
            {saved ? <CheckIcon width={30} height={30} /> : <ClockIcon width={30} height={30} />}
          </div>
          <h1>{heading}</h1>
          <p className="ax-muted">{text}</p>
          {error && (
            <div className="ax-alert" role="alert">
              {error}
            </div>
          )}
          {saved && <ResultCard grade={saved} examName={info.name} />}
          <button type="button" className="ax-btn ax-btn--ghost" onClick={logout}>
            <LogoutIcon width={16} height={16} /> Log out
          </button>
        </div>
      </Shell>
    )
  }

  /* ---------- Exam ---------- */

  const q = questions[current]
  const answeredCount = questions.filter((x) => answers[x.id] !== undefined).length
  const unanswered = questions.length - answeredCount
  const isLast = current === questions.length - 1
  const secondsLeft = window_ ? Math.max(0, (window_.end.getTime() - now.getTime()) / 1000) : null
  const totalSeconds = window_ ? (window_.end.getTime() - window_.start.getTime()) / 1000 : null
  const warning = secondsLeft !== null && secondsLeft <= 300

  const pick = (option: number) => {
    setAnswers((a) => ({ ...a, [q.id]: option }))
    setError('')
  }

  const finalSubmit = async () => {
    if (await submitAnswers(answers)) {
      setConfirming(false)
      setStep('done')
      window.scrollTo({ top: 0 })
    }
  }

  const stateOf = (id: string, index: number) =>
    index === current ? 'is-current' : answers[id] !== undefined ? 'is-answered' : visited.includes(id) ? 'is-skipped' : ''

  const timer = secondsLeft !== null && (
    <div className={`ax-timer${warning ? ' is-warning' : ''}`} role="timer" aria-live="off">
      <ClockIcon width={18} height={18} />
      <span className="ax-timer__value">{formatCountdown(secondsLeft)}</span>
    </div>
  )

  return (
    <Shell
      right={
        <>
          {timer}
          {userChip}
        </>
      }
    >
      <div className="ax-exam">
        <div className="ax-exam__head">
          <div>
            <h1 className="ax-exam__title">{info.name}</h1>
            {meta}
          </div>
        </div>

        <div className="ax-exam__grid">
          <section className="ax-panel ax-question" aria-labelledby="ax-q-text">
            <div className="ax-question__top">
              <span className="ax-question__count">
                Question <strong>{current + 1}</strong> of {questions.length}
              </span>
              <span className="ax-chip ax-chip--soft">
                {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
              </span>
            </div>
            <div className="ax-progress" aria-hidden="true">
              <span style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>

            <h2 id="ax-q-text" className="ax-question__text">
              {q.text}
            </h2>

            <div className="ax-options" role="radiogroup" aria-labelledby="ax-q-text">
              {q.options.map((option, j) => {
                const chosen = answers[q.id] === j
                return (
                  <label key={j} className={`ax-option${chosen ? ' is-selected' : ''}`}>
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={chosen}
                      onChange={() => pick(j)}
                      className="ax-option__input"
                    />
                    <span className="ax-option__letter">{LETTERS[j]}</span>
                    <span className="ax-option__text">{option}</span>
                    <span className="ax-option__check" aria-hidden="true">
                      {chosen && <CheckIcon width={14} height={14} />}
                    </span>
                  </label>
                )
              })}
            </div>

            {answers[q.id] === undefined && (
              <p className="ax-skip-note">
                Not sure? This question is optional — press <strong>Skip &amp; Next</strong> and come back later if you
                like.
              </p>
            )}
            {answers[q.id] !== undefined && (
              <button
                type="button"
                className="ax-link"
                onClick={() =>
                  setAnswers((a) => {
                    const next = { ...a }
                    delete next[q.id]
                    return next
                  })
                }
              >
                Clear my answer
              </button>
            )}

            {error && (
              <div className="ax-alert" role="alert">
                {error}
              </div>
            )}

            <div className="ax-nav">
              <button
                type="button"
                className="ax-btn ax-btn--ghost"
                onClick={() => goTo(current - 1)}
                disabled={current === 0}
              >
                <ArrowLeftIcon width={16} height={16} /> Previous
              </button>
              <span className="ax-nav__hint">Tip: press A–D to answer, ← → to move</span>
              {isLast ? (
                <button type="button" className="ax-btn ax-btn--primary" onClick={() => setConfirming(true)}>
                  Review &amp; Submit
                </button>
              ) : (
                <button type="button" className="ax-btn ax-btn--primary" onClick={() => goTo(current + 1)}>
                  {answers[q.id] !== undefined ? 'Save & Next' : 'Skip & Next'}
                  <ArrowLeftIcon width={16} height={16} className="ax-flip" />
                </button>
              )}
            </div>
          </section>

          <aside className="ax-side">
            {secondsLeft !== null && totalSeconds !== null && (
              <div className={`ax-panel ax-time-card${warning ? ' is-warning' : ''}`}>
                <span className="ax-side__label">Time left</span>
                <strong className="ax-time-card__value">{formatCountdown(secondsLeft)}</strong>
                <div className="ax-progress ax-progress--time" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (secondsLeft / totalSeconds) * 100)}%` }} />
                </div>
                <small className="ax-muted">Ends at {endLabel}</small>
              </div>
            )}

            <div className="ax-panel ax-palette">
              <div className="ax-palette__head">
                <span className="ax-side__label">Questions</span>
                <span className="ax-muted">
                  {answeredCount}/{questions.length} answered
                </span>
              </div>
              <div className="ax-progress ax-progress--done" aria-hidden="true">
                <span style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
              </div>
              <div className="ax-palette__grid">
                {questions.map((x, i) => (
                  <button
                    key={x.id}
                    type="button"
                    className={`ax-palette__item ${stateOf(x.id, i)}`}
                    onClick={() => goTo(i)}
                    aria-label={`Question ${i + 1}${answers[x.id] !== undefined ? ', answered' : ''}`}
                    aria-current={i === current ? 'step' : undefined}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <ul className="ax-legend">
                <li>
                  <span className="is-answered" /> Answered
                </li>
                <li>
                  <span className="is-skipped" /> Not answered
                </li>
                <li>
                  <span /> Not visited
                </li>
              </ul>
              <button
                type="button"
                className="ax-btn ax-btn--primary ax-btn--block"
                onClick={() => setConfirming(true)}
                disabled={busy}
              >
                Submit Test
              </button>
            </div>
          </aside>
        </div>
      </div>

      {lock && !confirming && (
        <div className="ax-modal ax-lock" role="alertdialog" aria-modal="true" aria-labelledby="ax-lock-title">
          <div className="ax-modal__card">
            <div className="ax-modal__icon is-warning">
              <LockIcon width={24} height={24} />
            </div>
            <h2 id="ax-lock-title">
              {lock === 'back' ? 'You can’t leave the test yet' : 'Test paused — you left the test screen'}
            </h2>
            <p className="ax-muted">
              {lock === 'back'
                ? 'Finish and submit your answers before leaving this page.'
                : lock === 'fullscreen'
                  ? 'You exited full screen. Go back to full screen to continue your test.'
                  : 'You switched to another tab or app. Go back to the test to continue.'}
            </p>
            {leftCount > 0 && (
              <div className="ax-alert is-warning">
                Left the test screen {leftCount} {leftCount === 1 ? 'time' : 'times'}. This is reported to your
                teacher with your answers.
              </div>
            )}
            {secondsLeft !== null && <p className="ax-muted">The timer keeps running: {formatCountdown(secondsLeft)} left.</p>}
            <button type="button" className="ax-btn ax-btn--primary ax-btn--block" onClick={() => void resume()}>
              {canFullscreen() ? 'Return to full screen & continue' : 'Continue test'}
            </button>
          </div>
        </div>
      )}

      {confirming && (
        <div className="ax-modal" role="dialog" aria-modal="true" aria-labelledby="ax-confirm-title">
          <div className="ax-modal__card">
            <div className="ax-modal__icon">
              <ExamIcon width={24} height={24} />
            </div>
            <h2 id="ax-confirm-title">Submit your test?</h2>
            <p className="ax-muted">You can’t change your answers after submitting.</p>
            <div className="ax-modal__stats">
              <div>
                <strong>{answeredCount}</strong>
                <span>Answered</span>
              </div>
              <div className={unanswered ? 'is-warning' : ''}>
                <strong>{unanswered}</strong>
                <span>Not answered</span>
              </div>
              <div>
                <strong>{questions.length}</strong>
                <span>Total</span>
              </div>
            </div>
            {unanswered > 0 && (
              <div className="ax-alert is-warning">
                {unanswered} {unanswered === 1 ? 'question is' : 'questions are'} not answered and will get 0 marks.
              </div>
            )}
            {error && (
              <div className="ax-alert" role="alert">
                {error}
              </div>
            )}
            <div className="ax-modal__actions">
              <button type="button" className="ax-btn ax-btn--ghost" onClick={() => setConfirming(false)} disabled={busy}>
                Go back
              </button>
              <button type="button" className="ax-btn ax-btn--primary" onClick={() => void finalSubmit()} disabled={busy}>
                {busy ? 'Submitting…' : 'Yes, submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}

/* ---------- Pieces ---------- */

function Shell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="ax">
      <header className="ax-topbar">
        <div className="ax-topbar__inner">
          <div className="ax-brand">
            <span className="ax-brand__mark">SM</span>
            <span className="ax-brand__text">
              <strong>Student Management Academy</strong>
              <small>Online Examination</small>
            </span>
          </div>
          {right && <div className="ax-topbar__right">{right}</div>}
        </div>
      </header>
      <main className="ax-main">{children}</main>
      <footer className="ax-footer">2026 © Student Management Academy</footer>
    </div>
  )
}

function CenterCard({
  icon,
  title,
  text,
  tone,
  children,
}: {
  icon: ReactNode
  title: string
  text: string
  tone?: 'error'
  children?: ReactNode
}) {
  return (
    <div className="ax-center">
      <div className={`ax-panel ax-center__card${tone === 'error' ? ' is-error' : ''}`}>
        <div className="ax-center__icon">{icon}</div>
        <h1>{title}</h1>
        <p className="ax-muted">{text}</p>
        {children}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ax-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ResultCard({ grade, examName }: { grade: Grade; examName: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className={`ax-panel ax-score${grade.passed ? ' is-pass' : ' is-fail'}`}>
      <div className="ax-score__ring">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={r} className="ax-score__track" />
          <circle
            cx="60"
            cy="60"
            r={r}
            className="ax-score__bar"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - Math.min(100, grade.percent) / 100)}
          />
        </svg>
        <div className="ax-score__pct">
          <strong>{grade.percent}%</strong>
          <span>{grade.passed ? 'Passed' : 'Not passed'}</span>
        </div>
      </div>
      <div className="ax-score__body">
        <span className="ax-muted">{examName}</span>
        <div className="ax-score__marks">
          {grade.score}
          <small> / {grade.max} marks</small>
        </div>
        <div className="ax-score__rows">
          <div>
            <span>Correct answers</span>
            <strong>
              {grade.correct} of {grade.total}
            </strong>
          </div>
          <div>
            <span>Pass mark</span>
            <strong>{grade.passPercent ?? PASS_PERCENT}%</strong>
          </div>
          <div>
            <span>Result</span>
            <strong className={`ax-badge${grade.passed ? ' is-pass' : ' is-fail'}`}>
              {grade.passed ? 'PASS' : 'FAIL'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}
