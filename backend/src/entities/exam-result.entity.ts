import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm'
import { Exam } from './exam.entity'

@Entity('exam_results')
export class ExamResult {
  @PrimaryColumn('varchar')
  examId: string

  @PrimaryColumn('varchar')
  studentId: string

  /** Selected option index, keyed by question id. */
  @Column('jsonb')
  answers: Record<string, number>

  @Column('varchar')
  submittedAt: string

  /** How many times the student left the test screen (switched tab/app or exited full screen). */
  @Column('int', { default: 0 })
  leftScreenCount: number

  @ManyToOne(() => Exam, (e) => e.results, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam: Relation<Exam>
}
