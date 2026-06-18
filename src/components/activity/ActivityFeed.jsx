import { useCallback, useEffect, useRef, useState } from 'react'
import { Radio, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import * as api from '../../api/endpoints'
import { simulateOneEdit } from '../../api/activitySimulator'
import { usePolling } from '../../hooks/usePolling'
import { timeAgo } from '../../utils/time'
import Avatar from '../common/Avatar'
import Spinner from '../common/Spinner'

const POLL_MS = 8000
const SIMULATE_MS = 14000

/**
 * Right-hand activity rail, scoped to a workspace. Polls /workspace activity
 * on an interval and separately runs a background "other teammates are
 * editing things" simulator so there's always something for the feed (and
 * the board it's open next to) to pick up. See api/activitySimulator.js.
 */
export default function ActivityFeed({ workspaceId, open, onClose }) {
  const { token, user } = useAuth()
  const [entries, setEntries] = useState([])
  const [status, setStatus] = useState('idle')
  const [pulse, setPulse] = useState(false)
  const lastIdsRef = useRef(new Set())

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const data = await api.getActivity(workspaceId, token)
      setEntries((prev) => {
        const isFirstLoad = prev.length === 0 && lastIdsRef.current.size === 0
        if (!isFirstLoad && data.some((d) => !lastIdsRef.current.has(d.id))) {
          setPulse(true)
          setTimeout(() => setPulse(false), 1200)
        }
        lastIdsRef.current = new Set(data.map((d) => d.id))
        return data
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }, [workspaceId, token])

  useEffect(() => {
    setStatus('loading')
    load()
  }, [load])

  usePolling(load, POLL_MS, Boolean(workspaceId))

  // Background simulator standing in for other teammates' clients.
  usePolling(
    () => {
      simulateOneEdit(workspaceId, user?.id)
    },
    SIMULATE_MS,
    Boolean(workspaceId)
  )

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 w-80 max-w-[88vw] transform border-l border-ink/8 bg-surface shadow-lift transition-transform lg:static lg:z-0 lg:w-72 lg:translate-x-0 lg:shadow-none ${
        open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      } ${open ? 'block' : 'hidden lg:block'}`}
    >
      <div className="flex h-16 items-center justify-between border-b border-ink/8 px-4">
        <div className="flex items-center gap-2">
          <Radio className={`h-4 w-4 text-azure-500 ${pulse ? 'animate-pulse' : ''}`} />
          <h2 className="font-display text-sm font-semibold text-ink">Activity</h2>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-ink-faint hover:bg-ink/5 lg:hidden" aria-label="Close activity">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="h-[calc(100%-4rem)] overflow-y-auto px-4 py-3">
        {status === 'loading' && <Spinner size="sm" label="" className="py-8" />}
        {status === 'error' && <p className="py-6 text-center text-sm text-ember-500">Couldn't load activity.</p>}
        {status === 'success' && entries.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-faint">No activity yet in this workspace.</p>
        )}
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-2.5">
              <Avatar user={entry.actor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-ink">
                  <span className="font-medium">{entry.actor?.name || 'Someone'}</span>{' '}
                  <span className="text-ink-soft">{entry.message}</span>
                </p>
                <p className="font-mono text-[11px] text-ink-faint">{timeAgo(entry.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
