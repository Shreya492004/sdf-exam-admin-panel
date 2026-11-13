/** Shapes shared with the admin panel (see the frontend's src/data/*.ts). */
export type Question = {
  id: string
  text: string
  options: string[]
  /** Index into `options` of the correct answer. */
  answer: number
  marks: number
}

export type ExamLogin = { username: string; password: string }

export type ExamResultView = { answers: Record<string, number>; submittedAt: string; leftScreenCount: number }

export type ExamView = {
  id: string
  name: string
  subjectId: string
  code: string
  date: string
  startTime?: string
  endTime?: string
  questions: Question[]
  createdAt: string
  passPercent: number
  results: Record<string, ExamResultView>
  access?: Record<string, ExamLogin>
}

export type StudentView = {
  id: string
  rollNo: number
  name: string
  gender: 'Male' | 'Female'
  dob: string
  parent: string
  phone: string
  joiningDate: string
  username: string
  password: string
}

export type SubjectView = { id: string; name: string }

export type QuestionSetView = {
  id: string
  title: string
  classId: string
  subjectId: string
  createdAt: string
  questions: Question[]
}
