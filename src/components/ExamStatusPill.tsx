import type { ExamStatus } from '../data/exams'

const LABELS: Record<ExamStatus, string> = {
  upcoming: 'Upcoming',
  live: 'Live now',
  ended: 'Ended',
  open: 'No time limit',
}

/** Coloured pill showing whether an exam's time window is upcoming, live or over. */
export default function ExamStatusPill({ status }: { status: ExamStatus }) {
  return <span className={`exam-status is-${status}`}>{LABELS[status]}</span>
}
