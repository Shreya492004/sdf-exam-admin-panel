import { useCallback, useEffect, useRef, useState } from 'react'
import { api, errorMessage } from './api'
import { withCredentials, type NewStudent, type Student } from './students'
import { withQuestionMarks, type Exam, type NewExam, type Question, type QuestionSet } from './exams'
import type { Subject } from './subjects'

type AllData = {
  studentsByClass: Record<string, Student[]>
  examsByClass: Record<string, Exam[]>
  subjectsByClass: Record<string, Subject[]>
  questionBank: QuestionSet[]
}

export type AddSubjectResult = { error: string; subject?: Subject }

const EMPTY: AllData ={ studentsByClass: {}, examsByClass: {}, subjectsByClass: {}, questionBank: [] }

/** How often the panel re-fetches, so results submitted from exam links show up. */
const REFRESH_MS = 15000

// ---- Data saved in the browser by the old (localStorage) version of the panel ----
const LEGACY_PREFIX = 'sm-admin-data-v1'
const LEGACY_KEYS = ['students', 'subjects', 'exams', 'questions'].map((k) => `${LEGACY_PREFIX}-${k}`)

const readLegacy = (key: string) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : undefined
  } catch {
    return undefined
  }
}

const hasLegacyData = () => LEGACY_KEYS.some((k) => readLegacy(k) !== undefined)

const clearLegacy = () => {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}

/** Question bank saved before question sets existed was a flat list of questions. */
const withQuestionSets = (stored: QuestionSet[]): QuestionSet[] => {
  if (stored.length === 0 || 'questions' in stored[0]) return stored
  const legacy = stored as unknown as (Question & { classId?: string; subjectId?: string })[]
  const groups = new Map<string, QuestionSet>()
  legacy.forEach((q) => {
    const classId = q.classId ?? ''
    const subjectId = q.subjectId ?? ''
    const key = `${classId}:${subjectId}`
    const group = groups.get(key) ?? {
      id: `migrated-${key || 'uncategorized'}`,
      title: 'Imported question set',
      classId,
      subjectId,
      createdAt: new Date().toISOString(),
      questions: [],
    }
    group.questions.push({ id: q.id, text: q.text, options: q.options, answer: q.answer, marks: q.marks ?? 1 })
    groups.set(key, group)
  })
  return [...groups.values()]
}

const legacyPayload = (): AllData => ({
  studentsByClass: withCredentials((readLegacy(LEGACY_KEYS[0]) as AllData['studentsByClass']) ?? {}),
  subjectsByClass: (readLegacy(LEGACY_KEYS[1]) as AllData['subjectsByClass']) ?? {},
  examsByClass: withQuestionMarks((readLegacy(LEGACY_KEYS[2]) as AllData['examsByClass']) ?? {}),
  questionBank: withQuestionSets((readLegacy(LEGACY_KEYS[3]) as QuestionSet[]) ?? []),
})

const byNewest = (a: QuestionSet, b: QuestionSet) => b.createdAt.localeCompare(a.createdAt)

/**
 * All app data + actions. Data comes from the NestJS API and is only held in memory —
 * every change is saved to the server (PostgreSQL) first, then shown.
 */
