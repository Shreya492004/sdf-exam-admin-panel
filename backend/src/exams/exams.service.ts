import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { makeExamUsername, makePassword } from '../common/credentials'
import { ExamDto, NewExamDto } from '../common/dto'
import { assertClass } from '../common/guards'
import { PASS_PERCENT } from '../common/exam-rules'
import { toExamView } from '../common/mappers'
import { newId, randomCode } from '../common/random'
import type { Question } from '../common/types'
import { Exam, ExamAccess, ExamResult, Student } from '../entities'

const withIds = (examId: string, questions: ExamDto['questions']): Question[] =>
  questions.map((q, i) => ({
    id: q.id || `${examId}-q${i + 1}`,
    text: q.text.trim(),
    options: q.options,
    answer: q.answer,
    marks: q.marks,
  }))

const checkTimes = (dto: ExamDto) => {
  const start = dto.startTime || null
  const end = dto.endTime || null
  if (!!start !== !!end) throw new BadRequestException('Set both a start time and an end time, or neither.')
  if (start && end && end <= start) throw new BadRequestException('End time must be after the start time.')
  return { startTime: start, endTime: end }
}

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam) private readonly exams: Repository<Exam>,
    @InjectRepository(ExamAccess) private readonly access: Repository<ExamAccess>,
    @InjectRepository(ExamResult) private readonly results: Repository<ExamResult>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
  ) {}

  /** Loads an exam with its added students and results. */
  async load(examId: string) {
    const exam = await this.exams.findOne({ where: { id: examId }, relations: { access: true, results: true } })
    if (!exam) throw new NotFoundException('Exam not found.')
    return exam
  }

  async view(examId: string) {
    return toExamView(await this.load(examId))
  }

  async list(classId: string) {
    assertClass(classId)
    const rows = await this.exams.find({
      where: { classId },
      relations: { access: true, results: true },
      order: { createdAt: 'ASC' },
    })
    return rows.map(toExamView)
  }

  /** Creates an exam with a unique link code. */
  async create(classId: string, dto: NewExamDto) {
    assertClass(classId)
    let code = dto.code ?? randomCode(8)
    if (await this.exams.existsBy({ code })) {
      if (dto.code) throw new ConflictException('This exam link code is already used. Please refresh the code.')
      while (await this.exams.existsBy({ code })) code = randomCode(8)
    }
    const id = newId('exam')
    await this.exams.save(
      this.exams.create({
        id,
        classId,
        code,
        name: dto.name.trim(),
        subjectId: dto.subjectId,
        date: dto.date,
        ...checkTimes(dto),
        questions: withIds(
          id,
          dto.questions.map((q) => ({ ...q, id: undefined })),
        ),
        passPercent: dto.passPercent ?? PASS_PERCENT,
        createdAt: new Date().toISOString(),
      }),
    )
    return this.view(id)
  }

  /** Updates the exam details and questions (added students and results are kept). */
  async update(examId: string, dto: ExamDto) {
    const exam = await this.exams.findOneBy({ id: examId })
    if (!exam) throw new NotFoundException('Exam not found.')
    Object.assign(exam, {
      name: dto.name.trim(),
      subjectId: dto.subjectId,
      date: dto.date,
      ...checkTimes(dto),
      questions: withIds(examId, dto.questions),
      ...(dto.passPercent !== undefined ? { passPercent: dto.passPercent } : {}),
    })
    await this.exams.save(exam)
    return this.view(examId)
  }

  /**
   * Sets which students are added to the exam. Students already added keep their login;
   * newly added students get a username (name + roll no) and an auto-generated password.
   */
  async setStudents(examId: string, studentIds: string[]) {
    const exam = await this.load(examId)
    const wanted = [...new Set(studentIds)]
    const found = wanted.length
      ? await this.students.findBy({ id: In(wanted), classId: exam.classId })
      : []
    if (found.length !== wanted.length) throw new BadRequestException('Some students are not in this class.')

    const keep = new Set(wanted)
    const removed = exam.access.filter((a) => !keep.has(a.studentId))
    if (removed.length) await this.access.remove(removed)

    const existing = new Set(exam.access.map((a) => a.studentId))
    const added = found
      .filter((s) => !existing.has(s.id))
      .map((s) =>
        this.access.create({
          examId,
          studentId: s.id,
          username: makeExamUsername(s.name, s.rollNo),
          password: makePassword(),
        }),
      )
    if (added.length) await this.access.save(added)
    return this.view(examId)
  }

  /** Generates a new password for one student's exam login. */
  async resetAccessPassword(examId: string, studentId: string) {
    const row = await this.access.findOneBy({ examId, studentId })
    if (!row) throw new NotFoundException('This student is not added to the exam.')
    row.password = makePassword()
    await this.access.save(row)
    return this.view(examId)
  }

  /** Saves (or replaces) a student's answers — used when the admin conducts the exam. */
  async saveResult(examId: string, studentId: string, answers: Record<string, number>) {
    const exam = await this.exams.findOneBy({ id: examId })
    if (!exam) throw new NotFoundException('Exam not found.')
    if (!(await this.students.existsBy({ id: studentId, classId: exam.classId }))) {
      throw new BadRequestException('This student is not in the exam’s class.')
    }
    await this.results.save(this.results.create({ examId, studentId, answers, submittedAt: new Date().toISOString() }))
    return this.view(examId)
  }

  async remove(examId: string) {
    const result = await this.exams.delete({ id: examId })
    if (!result.affected) throw new NotFoundException('Exam not found.')
    return { deleted: examId }
  }
}
