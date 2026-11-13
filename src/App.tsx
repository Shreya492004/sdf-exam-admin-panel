import { useEffect, useState } from 'react'
import Sidebar, { type PageKey } from './components/Sidebar'
import AdminMenu from './components/AdminMenu'
import { MenuIcon } from './components/Icons'
import ClassesPage, { type ClassTarget } from './pages/ClassesPage'
import CreateExam from './pages/CreateExam'
import StudentsPage from './pages/StudentsPage'
import QuestionsPage from './pages/QuestionsPage'
import AttendExam from './pages/AttendExam'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import { useAppData } from './data/store'
import { isSignedIn, setToken } from './data/auth'
import { setUnauthorizedHandler } from './data/api'
import { examCodeFromUrl } from './utils/examLink'
import { useRoute } from './utils/route'
import './App.css'
import './exams.css'
import './dashboard.css'

const COLLAPSE_KEY = 'sm-admin-sidebar-collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export default function App() {
  // The current page lives in the URL hash, so a refresh reopens it.
  const [route, navigate] = useRoute()
  const page = route.page
  // Mobile: sidebar drawer open. Desktop: sidebar collapsed to icons.
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [signedIn, setSignedInState] = useState(isSignedIn)
  const [loginNote, setLoginNote] = useState<string | undefined>()
  // An exam link (?exam=<code>) opens the student exam page instead of the admin panel.
  const examCode = examCodeFromUrl()
  // Shared by every page. Loaded from the backend; only held in memory.
  const data = useAppData(signedIn && !examCode)

  // An expired or invalid admin token sends the admin back to the login page.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null)
      setSignedInState(false)
      setLoginNote('Your session has expired. Please sign in again.')
    })
    return () => setUnauthorizedHandler(undefined)
  }, [])

  const openClass = (target: Partial<ClassTarget>) => navigate({ page: 'classes', ...target })

  const goTo = (key: PageKey) => navigate({ page: key })

  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 720px)').matches) {
      setSidebarOpen(true)
      return
    }
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      } catch {
        // Storage blocked — the toggle still works for this visit.
      }
      return !c
    })
  }

  const logout = () => {
    setToken(null)
    setSignedInState(false)
    setLoginNote('You have been logged out. Sign in to continue.')
  }

  if (examCode) return <AttendExam code={examCode} />

  if (!signedIn) {
    return (
      <LoginPage
        note={loginNote}
        onLogin={(token, remember) => {
          setToken(token, remember)
          // Stay on the page in the URL (e.g. after a session expired).
          setSignedInState(true)
        }}
      />
    )
  }

  if (data.status !== 'ready') {
    return (
      <div className="login-page">
        <div className="login-card app-status">
          {data.status === 'loading' ? (
            <p>Loading school data…</p>
          ) : (
            <>
              <h2>Can’t load data</h2>
              <p>{data.error}</p>
              <button type="button" className="btn-primary" onClick={() => void data.reload()}>
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`layout${collapsed ? ' is-collapsed' : ''}`}>
      <Sidebar
        active={page}
        open={sidebarOpen}
        collapsed={collapsed}
        onSelect={goTo}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            onClick={toggleSidebar}
          >
            <MenuIcon />
          </button>

          <div className="topbar-actions">
            <AdminMenu onLogout={logout} />
          </div>
        </header>

        <main className="content">
          {data.legacy && (
            <div className="app-banner">
              <div>
                <strong>Data from the old version was found in this browser.</strong> Move it to the server to keep
                it. This replaces the data currently on the server.
              </div>
              <div className="app-banner__actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    if (window.confirm('Move this browser’s data to the server? Server data will be replaced.')) {
                      void data.importLegacy()
                    }
                  }}
                >
                  Move to Server
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (window.confirm('Delete the old data saved in this browser? This cannot be undone.')) {
                      data.discardLegacy()
                    }
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}
          {data.error && (
            <div className="app-banner is-error" role="alert">
              <div>{data.error}</div>
              <button type="button" className="btn-link" onClick={data.clearError}>
                Dismiss
              </button>
            </div>
          )}
          {page === 'dashboard' ? (
            <Dashboard
              studentsByClass={data.studentsByClass}
              examsByClass={data.examsByClass}
              subjectsByClass={data.subjectsByClass}
              questionBank={data.questionBank}
              onNavigate={goTo}
              onOpenClass={openClass}
            />
          ) : page === 'students' ? (
            <StudentsPage studentsByClass={data.studentsByClass} onAdd={data.addStudent} />
          ) : page === 'questions' ? (
            <QuestionsPage
              subjectsByClass={data.subjectsByClass}
              onSaveSet={data.addQuestionSet}
              onAddSubject={data.addSubject}
            />
          ) : page === 'create-exam' ? (
            <CreateExam
              subjectsByClass={data.subjectsByClass}
              questionBank={data.questionBank}
              onCreate={data.addExam}
              onManageSubjects={(classId) => openClass({ classId, view: 'subjects' })}
              onOpenExam={(classId, examId) => openClass({ classId, view: 'exams', examId })}
            />
          ) : (
            <ClassesPage
              target={{ classId: route.classId, view: route.view, examId: route.examId }}
              onNavigate={openClass}
              studentsByClass={data.studentsByClass}
              examsByClass={data.examsByClass}
              subjectsByClass={data.subjectsByClass}
              questionBank={data.questionBank}
              onAddStudent={data.addStudent}
              onResetPassword={data.resetPassword}
              onSubmitResult={data.submitResult}
              onSetExamStudents={data.setExamStudents}
              onResetExamPassword={data.resetExamPassword}
              onAddSubject={data.addSubject}
              onRemoveSubject={data.removeSubject}
              onUpdateQuestionSet={data.updateQuestionSet}
              onDeleteQuestionSet={data.removeQuestionSet}
            />
          )}
        </main>

        <footer className="app-footer">2026 © Student Management Academy</footer>
      </div>
    </div>
  )
}
