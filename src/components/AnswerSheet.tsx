import type { Exam } from '../data/exams'
import { CheckIcon } from './Icons'
import { PASS_PERCENT, selectedOptionIndex, type Grade } from '../utils/score'

const LETTERS = ['A', 'B', 'C', 'D']

type Props = {
  exam: Exam
  answers: Record<string, number>
  /** Show just one question in the student exam flow; omit for full-sheet views. */
  questionIndex?: number
  /** Pass to let the user pick answers; omit to show the marked review. */
  onAnswer?: (questionId: string, option: number) => void
}

/** MCQ questions, either answerable or as a marked review. */
export default function AnswerSheet({ exam, answers, questionIndex, onAnswer }: Props) {
  const reviewing = !onAnswer
  const answeredCount = exam.questions.filter((q) => answers[q.id] !== undefined).length
  const visibleQuestions =
    questionIndex === undefined
      ? exam.questions.map((question, index) => ({ question, index }))
      : exam.questions[questionIndex]
        ? [{ question: exam.questions[questionIndex], index: questionIndex }]
        : []

  return (
    <>
      {!reviewing && (
        <div className="progress">
          <div className="progress__bar">
            <span style={{ width: `${(answeredCount / exam.questions.length) * 100}%` }} />
          </div>
          <span>
            {answeredCount} / {exam.questions.length} answered
          </span>
        </div>
      )}

      <ol className="question-list">
        {visibleQuestions.map(({ question: q, index: i }) => {
          const chosen = selectedOptionIndex(answers[q.id])
          const unanswered = chosen === undefined
          const isRight = chosen === q.answer
          return (
            <li key={q.id} className="question-card">
              <div className="question-card__head">
                <span className="question-card__num">Q{i + 1}</span>
                <span className="question-card__text">{q.text}</span>
                {reviewing ? (
                  <span
                    className={`result-pill${unanswered ? ' is-unanswered' : isRight ? ' is-pass' : ' is-fail'}`}
                  >
                    {unanswered ? 'Not answered' : isRight ? `+${q.marks}` : `0 / ${q.marks}`}
                  </span>
                ) : (
                  <span className="marks-tag">
                    {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                  </span>
                )}
              </div>
              <div className="option-list">
                {q.options.map((o, j) => {
                  let cls = 'option-row'
                  if (reviewing && j === q.answer) cls += ' is-correct'
                  else if (reviewing && j === chosen) cls += ' is-wrong'
                  else if (!reviewing && j === chosen) cls += ' is-selected'
                  return (
                    <label key={j} className={`${cls}${reviewing ? '' : ' is-choosable'}`}>
                      {!reviewing && (
                        <input
                          type="radio"
                          name={q.id}
                          checked={chosen === j}
                          onChange={() => onAnswer(q.id, j)}
                        />
                      )}
                      <span className="option-letter">{LETTERS[j]}</span>
                      <span>{o}</span>
                      {reviewing && j === q.answer && (
                        <span className="option-tag">
                          <CheckIcon width={14} height={14} /> Correct
                        </span>
                      )}
                      {reviewing && j === chosen && j !== q.answer && (
                        <span className="option-tag is-wrong">Student’s answer</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}

export function ScoreCard({ grade }: { grade: Grade }) {
  return (
    <div className={`score-card${grade.passed ? ' is-pass' : ' is-fail'}`}>
      <div>
        <div className="score-card__label">Score</div>
        <div className="score-card__value">
          {grade.score} <small>/ {grade.max}</small>
        </div>
      </div>
      <div className="score-card__stats">
        <span>
          {grade.correct} of {grade.total} correct
        </span>
        <span>{grade.percent}%</span>
        <span className="score-card__verdict">
          {grade.passed ? 'PASS' : 'FAIL'} <small>(pass mark {grade.passPercent ?? PASS_PERCENT}%)</small>
        </span>
      </div>
    </div>
  )
}
