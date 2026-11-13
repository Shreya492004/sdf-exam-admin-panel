import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { makePassword, makeUsername } from '../common/credentials'
import { NewStudentDto } from '../common/dto'
import { assertClass } from '../common/guards'
import { toStudentView } from '../common/mappers'
import { newId } from '../common/random'
import { Student } from '../entities'

@Injectable()
export class StudentsService {
  constructor(@InjectRepository(Student) private readonly students: Repository<Student>) {}

  async list(classId: string) {
    assertClass(classId)
    const rows = await this.students.find({ where: { classId }, order: { rollNo: 'ASC' } })
    return rows.map(toStudentView)
  }

  /** Adds a student with the next roll number and an auto-generated username and password. */
  async create(classId: string, dto: NewStudentDto) {
    assertClass(classId)
    const last = await this.students.findOne({ where: { classId }, order: { rollNo: 'DESC' } })
    const rollNo = (last?.rollNo ?? 0) + 1
    const student = this.students.create({
      ...dto,
      name: dto.name.trim(),
      parent: dto.parent.trim(),
      phone: dto.phone.trim(),
      id: newId('stu'),
      classId,
      rollNo,
      username: makeUsername(dto.name, classId, rollNo),
      password: makePassword(),
    })
    return toStudentView(await this.students.save(student))
  }

  async resetPassword(studentId: string) {
    const student = await this.students.findOneBy({ id: studentId })
    if (!student) throw new NotFoundException('Student not found.')
    student.password = makePassword()
    return toStudentView(await this.students.save(student))
  }

  async resetClassPasswords(classId: string) {
    assertClass(classId)
    const rows = await this.students.findBy({ classId })
    rows.forEach((s) => (s.password = makePassword()))
    await this.students.save(rows)
    return this.list(classId)
  }
}