export function useAppData(enabled = true) {
  const [data, setData] = useState<AllData>(EMPTY)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [legacy, setLegacy] = useState(hasLegacyData)
  const busy = useRef(0)

  const reload = useCallback(
    () =>
      api<AllData>('/data').then(
        (next) => {
          setData({ ...EMPTY, ...next })
          setStatus('ready')
        },
        (e: unknown) => {
          setStatus((s) => (s === 'ready' ? s : 'error'))
          setError(errorMessage(e))
        },
      ),
    [],
  )

  useEffect(() => {
    if (!enabled) return
    void reload()
    const refresh = () => {
      if (document.visibilityState === 'visible' && busy.current === 0) void reload()
    }
    const id = window.setInterval(refresh, REFRESH_MS)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', refresh)
    }
  }, [enabled, reload])

  /** Runs an API call; on failure shows the error and returns undefined. */
  const run = async <T,>(call: () => Promise<T>): Promise<T | undefined> => {
    busy.current++
    try {
      setError('')
      return await call()
    } catch (e) {
      setError(errorMessage(e))
      return undefined
    } finally {
      busy.current--
    }
  }

  const putStudent = (classId: string, student: Student) =>
    setData((d) => {
      const list = d.studentsByClass[classId] ?? []
      const next = list.some((s) => s.id === student.id)
        ? list.map((s) => (s.id === student.id ? student : s))
        : [...list, student]
      return { ...d, studentsByClass: { ...d.studentsByClass, [classId]: next } }
    })

  const putExam = (classId: string, exam: Exam) =>
    setData((d) => {
      const list = d.examsByClass[classId] ?? []
      const next = list.some((e) => e.id === exam.id) ? list.map((e) => (e.id === exam.id ? exam : e)) : [...list, exam]
      return { ...d, examsByClass: { ...d.examsByClass, [classId]: next } }
    })

  const putSet = (set: QuestionSet) =>
    setData((d) => ({
      ...d,
      questionBank: [...d.questionBank.filter((s) => s.id !== set.id), set].sort(byNewest),
    }))

  const dropSet = (id: string) => setData((d) => ({ ...d, questionBank: d.questionBank.filter((s) => s.id !== id) }))

  const setSubjects = (classId: string, list: Subject[]) =>
    setData((d) => ({ ...d, subjectsByClass: { ...d.subjectsByClass, [classId]: list } }))

  // ---- Question bank ----
  const addQuestionSet = (classId: string, subjectId: string, title: string, questions: Question[]) =>
    run(async () => {
      const set = await api<QuestionSet>('/question-sets', {
        method: 'POST',
        body: { classId, subjectId, title, questions },
      })
      putSet(set)
      return set
    })

  const updateQuestionSet = (questionSet: QuestionSet) =>
    run(async () => {
      const { id, title, classId, subjectId, questions } = questionSet
      const set = await api<QuestionSet>(`/question-sets/${id}`, { method: 'PUT', body: { title, classId, subjectId, questions } })
      putSet(set)
      return set
    })

  const removeQuestionSet = (questionSetId: string) =>
    run(async () => {
      await api(`/question-sets/${questionSetId}`, { method: 'DELETE' })
      dropSet(questionSetId)
    })

  const removeQuestion = (questionId: string) =>
    run(async () => {
      const res = await api<QuestionSet | { deletedSet: string }>(`/questions/${encodeURIComponent(questionId)}`, {
        method: 'DELETE',
      })
      if ('deletedSet' in res) dropSet(res.deletedSet)
      else putSet(res)
    })

  // ---- Subjects ----
  /** Adds a subject. Returns the new subject, or the reason it failed (shown next to the form). */
  const addSubject = async (classId: string, name: string): Promise<AddSubjectResult> => {
    busy.current++
    try {
      const list = await api<Subject[]>(`/classes/${classId}/subjects`, { method: 'POST', body: { name } })
      setSubjects(classId, list)
      return { error: '', subject: list.find((s) => s.name.toLowerCase() === name.trim().toLowerCase()) }
    } catch (e) {
      return { error: errorMessage(e) }
    } finally {
      busy.current--
    }
  }

  const removeSubject = (classId: string, subjectId: string) =>
    run(async () => setSubjects(classId, await api<Subject[]>(`/classes/${classId}/subjects/${subjectId}`, { method: 'DELETE' })))

  // ---- Students ----
  /** Adds a student; the server generates the roll number, username and password. */
  const addStudent = (classId: string, s: NewStudent) =>
    run(async () => {
      const student = await api<Student>(`/classes/${classId}/students`, { method: 'POST', body: s })
      putStudent(classId, student)
      return student
    })

  const resetPassword = (classId: string, studentId: string) =>
    run(async () => putStudent(classId, await api<Student>(`/students/${studentId}/reset-password`, { method: 'POST' })))

  const resetClassPasswords = (classId: string) =>
    run(async () => {
      const list = await api<Student[]>(`/classes/${classId}/students/reset-passwords`, { method: 'POST' })
      setData((d) => ({ ...d, studentsByClass: { ...d.studentsByClass, [classId]: list } }))
    })

  // ---- Exams ----
  /** Creates an exam with the link code shown on the form. */
  const addExam = (classId: string, e: NewExam, code?: string) =>
    run(async () => {
      const exam = await api<Exam>(`/classes/${classId}/exams`, { method: 'POST', body: { ...e, code } })
      putExam(classId, exam)
      return exam
    })

  const updateExam = (classId: string, exam: Exam) =>
    run(async () => {
      const { name, subjectId, date, startTime, endTime, questions, passPercent } = exam
      putExam(
        classId,
        await api<Exam>(`/exams/${exam.id}`, { method: 'PUT', body: { name, subjectId, date, startTime, endTime, questions, passPercent } }),
      )
    })

  /** Sets which students are added to an exam. The server keeps existing logins and generates new ones. */
  const setExamStudents = (classId: string, examId: string, studentIds: string[]) =>
    run(async () => {
      const exam = await api<Exam>(`/exams/${examId}/students`, { method: 'PUT', body: { studentIds } })
      putExam(classId, exam)
      return exam
    })

  const resetExamPassword = (classId: string, examId: string, studentId: string) =>
    run(async () =>
      putExam(classId, await api<Exam>(`/exams/${examId}/students/${studentId}/reset-password`, { method: 'POST' })),
    )

  /** Saves a student's answers from the admin panel (conduct / correct an attempt). */
  const submitResult = (classId: string, examId: string, studentId: string, answers: Record<string, number>) =>
    run(async () =>
      putExam(classId, await api<Exam>(`/exams/${examId}/results/${studentId}`, { method: 'PUT', body: { answers } })),
    )

  // ---- Old browser data ----
  /** Moves data saved in this browser by the old panel to the server (replacing what the server has). */
  const importLegacy = () =>
    run(async () => {
      const res = await api<{ data: AllData }>('/data/import', { method: 'POST', body: legacyPayload() })
      setData({ ...EMPTY, ...res.data })
      clearLegacy()
      setLegacy(false)
    })

  const discardLegacy = () => {
    clearLegacy()
    setLegacy(false)
  }

  return {
    ...data,
    status,
    error,
    clearError: () => setError(''),
    reload,
    legacy,
    importLegacy,
    discardLegacy,
    addQuestionSet,
    updateQuestionSet,
    removeQuestionSet,
    removeQuestion,
    addSubject,
    removeSubject,
    addStudent,
    resetPassword,
    resetClassPasswords,
    addExam,
    updateExam,
    setExamStudents,
    resetExamPassword,
    submitResult,
  }
}

export type AppData = ReturnType<typeof useAppData>
