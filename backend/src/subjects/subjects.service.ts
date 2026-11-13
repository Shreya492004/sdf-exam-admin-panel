import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { assertClass, slug } from '../common/guards'
import { toSubjectView } from '../common/mappers'
import { Subject } from '../entities'

@Injectable()
export class SubjectsService {
  constructor(@InjectRepository(Subject) private readonly subjects: Repository<Subject>) {}

  async list(classId: string) {
    assertClass(classId)
    const rows = await this.subjects.find({ where: { classId }, order: { position: 'ASC' } })
    return rows.map(toSubjectView)
  }

  async add(classId: string, rawName: string) {
    assertClass(classId)
    const name = rawName.trim()
    const existing = await this.subjects.findBy({ classId })
    if (existing.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      throw new ConflictException(`${name} is already a subject in this class.`)
    }
    const base = slug(name)
    let id = base
    for (let n = 2; existing.some((s) => s.id === id); n++) id = `${base}-${n}`
    const position = existing.reduce((m, s) => Math.max(m, s.position), -1) + 1
    await this.subjects.save(this.subjects.create({ classId, id, name, position }))
    return this.list(classId)
  }

  async remove(classId: string, subjectId: string) {
    assertClass(classId)
    const result = await this.subjects.delete({ classId, id: subjectId })
    if (!result.affected) throw new NotFoundException('Subject not found.')
    return this.list(classId)
  }
}
