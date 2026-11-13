import { Fragment, type ReactNode } from 'react'
import { ArrowLeftIcon } from './Icons'

export type Crumb = { label: string; onClick?: () => void }

type Props = {
  title: string
  crumbs: Crumb[]
  onBack?: () => void
  action?: ReactNode
}

/** Blue header with back button, title and breadcrumb ("Home / ..."). */
export default function PageHeader({ title, crumbs, onBack, action }: Props) {
  return (
    <header className="page-header">
      <div className="page-header__left">
        {onBack && (
          <button type="button" className="back-button" aria-label="Back" onClick={onBack}>
            <ArrowLeftIcon width={18} height={18} />
          </button>
        )}
        <div>
          <h1>{title}</h1>
          <div className="breadcrumb">
            Home
            {crumbs.map((c) => (
              <Fragment key={c.label}>
                <span>/</span>
                {c.onClick ? (
                  <button type="button" className="breadcrumb-link" onClick={c.onClick}>
                    {c.label}
                  </button>
                ) : (
                  c.label
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      {action}
    </header>
  )
}
