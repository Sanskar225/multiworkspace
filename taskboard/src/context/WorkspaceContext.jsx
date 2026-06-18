import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../api/endpoints'
import { useAuth } from './AuthContext'

const WorkspaceContext = createContext(null)
const LAST_WORKSPACE_KEY = 'ledger_last_workspace_v1'

export function WorkspaceProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const [workspaces, setWorkspaces] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState(null)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(() => localStorage.getItem(LAST_WORKSPACE_KEY))

  const loadWorkspaces = useCallback(async () => {
    if (!token) return
    setStatus('loading')
    setError(null)
    try {
      const data = await api.getWorkspaces(token)
      setWorkspaces(data)
      setStatus('success')
      setCurrentWorkspaceId((prev) => {
        if (prev && data.some((w) => w.id === prev)) return prev
        return data[0]?.id || null
      })
    } catch (err) {
      setError(err.message || 'Could not load workspaces.')
      setStatus('error')
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated) loadWorkspaces()
    else {
      setWorkspaces([])
      setStatus('idle')
    }
  }, [isAuthenticated, loadWorkspaces])

  useEffect(() => {
    if (currentWorkspaceId) localStorage.setItem(LAST_WORKSPACE_KEY, currentWorkspaceId)
  }, [currentWorkspaceId])

  const currentWorkspace = useMemo(
    () => workspaces.find((w) => w.id === currentWorkspaceId) || null,
    [workspaces, currentWorkspaceId]
  )

  const switchWorkspace = useCallback((id) => {
    setCurrentWorkspaceId(id)
  }, [])

  const value = useMemo(
    () => ({
      workspaces,
      status,
      error,
      currentWorkspace,
      currentWorkspaceId,
      switchWorkspace,
      reload: loadWorkspaces
    }),
    [workspaces, status, error, currentWorkspace, currentWorkspaceId, switchWorkspace, loadWorkspaces]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}

/**
 * Keeps the WorkspaceContext's "current workspace" in sync with the
 * :workspaceId route param, so a direct link to a board always applies the
 * right workspace context instead of silently using whatever was last active.
 */
export function useSyncWorkspaceFromRoute() {
  const { workspaceId } = useParams()
  const { workspaces, currentWorkspaceId, switchWorkspace } = useWorkspace()
  const navigate = useNavigate()

  useEffect(() => {
    if (!workspaceId || workspaces.length === 0) return
    const exists = workspaces.some((w) => w.id === workspaceId)
    if (!exists) {
      navigate('/workspaces', { replace: true })
      return
    }
    if (workspaceId !== currentWorkspaceId) switchWorkspace(workspaceId)
  }, [workspaceId, workspaces, currentWorkspaceId, switchWorkspace, navigate])
}
