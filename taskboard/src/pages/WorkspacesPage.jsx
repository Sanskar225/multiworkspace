import { useNavigate } from 'react-router-dom'
import { Building2, LogOut, Users } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/common/Spinner'
import ErrorState from '../components/common/ErrorState'
import Avatar from '../components/common/Avatar'
import { useDocumentMeta } from '../utils/seo'

export default function WorkspacesPage() {
  const { workspaces, status, error, reload, switchWorkspace } = useWorkspace()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useDocumentMeta({ title: 'Choose a workspace — Ledger' })

  function openWorkspace(workspace) {
    switchWorkspace(workspace.id)
    navigate(`/workspace/${workspace.id}/boards`)
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-ink/8 bg-surface px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-azure-500 font-display text-sm font-bold text-white">L</div>
          <span className="font-display text-base font-semibold text-ink">Ledger</span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar user={user} size="sm" />
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-ink-faint">Choose a workspace to continue.</p>

        <div className="mt-8">
          {status === 'loading' && <Spinner label="Loading workspaces…" />}
          {status === 'error' && <ErrorState message={error} onRetry={reload} />}
          {status === 'success' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => openWorkspace(w)}
                  className="group flex flex-col items-start gap-3 rounded-2xl border border-ink/8 bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-azure-300/60 hover:shadow-lift"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-azure-50 text-azure-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-ink">{w.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                      <Users className="h-3.5 w-3.5" /> {w.members.length} member{w.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {w.members.slice(0, 5).map((m) => (
                      <Avatar key={m.id} user={m} size="sm" />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
