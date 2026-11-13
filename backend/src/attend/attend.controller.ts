import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import type { Request } from 'express'
import { Repository } from 'typeorm'
import { bearerToken } from '../auth/admin.guard'
import type { StudentTokenPayload } from '../auth/auth.config'
import { LoginDto } from '../auth/auth.dto'
import { Public } from '../auth/public.decorator'
import { SubmitAnswersDto } from '../common/dto'
import { examStatus, examWindow, grade, totalMarks } from '../common/exam-rules'
import { cleanAnswers } from '../common/guards'
import { Exam, ExamAccess, ExamResult, Student, Subject } from '../entities'

/** Answers are still accepted this long after the end time (covers the auto-submit when time runs out). */
const SUBMIT_GRACE_MS = 2 * 60 * 1000

/**
 * Public exam page used by students from the exam link (?exam=<code>).
 * Never sends the answer key or other students' logins.
 */
@Public()
@Controller('attend/:code')
export class AttendController {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(Exam) private readonly exams: Repository<Exam>,
    @InjectRepository(ExamAccess) private readonly access: Repository<ExamAccess>,
    @InjectRepository(ExamResult) private readonly results: Repository<ExamResult>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(Subject) private readonly subjects: Repository<Subject>,
  ) {}

  private async findExam(code: string) {
    const exam = await this.exams.findOneBy({ code })
    if (!exam) throw new NotFoundException('This exam link is invalid or the exam has been removed.')
    return exam
  }

  /** Exam details and questions, without the correct answers. */
  @Get()
  async details(@Param('code') code: string) {
    const exam = await this.findExam(code)
    const subject = await this.subjects.findOneBy({ classId: exam.classId, id: exam.subjectId })
    return {
      id: exam.id,
      classId: exam.classId,
      name: exam.name,
      subjectId: exam.subjectId,
      subjectName: subject?.name ?? null,
      date: exam.date,
      startTime: exam.startTime ?? undefined,
      endTime: exam.endTime ?? undefined,
      maxMarks: totalMarks(exam.questions),
      passPercent: exam.passPercent,
      questions: exam.questions.map((q) => ({ id: q.id, text: q.text, options: q.options, marks: q.marks })),
      hasStudents: (await this.access.countBy({ examId: exam.id })) > 0,
      serverTime: new Date().toISOString(),
    }
  }

  /** Student login with the username/password generated for this exam. */
  @Post('login')
  @HttpCode(200)
  async login(@Param('code') code: string, @Body() body: LoginDto) {
    const exam = await this.findExam(code)
    const logins = await this.access.findBy({ examId: exam.id })
    if (logins.length === 0) {
      throw new UnauthorizedException('No students have been added to this exam yet. Please check with your teacher.')
    }
    const username = body.username.trim().toLowerCase()
    const match = logins.find((a) => a.username.toLowerCase() === username && a.password === body.password)
    if (!match) {
      throw new UnauthorizedException(
        'Invalid username or password, or you have not been added to this exam. Please check with your teacher.',
      )
    }
    const status = examStatus(exam)
    if (status === 'upcoming') {
      throw new ForbiddenException('The exam has not started yet. Please log in again once it opens.')
    }
    const student = await this.students.findOneBy({ id: match.studentId })
    if (!student) throw new NotFoundException('Student not found.')

    const result = await this.results.findOneBy({ examId: exam.id, studentId: student.id })
    const payload: StudentTokenPayload = { sub: student.id, role: 'student', examId: exam.id }
    const window = examWindow(exam)
    const ttlSeconds = window ? Math.max(600, Math.ceil((window.end.getTime() - Date.now()) / 1000) + 600) : 6 * 3600
    return {
      token: await this.jwt.signAsync(payload, { expiresIn: ttlSeconds }),
      student: { id: student.id, name: student.name, rollNo: student.rollNo },
      status,
      result: result ? grade(exam.questions, result.answers, exam.passPercent) : null,
    }
  }

  /** Submits the logged-in student's answers. Each student can submit once. */
  @Post('submit')
  @HttpCode(200)
  async submit(@Param('code') code: string, @Body() body: SubmitAnswersDto, @Req() req: Request) {
    const exam = await this.findExam(code)
    const token = bearerToken(req)
    let payload: StudentTokenPayload
    try {
      payload = await this.jwt.verifyAsync<StudentTokenPayload>(token ?? '')
    } catch {
      throw new UnauthorizedException('Your exam session has expired. Please log in again.')
    }
    if (payload.role !== 'student' || payload.examId !== exam.id) {
      throw new UnauthorizedException('Please log in to this exam again.')
    }
    if (!(await this.access.existsBy({ examId: exam.id, studentId: payload.sub }))) {
      throw new ForbiddenException('You have been removed from this exam. Please check with your teacher.')
    }
    if (await this.results.existsBy({ examId: exam.id, studentId: payload.sub })) {
      throw new ConflictException('This exam was already submitted for you.')
    }
    const window = examWindow(exam)
    if (window && Date.now() < window.start.getTime()) throw new ForbiddenException('The exam has not started yet.')
    if (window && Date.now() > window.end.getTime() + SUBMIT_GRACE_MS) {
      throw new ForbiddenException('The exam has ended. Answers can no longer be submitted.')
    }

    const answers = cleanAnswers(body.answers)
    await this.results.save(
      this.results.create({
        examId: exam.id,
        studentId: payload.sub,
        answers,
        submittedAt: new Date().toISOString(),
        leftScreenCount: body.leftScreenCount ?? 0,
      }),
    )
    return { result: grade(exam.questions, answers, exam.passPercent) }
  }
}
