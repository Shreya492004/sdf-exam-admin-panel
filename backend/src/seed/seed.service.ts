import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { CLASS_IDS } from '../common/classes'
import { makePassword, makeUsername } from '../common/credentials'
import { slug } from '../common/guards'
import { randomCode } from '../common/random'
import { Exam, Student, Subject } from '../entities'
import { seedExams, seedStudents, subjectsFor } from './seed-data'

/** Fills an empty database with demo students, subjects and exams so the panel isn't blank. */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Seed')

  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async onApplicationBootstrap() {
    if (process.env.SEED_DEMO_DATA === 'false') return
    const hasData =
      (await this.db.getRepository(Student).count()) > 0 ||
      (await this.db.getRepository(Subject).count()) > 0 ||
      (await this.db.getRepository(Exam).count()) > 0
    if (hasData) return

    await this.db.transaction(async (m) => {
      for (const { classId, students } of seedStudents) {
        for (const s of students) {
          await m.save(
            m.create(Student, {
              ...s,
              id: `${classId}-${s.rollNo}`,
              classId,
              username: makeUsername(s.name, classId, s.rollNo),
              password: makePassword(),
            }),
          )
        }
      }
      for (const classId of CLASS_IDS) {
        for (const [position, name] of subjectsFor(classId).entries()) {
          await m.save(m.create(Subject, { classId, id: slug(name), name, position }))
        }
        for (const e of seedExams) {
          const id = `${classId}-${e.suffix}`
          await m.save(
            m.create(Exam, {
              id,
              classId,
              name: e.name,
              subjectId: e.subjectId,
              code: randomCode(8),
              date: e.date,
              startTime: null,
              endTime: null,
              questions: e.questions.map((q, i) => ({ ...q, id: `${id}-q${i + 1}` })),
              createdAt: new Date(Date.now() + seedExams.indexOf(e)).toISOString(),
            }),
          )
        }
      }
    })
    this.logger.log('Empty database — loaded demo students, subjects and exams.')
  }
}
