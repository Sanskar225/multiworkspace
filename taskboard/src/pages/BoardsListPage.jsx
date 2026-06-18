import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, Globe2, Lock, Link2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import { useWorkspace, useSyncWorkspaceFromRoute } from '../context/WorkspaceContext'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/endpoints'
import Spinner from '../components/common/Spinner'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import { useDocumentMeta } from '../utils/seo'

export default function BoardsListPage() {
  useSyncWorkspaceFromRoute()
  const { currentWorkspace, currentWorkspaceId } = useWorkspace()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useDocumentMeta({ title: currentWorkspace ? `${currentWorkspace.name} — Ledger` : 'Ledger' })

  function load() {
    if (!currentWorkspaceId) return
    setStatus('loading')
    api
      .getBoards(currentWorkspaceId, token)
      .then((data) => {
        setBoards(data)
        setStatus('success')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }

  useEffect(load, [currentWorkspaceId, token])

  function copyPublicLink(e, boardId) {
    e.stopPropagation()
    const url = `${window.location.origin}/public/board/${boardId}`
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedId(boardId)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  return (
    <AppShell title={currentWorkspace?.name} subtitle="Boards" workspaceId={currentWorkspaceId} showActivity>
      <div className="px-4 py-6 lg:px-6">
        {status === 'loading' && <Spinner label="Loading boards…" />}
        {status === 'error' && <ErrorState message={error} onRetry={load} />}
        {status === 'success' && boards.length === 0 && (
          <EmptyState icon={LayoutGrid} title="No boards yet" message="This workspace doesn't have any boards yet." />
        )}
        {status === 'success' && boards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => navigate(`/workspace/${currentWorkspaceId}/board/${board.id}`)}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-ink/8 bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-azure-300/60 hover:shadow-lift"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-azure-50 text-azure-600">
                    <LayoutGrid className="h-4 w-4" />
                  </div>
                  {board.isPublic ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-azure-600">
                      <Globe2 className="h-3.5 w-3.5" /> Public
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-ink-faint">
                      <Lock className="h-3.5 w-3.5" /> Private
                    </span>
                  )}
                </div>
                <p className="font-display font-semibold text-ink">{board.title}</p>
                <p className="line-clamp-2 text-sm text-ink-faint">{board.description}</p>
                <p className="font-mono text-xs text-ink-faint">{board.taskCount} task{board.taskCount !== 1 ? 's' : ''}</p>

                {board.isPublic && (
                  <span
                    onClick={(e) => copyPublicLink(e, board.id)}
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-azure-600 hover:underline"
                  >
                    <Link2 className="h-3.5 w-3.5" /> {copiedId === board.id ? 'Link copied!' : 'Copy public link'}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
