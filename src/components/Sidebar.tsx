import type { ReactNode } from 'react'
import { BookIcon, ClassIcon, DashboardIcon, ExamIcon, StudentsIcon } from './Icons'

export type PageKey = 'dashboard' | 'classes' | 'create-exam' | 'questions' | 'students'

type Props = {
  active: PageKey
  /** Mobile: drawer is open. */
  open: boolean
  /** Desktop: show icons only. */
  collapsed: boolean
  onSelect: (key: PageKey) => void
  onClose: () => void
}

const navItems: { key: PageKey; label: string; icon: ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon width={18} height={18} /> },
  { key: 'classes', label: 'Classes', icon: <ClassIcon width={18} height={18} /> },
  { key: 'create-exam', label: 'Create Test', icon: <ExamIcon width={18} height={18} /> },
  { key: 'questions', label: 'Questions', icon: <BookIcon width={18} height={18} /> },
  { key: 'students', label: 'Students', icon: <StudentsIcon width={18} height={18} /> },
]

export default function Sidebar({ active, open, collapsed, onSelect, onClose }: Props) {
  return (
    <>
      <div className={`sidebar-backdrop${open ? ' is-open' : ''}`} onClick={onClose} />
      <aside className={`sidebar${open ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><span>SM</span></div>
          <div className="brand-name">Student Management</div>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const isActive = item.key === active

            return (
              <button
                key={item.key}
                type="button"
                className={`nav-item${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                onClick={() => {
                  onSelect(item.key)
                  onClose()
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-user" title={collapsed ? 'Administrator' : undefined}>
          <div className="user-avatar">AD</div>
          <div className="user-meta">
            <div className="user-name">Administrator</div>
            <div className="user-role">Admin</div>
          </div>
        </div>
      </aside>
    </>
  )
}
