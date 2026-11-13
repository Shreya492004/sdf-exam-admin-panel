/** The query parameter that opens the student exam page. */
export const EXAM_PARAM = 'exam'

/** Public link students use to attend an exam. */
export const examLink = (code: string) =>
  `${window.location.origin}${window.location.pathname}?${EXAM_PARAM}=${encodeURIComponent(code)}`

/** Exam code in the current URL, if this is an exam link. */
export const examCodeFromUrl = () => new URLSearchParams(window.location.search).get(EXAM_PARAM)
