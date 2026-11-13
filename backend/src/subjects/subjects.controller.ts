import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { NewSubjectDto } from '../common/dto'
import { SubjectsService } from './subjects.service'

@Controller('classes/:classId/subjects')
export class SubjectsController {
  constructor(private readonly service: SubjectsService) {}

  @Get()
  list(@Param('classId') classId: string) {
    return this.service.list(classId)
  }

  @Post()
  add(@Param('classId') classId: string, @Body() body: NewSubjectDto) {
    return this.service.add(classId, body.name)
  }

  @Delete(':subjectId')
  remove(@Param('classId') classId: string, @Param('subjectId') subjectId: string) {
    return this.service.remove(classId, subjectId)
  }
}
