import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common'
import { DataService, type ImportPayload } from './data.service'

@Controller('data')
export class DataController {
  constructor(private readonly service: DataService) {}

  /** Everything the admin panel shows, in one request. */
  @Get()
  all() {
    return this.service.all()
  }

  /**
   * Replaces all server data with data saved in a browser by the old (localStorage) version of the panel.
   * Body: { studentsByClass, subjectsByClass, examsByClass, questionBank }.
   */
  @Post('import')
  @HttpCode(200)
  async import(@Body() body: ImportPayload) {
    const counts = await this.service.import(body)
    return { imported: counts, data: await this.service.all() }
  }
}
