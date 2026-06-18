import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Globe2, ArrowRight } from 'lucide-react'
import * as api from '../api/endpoints'
import Spinner from '../components/common/Spinner'
import Badge from '../components/common/Badge'
import { useDocumentMeta, useStructuredData } from '../utils/seo'
import { formatDate } from '../utils/time'

const PRIORITY_TONE = { high: 'high', medium: 'medium', low: 'low' }

export default function PublicBoardPage() {
  const { boardId } = useParams()
  const [board, setBoard] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    setStatus('loading')
    api
      .getPublicBoard(boardId)
      .then((data) => {
        setBoard(data)
        setStatus('success')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('error')
      })
  }, [boardId])

  useDocumentMeta(
    board
      ? {
          title: `${board.title} — shared board on Ledger`,
          description: board.description || `A shared task board from ${board.workspaceName} on Ledger.`,
          type: 'article'
        }
      : { title: 'Shared board — Ledger' }
  )

  // Machine-readable structure for crawlers/link unfurlers: the board as a
  // named list whose items are the tasks, grouped implicitly by column order.
  useStructuredData(() => {
    if (!board) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: board.title,
      description: board.description,
      numberOfItems: board.tasks.length,
      itemListElement: board.tasks.map((task, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: task.title,
        description: task.description || undefined
      }))
    }
  }, [board])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Spinner label="Loading shared board…" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
        <Globe2 className="h-8 w-8 text-ink-faint" />
        <h1 className="font-display text-xl font-semibold text-ink">This board isn't available</h1>
        <p className="max-w-sm text-sm text-ink-faint">{error || "It may have been made private, or the link is incorrect."}</p>
        <Link to="/login" className="mt-1 text-sm font-medium text-azure-600 hover:underline">Sign in to Ledger</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/8 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-azure-500 font-display text-sm font-bold text-white">L</div>
            <span className="font-display text-base font-semibold text-ink">Ledger</span>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/5"
          >
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <p className="flex items-center gap-1.5 text-sm font-medium text-azure-600">
          <Globe2 className="h-4 w-4" /> Publicly shared board · {board.workspaceName}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink lg:text-3xl">{board.title}</h1>
        {board.description && <p className="mt-2 max-w-2xl text-ink-soft">{board.description}</p>}
        <p className="mt-3 text-xs text-ink-faint">
          This is a read-only view anyone with the link can see. Sign in to edit, comment, or move tasks.
        </p>

        <div className="mt-8 flex gap-4 overflow-x-auto pb-4">
          {board.columns.map((column) => {
            const tasks = board.tasks.filter((t) => t.columnId === column.id).sort((a, b) => a.order - b.order)
            return (
              <section key={column.id} className="w-72 shrink-0 rounded-2xl bg-paper-dim/70 p-3.5">
                <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-ink">
                  {column.title}
                  <span className="rounded-full bg-ink/8 px-1.5 py-0.5 text-[11px] font-mono text-ink-soft">{tasks.length}</span>
                </h2>
                <ul className="space-y-2.5">
                  {tasks.map((task) => (
                    <li key={task.id} className="rounded-xl border border-ink/8 bg-white p-3.5 shadow-card">
                      <Badge tone={PRIORITY_TONE[task.priority] || 'neutral'}>{task.priority}</Badge>
                      <p className="mt-2 text-sm font-medium leading-snug text-ink">{task.title}</p>
                      {task.description && <p className="mt-1 text-xs leading-snug text-ink-faint">{task.description}</p>}
                      <div className="mt-3 flex items-center justify-between text-[11px] text-ink-faint">
                        <span className="font-mono">{formatDate(task.updatedAt)}</span>
                        {task.assigneeName && <span className="truncate">{task.assigneeName}</span>}
                      </div>
                    </li>
                  ))}
                  {tasks.length === 0 && <li className="py-4 text-center text-xs text-ink-faint">No tasks</li>}
                </ul>
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}
