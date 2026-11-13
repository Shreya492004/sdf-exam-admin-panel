import { Column, Entity, Index, PrimaryColumn } from 'typeorm'

@Entity('students')
@Index(['classId', 'rollNo'], { unique: true })
export class Student {
  @PrimaryColumn('varchar')
  id: string

  @Index()
  @Column('varchar')
  classId: string

  @Column('int')
  rollNo: number

  @Column('varchar')
  name: string

  @Column('varchar')
  gender: 'Male' | 'Female'

  @Column('varchar')
  dob: string

  @Column('varchar')
  parent: string

  @Column('varchar')
  phone: string

  @Column('varchar')
  joiningDate: string

  @Column('varchar', { unique: true })
  username: string

  /** Plain text so the admin can hand it out — hash it before using this in production. */
  @Column('varchar')
  password: string
}
