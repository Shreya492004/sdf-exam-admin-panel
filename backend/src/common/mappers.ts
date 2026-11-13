import type { Exam, QuestionSet, Student, Subject } from '../entities'
import type { ExamView, QuestionSetView, StudentView, SubjectView } from './types'

/** Converts database rows to the shapes the admin panel uses. */
export const toStudentView = (s: Student): StudentView => ({
  id: s.id,
  rollNo: s.rollNo,
  name: s.name,
  gender: s.gender,
  dob: s.dob,
  parent: s.parent,
  phone: s.phone,
  joiningDate: s.joiningDate,
  username: s.username,
  password: s.password,
})

export const toSubjectView = (s: Subject): SubjectView => ({ id: s.id, name: s.name })

export const toQuestionSetView = (q: QuestionSet): QuestionSetView => ({
  id: q.id,
  title: q.title,
  classId: q.classId,
  subjectId: q.subjectId,
  createdAt: q.createdAt,
  questions: q.questions,
})

export const toExamView = (e: Exam): ExamView => {
  const view: ExamView = {
    id: e.id,
    name: e.name,
    subjectId: e.subjectId,
    code: e.code,
    date: e.date,
    createdAt: e.createdAt,
    passPercent: e.passPercent,
    questions: e.questions,
    results: Object.fromEntries(
      (e.results ?? []).map((r) => [r.studentId, { answers: r.answers, submittedAt: r.submittedAt, leftScreenCount: r.leftScreenCount ?? 0 }]),
    ),
  }
  if (e.startTime) view.startTime = e.startTime
  if (e.endTime) view.endTime = e.endTime
  if (e.access && e.access.length > 0) {
    view.access = Object.fromEntries(e.access.map((a) => [a.studentId, { username: a.username, password: a.password }]))
  }
  return view
}

/** Groups rows by class id: { lkg: [...], ukg: [...] }. */
export const groupByClass = <T extends { classId: string }, V>(rows: T[], map: (row: T) => V) => {
  const out: Record<string, V[]> = {}
  rows.forEach((row) => {
    ;(out[row.classId] ??= []).push(map(row))
  })
  return out
}
