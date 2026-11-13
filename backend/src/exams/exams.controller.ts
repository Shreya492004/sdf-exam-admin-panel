import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { AnswersDto, ExamDto, ExamStudentsDto, NewExamDto } from '../common/dto'
import { cleanAnswers } from '../common/guards'
import { ExamsService } from './exams.service'

@Controller()
export class ExamsController {
  constructor(private readonly service: ExamsService) {}

  @Get('classes/:classId/exams')
  list(@Param('classId') classId: string) {
    return this.service.list(classId)
  }

  @Post('classes/:classId/exams')
  create(@Param('classId') classId: string, @Body() body: NewExamDto) {
    return this.service.create(classId, body)
  }

  @Get('exams/:examId')
  get(@Param('examId') examId: string) {
    return this.service.view(examId)
  }

  @Put('exams/:examId')
  update(@Param('examId') examId: string, @Body() body: ExamDto) {
    return this.service.update(examId, body)
  }

  @Delete('exams/:examId')
  remove(@Param('examId') examId: string) {
    return this.service.remove(examId)
  }

  @Put('exams/:examId/students')
  setStudents(@Param('examId') examId: string, @Body() body: ExamStudentsDto) {
    return this.service.setStudents(examId, body.studentIds)
  }

  @Post('exams/:examId/students/:studentId/reset-password')
  resetPassword(@Param('examId') examId: string, @Param('studentId') studentId: string) {
    return this.service.resetAccessPassword(examId, studentId)
  }

  @Put('exams/:examId/results/:studentId')
  saveResult(@Param('examId') examId: string, @Param('studentId') studentId: string, @Body() body: AnswersDto) {
    return this.service.saveResult(examId, studentId, cleanAnswers(body.answers))
  }
}
