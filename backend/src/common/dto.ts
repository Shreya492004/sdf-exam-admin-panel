import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^(\d{2}:\d{2})?$/

export class QuestionDto {
  @IsOptional()
  @IsString()
  id?: string

  @IsString()
  @IsNotEmpty()
  text: string

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options: string[]

  @IsInt()
  @Min(0)
  answer: number

  @IsInt()
  @Min(0)
  marks: number
}

const PERSON = /^[\p{L}][\p{L} .'-]*$/u
const SUBJECT = /^[\p{L}\p{N}][\p{L}\p{N} &.()/-]*$/u

export class NewStudentDto {
  @IsString()
  @Length(2, 60, { message: 'Student name must be 2-60 characters.' })
  @Matches(PERSON, { message: 'Student name can only contain letters, spaces, dots, apostrophes and hyphens.' })
  name: string

  @IsIn(['Male', 'Female'])
  gender: 'Male' | 'Female'

  @Matches(DATE, { message: 'dob must be YYYY-MM-DD' })
  dob: string

  @IsString()
  @Length(2, 60, { message: 'Parent name must be 2-60 characters.' })
  @Matches(PERSON, { message: 'Parent name can only contain letters, spaces, dots, apostrophes and hyphens.' })
  parent: string

  @Matches(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits.' })
  phone: string

  @Matches(DATE, { message: 'joiningDate must be YYYY-MM-DD' })
  joiningDate: string
}

export class NewSubjectDto {
  @IsString()
  @Length(2, 40, { message: 'Subject name must be 2-40 characters.' })
  @Matches(SUBJECT, { message: 'Subject name can only contain letters, numbers, spaces and & . - ( ) /' })
  name: string
}

export class QuestionSetDto {
  @IsString()
  @Length(3, 80, { message: 'Question set heading must be 3-80 characters.' })
  title: string

  @IsString()
  @IsNotEmpty()
  classId: string

  @IsString()
  @IsNotEmpty()
  subjectId: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[]
}

export class ExamDto {
  @IsString()
  @Length(3, 80, { message: 'Exam name must be 3-80 characters.' })
  name: string

  @IsString()
  @IsNotEmpty()
  subjectId: string

  @Matches(DATE, { message: 'date must be YYYY-MM-DD' })
  date: string

  @IsOptional()
  @Matches(TIME, { message: 'startTime must be HH:MM' })
  startTime?: string

  @IsOptional()
  @Matches(TIME, { message: 'endTime must be HH:MM' })
  endTime?: string

  @IsOptional()
  @IsInt({ message: 'Pass mark must be a whole number.' })
  @Min(1, { message: 'Pass mark must be between 1 and 100.' })
  @Max(100, { message: 'Pass mark must be between 1 and 100.' })
  passPercent?: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[]
}

export class NewExamDto extends ExamDto {
  /** Optional link code chosen by the panel (shown before the exam is saved). */
  @IsOptional()
  @Matches(/^[a-z0-9]{4,32}$/, { message: 'code must be 4-32 lowercase letters or digits' })
  code?: string
}

export class ExamStudentsDto {
  @IsArray()
  @IsString({ each: true })
  studentIds: string[]
}

export class AnswersDto {
  @IsOptional()
  answers: Record<string, number> = {}
}

/** Body of POST /attend/:code/submit. */
export class SubmitAnswersDto extends AnswersDto {
  /** Times the student left the test screen during the test. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  leftScreenCount?: number
}
