import { Column, Entity, Index, PrimaryColumn } from 'typeorm'
import type { Question } from '../common/types'

@Entity('question_sets')
export class QuestionSet {
  @PrimaryColumn('varchar')
  id: string

  @Column('varchar')
  title: string

  @Index()
  @Column('varchar')
  classId: string

  @Column('varchar')
  subjectId: string

  @Column('varchar')
  createdAt: string

  @Column('jsonb')
  questions: Question[]
}
