import { Column, Entity, PrimaryColumn } from 'typeorm'

/** A subject belongs to one class; the same subject id (e.g. "maths") is reused across classes. */
@Entity('subjects')
export class Subject {
  @PrimaryColumn('varchar')
  classId: string

  @PrimaryColumn('varchar')
  id: string

  @Column('varchar')
  name: string

  @Column('int', { default: 0 })
  position: number
}
