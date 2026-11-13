import { useCallback, useEffect, useState } from 'react'
import type { PageKey } from '../components/Sidebar'
import type { ClassView } from '../pages/ClassesPage'
import { classes } from '../data/classes'

/**
 * The page the admin is on, kept in the URL hash (e.g. #/classes/lkg/exams/<examId>),
 * so a refresh reopens the same page and the browser's back / forward buttons work.
 */
export type Route = { page: PageKey; classId?: string; view?: ClassView; examId?: string }

const PAGES: PageKey[] = ['dashboard', 'classes', 'create-exam', 'questions', 'students']
const VIEWS: ClassView[] = ['menu', 'subjects', 'exams', 'students', 'question-bank']

export const parseRoute = (hash: string): Route => {
  const [page, classId, view, examId] = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part)
      } catch {
        return part
      }
    })
  if (!PAGES.includes(page as PageKey)) return { page: 'dashboard' }
  if (page !== 'classes') return { page: page as PageKey }
  if (!classId || !classes.some((c) => c.id === classId)) return { page: 'classes' }
  const v = VIEWS.includes(view as ClassView) ? (view as ClassView) : 'menu'
  return { page: 'classes', classId, view: v, examId: v === 'exams' && examId ? examId : undefined }
}

export const routeHash = (r: Route) => {
  const parts: string[] = [r.page]
  if (r.page === 'classes' && r.classId) {
    parts.push(r.classId)
    if (r.view && r.view !== 'menu') {
      parts.push(r.view)
      if (r.view === 'exams' && r.examId) parts.push(r.examId)
    }
  }
  return `#/${parts.map(encodeURIComponent).join('/')}`
}

/** Current route + a function to go somewhere else (adds a browser history entry). */
export function useRoute(): [Route, (next: Route) => void] {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((next: Route) => {
    const hash = routeHash(next)
    if (hash !== window.location.hash) {
      window.location.hash = hash
      window.scrollTo(0, 0)
    }
    setRoute(parseRoute(hash))
  }, [])

  return [route, navigate]
}
