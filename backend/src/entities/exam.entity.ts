import { Column, Entity, Index, OneToMany, PrimaryColumn, type Relation } from 'typeorm'
import type { Question } from '../common/types'
import { ExamAccess } from './exam-access.entity'
import { ExamResult } from './exam-result.entity'

@Entity('exams')
export class Exam {
  @PrimaryColumn('varchar')
  id: string

  @Index()
  @Column('varchar')
  classId: string

  @Column('varchar')
  name: string

  @Column('varchar')
  subjectId: string

  /** Code used in the public exam link (?exam=<code>). */
  @Column('varchar', { unique: true })
  code: string

  @Column('varchar')
  date: string

  @Column('varchar', { nullable: true })
  startTime: string | null

  @Column('varchar', { nullable: true })
  endTime: string | null

  @Column('jsonb')
  questions: Question[]

  @Column('varchar')
  createdAt: string

  /** Minimum percentage needed to pass this exam. */
  @Column('int', { default: 35 })
  passPercent: number

  @OneToMany(() => ExamAccess, (a) => a.exam, { cascade: true })
  access: Relation<ExamAccess>[]

  @OneToMany(() => ExamResult, (r) => r.exam, { cascade: true })
  results: Relation<ExamResult>[]
}
