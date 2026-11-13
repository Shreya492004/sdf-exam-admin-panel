import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm'
import { Exam } from './exam.entity'

/** A student added to an exam, with the login generated for that exam. */
@Entity('exam_access')
export class ExamAccess {
  @PrimaryColumn('varchar')
  examId: string

  @PrimaryColumn('varchar')
  studentId: string

  @Column('varchar')
  username: string

  @Column('varchar')
  password: string

  @ManyToOne(() => Exam, (e) => e.access, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam: Relation<Exam>
}
