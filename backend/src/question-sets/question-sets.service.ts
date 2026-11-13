import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { QuestionSetDto } from '../common/dto'
import { assertClass } from '../common/guards'
import { toQuestionSetView } from '../common/mappers'
import { newId } from '../common/random'
import type { Question } from '../common/types'
import { QuestionSet } from '../entities'

const withIds = (setId: string, questions: QuestionSetDto['questions']): Question[] =>
  questions.map((q, i) => ({
    id: q.id || `${setId}-q${i + 1}`,
    text: q.text.trim(),
    options: q.options,
    answer: q.answer,
    marks: q.marks,
  }))

@Injectable()
export class QuestionSetsService {
  constructor(@InjectRepository(QuestionSet) private readonly sets: Repository<QuestionSet>) {}

  /** Newest first. */
  async list(classId?: string) {
    const rows = await this.sets.find({ where: classId ? { classId } : {}, order: { createdAt: 'DESC' } })
    return rows.map(toQuestionSetView)
  }

  async create(dto: QuestionSetDto) {
    assertClass(dto.classId)
    const id = newId('qs')
    const set = this.sets.create({
      id,
      title: dto.title.trim(),
      classId: dto.classId,
      subjectId: dto.subjectId,
      createdAt: new Date().toISOString(),
      // New sets always get fresh question ids.
      questions: withIds(
        id,
        dto.questions.map((q) => ({ ...q, id: undefined })),
      ),
    })
    return toQuestionSetView(await this.sets.save(set))
  }

  async update(id: string, dto: QuestionSetDto) {
    const set = await this.sets.findOneBy({ id })
    if (!set) throw new NotFoundException('Question set not found.')
    assertClass(dto.classId)
    set.title = dto.title.trim()
    set.classId = dto.classId
    set.subjectId = dto.subjectId
    set.questions = withIds(id, dto.questions)
    return toQuestionSetView(await this.sets.save(set))
  }

  async remove(id: string) {
    const result = await this.sets.delete({ id })
    if (!result.affected) throw new NotFoundException('Question set not found.')
    return { deleted: id }
  }

  /** Removes one question; a set left with no questions is deleted. */
  async removeQuestion(questionId: string) {
    const all = await this.sets.find()
    const set = all.find((s) => s.questions.some((q) => q.id === questionId))
    if (!set) throw new NotFoundException('Question not found.')
    set.questions = set.questions.filter((q) => q.id !== questionId)
    if (set.questions.length === 0) {
      await this.sets.delete({ id: set.id })
      return { deletedSet: set.id }
    }
    return toQuestionSetView(await this.sets.save(set))
  }
}
