import { Exam } from './exam.entity'
import { ExamAccess } from './exam-access.entity'
import { ExamResult } from './exam-result.entity'
import { QuestionSet } from './question-set.entity'
import { Student } from './student.entity'
import { Subject } from './subject.entity'

export { Exam, ExamAccess, ExamResult, QuestionSet, Student, Subject }

export const entities = [Student, Subject, QuestionSet, Exam, ExamAccess, ExamResult]
