import type { ReactNode } from 'react'
import { classes } from '../data/classes'
import type { NewStudent, Student } from '../data/students'
import type { Exam, Question, QuestionSet } from '../data/exams'
import type { Subject } from '../data/subjects'
import type { AddSubjectResult } from '../data/store'
import PageHeader from '../components/PageHeader'
import { BookIcon, ExamIcon, UsersIcon } from '../components/Icons'
import ClassStudents from './ClassStudents'
import ClassExams from './ClassExams'
import ClassSubjects from './ClassSubjects'
import ClassQuestionBank from './ClassQuestionBank'
import ExamDetail from './ExamDetail'

export type ClassView = 'menu' | 'subjects' | 'exams' | 'students' | 'question-bank'

/** Where to open the page (e.g. straight into an exam after creating it). */
export type ClassTarget = { classId: string; view: ClassView; examId?: string }

type Props = {
  studentsByClass: Record<string, Student[]>
  examsByClass: Record<string, Exam[]>
  subjectsByClass: Record<string, Subject[]>
  questionBank: QuestionSet[]
  onAddStudent: (classId: string, student: NewStudent) => Promise<Student | undefined>
  onResetPassword: (classId: string, studentId: string) => void
  onSubmitResult: (classId: string, examId: string, studentId: string, answers: Record<string, number>) => void
  onSetExamStudents: (classId: string, examId: string, studentIds: string[]) => void
  onResetExamPassword: (classId: string, examId: string, studentId: string) => void
  onAddSubject: (classId: string, name: string) => Promise<AddSubjectResult>
  onRemoveSubject: (classId: string, subjectId: string) => void
  onUpdateQuestionSet: (questionSet: QuestionSet) => Promise<unknown>
  onDeleteQuestionSet: (questionSetId: string) => void
  /** Where the page is (from the URL). No class = the class list. */
  target: Partial<ClassTarget>
  /** Go to another class page (updates the URL). */
  onNavigate: (target: Partial<ClassTarget>) => void
}

