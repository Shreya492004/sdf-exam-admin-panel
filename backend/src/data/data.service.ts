import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, type EntityManager } from 'typeorm'
import { isClassId } from '../common/classes'
import { makePassword, makeUsername } from '../common/credentials'
import { groupByClass, toExamView, toQuestionSetView, toStudentView, toSubjectView } from '../common/mappers'
import { randomCode } from '../common/random'
import type { ExamView, QuestionSetView, StudentView, SubjectView } from '../common/types'
import { Exam, ExamAccess, ExamResult, QuestionSet, Student, Subject } from '../entities'

export type ImportPayload = {
  studentsByClass?: Record<string, StudentView[]>
  subjectsByClass?: Record<string, SubjectView[]>
  examsByClass?: Record<string, ExamView[]>
  questionBank?: QuestionSetView[]
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

@Injectable()
export class DataService {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async all() {
    const [students, subjects, exams, sets] = await Promise.all([
      this.db.getRepository(Student).find({ order: { rollNo: 'ASC' } }),
      this.db.getRepository(Subject).find({ order: { position: 'ASC' } }),
      this.db.getRepository(Exam).find({ relations: { access: true, results: true }, order: { createdAt: 'ASC' } }),
      this.db.getRepository(QuestionSet).find({ order: { createdAt: 'DESC' } }),
    ])
    return {
      studentsByClass: groupByClass(students, toStudentView),
      subjectsByClass: groupByClass(subjects, toSubjectView),
      examsByClass: groupByClass(exams, toExamView),
      questionBank: sets.map(toQuestionSetView),
    }
  }

  async import(payload: ImportPayload) {
    if (!isObject(payload)) throw new BadRequestException('Expected an object.')
    const { studentsByClass = {}, subjectsByClass = {}, examsByClass = {}, questionBank = [] } = payload
    if (![studentsByClass, subjectsByClass, examsByClass].every(isObject) || !Array.isArray(questionBank)) {
      throw new BadRequestException('Invalid data format.')
    }

    return this.db.transaction(async (m) => {
      await this.clear(m)
      const counts = { students: 0, subjects: 0, exams: 0, questionSets: 0 }
      const usernames = new Set<string>()

      for (const [classId, list] of Object.entries(studentsByClass)) {
        if (!isClassId(classId) || !Array.isArray(list)) continue
        for (const s of list) {
          let username = s.username || makeUsername(s.name, classId, s.rollNo)
          while (usernames.has(username)) username = `${username}${randomCode(2)}`
          usernames.add(username)
          await m.save(m.create(Student, { ...toStudentView(s as Student), classId, username, password: s.password || makePassword() }))
          counts.students++
        }
      }

      for (const [classId, list] of Object.entries(subjectsByClass)) {
        if (!isClassId(classId) || !Array.isArray(list)) continue
        const seen = new Set<string>()
        for (const [position, s] of list.entries()) {
          if (seen.has(s.id)) continue
          seen.add(s.id)
          await m.save(m.create(Subject, { classId, id: s.id, name: s.name, position }))
          counts.subjects++
        }
      }

      const codes = new Set<string>()
      for (const [classId, list] of Object.entries(examsByClass)) {
        if (!isClassId(classId) || !Array.isArray(list)) continue
        for (const e of list) {
          let code = e.code || randomCode(8)
          while (codes.has(code)) code = randomCode(8)
          codes.add(code)
          await m.save(
            m.create(Exam, {
              id: e.id,
              classId,
              name: e.name,
              subjectId: e.subjectId,
              code,
              date: e.date,
              startTime: e.startTime || null,
              endTime: e.endTime || null,
              questions: (e.questions ?? []).map((q) => ({ ...q, marks: q.marks ?? 1 })),
              createdAt: new Date().toISOString(),
            }),
          )
          for (const [studentId, login] of Object.entries(e.access ?? {})) {
            await m.save(m.create(ExamAccess, { examId: e.id, studentId, ...login }))
          }
          for (const [studentId, r] of Object.entries(e.results ?? {})) {
            await m.save(m.create(ExamResult, { examId: e.id, studentId, answers: r.answers ?? {}, submittedAt: r.submittedAt }))
          }
          counts.exams++
        }
      }

      for (const set of questionBank) {
        if (!isClassId(set.classId)) continue
        await m.save(m.create(QuestionSet, toQuestionSetView(set as QuestionSet)))
        counts.questionSets++
      }
      return counts
    })
  }

  private async clear(m: EntityManager) {
    for (const entity of [ExamResult, ExamAccess, Exam, QuestionSet, Subject, Student]) {
      await m.createQueryBuilder().delete().from(entity).execute()
    }
  }
}
