import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AttendController } from './attend/attend.controller'
import { AuthModule } from './auth/auth.module'
import { DataController } from './data/data.controller'
import { DataService } from './data/data.service'
import { entities } from './entities'
import { ExamsController } from './exams/exams.controller'
import { ExamsService } from './exams/exams.service'
import { HealthController } from './health.controller'
import { QuestionSetsController } from './question-sets/question-sets.controller'
import { QuestionSetsService } from './question-sets/question-sets.service'
import { SeedService } from './seed/seed.service'
import { StudentsController } from './students/students.controller'
import { StudentsService } from './students/students.service'
import { SubjectsController } from './subjects/subjects.controller'
import { SubjectsService } from './subjects/subjects.service'

const env = process.env

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(env.DATABASE_URL
        ? { url: env.DATABASE_URL }
        : {
            host: env.DB_HOST ?? 'localhost',
            port: Number(env.DB_PORT ?? 5432),
            username: env.DB_USER ?? 'school',
            password: env.DB_PASSWORD ?? 'school',
            database: env.DB_NAME ?? 'student_management',
          }),
      ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      entities,
      // Creates/updates tables from the entities. Turn off and use migrations in production.
      synchronize: env.DB_SYNCHRONIZE !== 'false',
      retryAttempts: 5,
      retryDelay: 2000,
    }),
    TypeOrmModule.forFeature(entities),
    AuthModule,
  ],
  controllers: [
    HealthController,
    DataController,
    StudentsController,
    SubjectsController,
    QuestionSetsController,
    ExamsController,
    AttendController,
  ],
  providers: [DataService, StudentsService, SubjectsService, QuestionSetsService, ExamsService, SeedService],
})
export class AppModule {}