export default function ClassesPage(props: Props) {
  const { studentsByClass, examsByClass, subjectsByClass, questionBank, target, onNavigate } = props
  const view: ClassView = target.view ?? 'menu'
  const examId = target.examId

  const selected = classes.find((c) => c.id === target.classId)
  const toClasses = () => onNavigate({})
  const toMenu = () => onNavigate({ classId: selected?.id, view: 'menu' })
  const setView = (next: ClassView) => onNavigate({ classId: selected?.id, view: next })
  const setExamId = (id: string | null) => onNavigate({ classId: selected?.id, view: 'exams', examId: id ?? undefined })
  const setSelectedId = (id: string) => onNavigate({ classId: id, view: 'menu' })

  if (selected) {
    const students = studentsByClass[selected.id] ?? []
    const exams = examsByClass[selected.id] ?? []
    const subjects = subjectsByClass[selected.id] ?? []
    const classQuestionSets = questionBank.filter((set) => set.classId === selected.id)
    const classSetCount = classQuestionSets.length
    const exam = exams.find((e) => e.id === examId)

    if (view === 'question-bank') {
      return (
        <ClassQuestionBank
          cls={selected}
          questionSets={classQuestionSets}
          subjects={subjects}
          onUpdateSet={props.onUpdateQuestionSet}
          onDeleteSet={props.onDeleteQuestionSet}
          onBack={toMenu}
          onClasses={toClasses}
        />
      )
    }

    if (view === 'students') {
      return (
        <ClassStudents
          cls={selected}
          students={students}
          onBack={toMenu}
          onClasses={toClasses}
          onAdd={(s) => props.onAddStudent(selected.id, s)}
        />
      )
    }

    if (view === 'subjects') {
      return (
        <ClassSubjects
          cls={selected}
          subjects={subjects}
          exams={exams}
          questions={classQuestionSets.flatMap((set) =>
            set.questions.map((question: Question) => ({ ...question, classId: set.classId, subjectId: set.subjectId })),
          )}
          onBack={toMenu}
          onClasses={toClasses}
          onAdd={(name) => props.onAddSubject(selected.id, name)}
          onRemove={(id) => props.onRemoveSubject(selected.id, id)}
        />
      )
    }

    if (view === 'exams' && exam) {
      return (
        <ExamDetail
          cls={selected}
          exam={exam}
          subject={subjects.find((s) => s.id === exam.subjectId)}
          students={students}
          onBack={() => setExamId(null)}
          onClassMenu={toMenu}
          onClasses={toClasses}
          onSubmitResult={(sid, answers) => props.onSubmitResult(selected.id, exam.id, sid, answers)}
          onSetStudents={(ids) => props.onSetExamStudents(selected.id, exam.id, ids)}
          onResetExamPassword={(sid) => props.onResetExamPassword(selected.id, exam.id, sid)}
        />
      )
    }

    if (view === 'exams') {
      return (
        <ClassExams
          cls={selected}
          exams={exams}
          subjects={subjects}
          onBack={toMenu}
          onClasses={toClasses}
          onOpen={setExamId}
        />
      )
    }

    return (
      <div className="page">
        <PageHeader
          title={selected.label}
          onBack={toClasses}
          crumbs={[{ label: 'Classes', onClick: toClasses }, { label: selected.name }]}
        />

        <div className="option-panel">
          <h2>{selected.label}</h2>
          <p>Choose what you want to manage for this class.</p>

          <div className="action-grid">
            <ActionCard
              icon={<BookIcon width={26} height={26} />}
              title="Subjects"
              hint="Add or remove the subjects taught"
              meta={`${subjects.length} ${subjects.length === 1 ? 'subject' : 'subjects'}`}
              onClick={() => setView('subjects')}
            />
            <ActionCard
              icon={<BookIcon width={26} height={26} />}
              title="Question Bank"
              hint="View, edit or delete saved question sets"
              meta={`${classSetCount} ${classSetCount === 1 ? 'question set' : 'question sets'}`}
              onClick={() => setView('question-bank')}
            />
            <ActionCard
              icon={<ExamIcon width={26} height={26} />}
              title="Exams"
              hint="See exams, share links and check results"
              meta={`${exams.length} MCQ ${exams.length === 1 ? 'exam' : 'exams'}`}
              onClick={() => setView('exams')}
            />
            <ActionCard
              icon={<UsersIcon width={26} height={26} />}
              title="Student List"
              hint="Add students and look up their details"
              meta={`${students.length} ${students.length === 1 ? 'student' : 'students'} enrolled`}
              onClick={() => setView('students')}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title="Classes" crumbs={[{ label: 'Classes' }]} />

      <div className="option-panel">
        <h2>Classes</h2>
        <p>Choose a class to manage its subjects, exams and students.</p>

        <div className="option-grid">
          {classes.map((item) => {
            const studentCount = (studentsByClass[item.id] ?? []).length
            const examCount = (examsByClass[item.id] ?? []).length
            return (
              <button
                type="button"
                key={item.id}
                className="option-card"
                onClick={() => setSelectedId(item.id)}
              >
                <span className="option-card__text">
                  <span className="option-card__label">{item.label}</span>
                  <span className="option-card__meta">
                    {studentCount} {studentCount === 1 ? 'student' : 'students'} · {examCount}{' '}
                    {examCount === 1 ? 'exam' : 'exams'}
                  </span>
                </span>
                <span className="option-card__arrow" aria-hidden="true">›</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ActionCard({
  icon,
  title,
  meta,
  hint,
  onClick,
}: {
  icon: ReactNode
  title: string
  meta: string
  hint: string
  onClick: () => void
}) {
  return (
    <button type="button" className="action-card" onClick={onClick}>
      <span className="action-card__icon">{icon}</span>
      <span className="action-card__body">
        <span className="action-card__title">{title}</span>
        <span className="action-card__hint">{hint}</span>
        <span className="action-card__meta">{meta}</span>
      </span>
      <span className="option-card__arrow" aria-hidden="true">›</span>
    </button>
  )
}
