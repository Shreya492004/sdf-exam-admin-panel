import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { QuestionSetDto } from '../common/dto'
import { QuestionSetsService } from './question-sets.service'

@Controller()
export class QuestionSetsController {
  constructor(private readonly service: QuestionSetsService) {}

  @Get('question-sets')
  list(@Query('classId') classId?: string) {
    return this.service.list(classId)
  }

  @Post('question-sets')
  create(@Body() body: QuestionSetDto) {
    return this.service.create(body)
  }

  @Put('question-sets/:id')
  update(@Param('id') id: string, @Body() body: QuestionSetDto) {
    return this.service.update(id, body)
  }

  @Delete('question-sets/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }

  @Delete('questions/:questionId')
  removeQuestion(@Param('questionId') questionId: string) {
    return this.service.removeQuestion(questionId)
  }
}
