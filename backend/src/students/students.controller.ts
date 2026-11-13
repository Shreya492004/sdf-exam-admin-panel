import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { NewStudentDto } from '../common/dto'
import { StudentsService } from './students.service'

@Controller()
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Get('classes/:classId/students')
  list(@Param('classId') classId: string) {
    return this.service.list(classId)
  }

  @Post('classes/:classId/students')
  create(@Param('classId') classId: string, @Body() body: NewStudentDto) {
    return this.service.create(classId, body)
  }

  @Post('classes/:classId/students/reset-passwords')
  resetClassPasswords(@Param('classId') classId: string) {
    return this.service.resetClassPasswords(classId)
  }

  @Post('students/:studentId/reset-password')
  resetPassword(@Param('studentId') studentId: string) {
    return this.service.resetPassword(studentId)
  }
}
