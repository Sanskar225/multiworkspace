import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, Globe2, Lock, X } from 'lucide-react'
import clsx from 'clsx'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import { useWorkspace } from '../../context/WorkspaceContext'
import { useAuth } from '../../context/AuthContext'
import * as api from '../../api/endpoints'
import Spinner from '../common/Spinner'

function BoardsList({ onNavigate }) {
  const { currentWorkspace, currentWorkspaceId } = useWorkspace()
  const { token } = useAuth()
  const [boards, setBoards] = useState([])
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (!currentWorkspaceId) return
    setStatus('loading')
    api
      .getBoards(currentWorkspaceId, token)
      .then((data) => {
        setBoards(data)
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [currentWorkspaceId, token])

  if (status === 'loading') return <Spinner size="sm" label="" className="py-6" />
  if (status === 'error') return <p className="px-3 py-4 text-sm text-ember-500">Couldn't load boards.</p>

  return (
    <ul className="space-y-0.5">
      {boards.map((board) => (
        <li key={board.id}>
          <NavLink
            to={`/workspace/${currentWorkspace.id}/board/${board.id}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-azure-50 font-medium text-azure-700' : 'text-ink-soft hover:bg-ink/5'
              )
            }
          >
            <LayoutGrid className="h-4 w-4 shrink-0" />
            <span className="truncate">{board.title}</span>
            {board.isPublic ? (
              <Globe2 className="ml-auto h-3.5 w-3.5 shrink-0 text-azure-500" />
            ) : (
              <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-ink-faint" />
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function SidebarContents({ onNavigate }) {
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <button
        onClick={() => navigate('/workspaces')}
        className="flex items-center gap-2 text-left"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-azure-500 font-display text-sm font-bold text-white">L</div>
        <span className="font-display text-base font-semibold text-ink">Ledger</span>
      </button>

      <WorkspaceSwitcher />

      <div>
        <p className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wide text-ink-faint">Boards</p>
        <BoardsList onNavigate={onNavigate} />
      </div>
    </div>
  )
}

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Desktop: static rail */}
      <aside className="hidden w-64 shrink-0 border-r border-ink/8 bg-paper-dim/60 lg:block">
        <SidebarContents />
      </aside>

      {/* Mobile: slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={onCloseMobile} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-paper shadow-lift">
            <button
              onClick={onCloseMobile}
              className="absolute right-3 top-3 rounded-md p-1.5 text-ink-faint hover:bg-ink/5"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContents onNavigate={onCloseMobile} />
          </div>
        </div>
      )}
    </>
  )
}
