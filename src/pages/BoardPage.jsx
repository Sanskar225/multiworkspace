import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Board from '../components/board/Board'
import Spinner from '../components/common/Spinner'
import ErrorState from '../components/common/ErrorState'
import { useBoardStore } from '../store/boardStore'
import { useWorkspace, useSyncWorkspaceFromRoute } from '../context/WorkspaceContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePolling } from '../hooks/usePolling'
import { useDocumentMeta } from '../utils/seo'

const POLL_MS = 8000

export default function BoardPage() {
  useSyncWorkspaceFromRoute()
  const { boardId } = useParams()
  const { token } = useAuth()
  const { currentWorkspace, currentWorkspaceId } = useWorkspace()
  const toast = useToast()

  const {
    boardId: loadedBoardId,
    boardMeta,
    tasksById,
    taskIdsByColumn,
    status,
    error,
    savingTaskIds,
    loadBoard,
    refreshBoard,
    moveTaskLocal,
    persistReorder,
    createTask,
    updateTask,
    deleteTask
  } = useBoardStore()

  useEffect(() => {
    if (boardId) loadBoard(boardId, token)
  }, [boardId, token, loadBoard])

  usePolling(() => refreshBoard(boardId, token), POLL_MS, Boolean(boardId) && status === 'success')

  useDocumentMeta({ title: boardMeta ? `${boardMeta.title} — Ledger` : 'Board — Ledger' })

  const membersById = useMemo(() => {
    const map = {}
    ;(currentWorkspace?.members || []).forEach((m) => {
      map[m.id] = m
    })
    return map
  }, [currentWorkspace])

  function handleDragEnd({ taskId, sourceColumnId, destColumnId, destIndex }) {
    moveTaskLocal(taskId, sourceColumnId, destColumnId, destIndex)
    persistReorder(boardId, destColumnId, token).then((result) => {
      if (!result.ok) toast.error(result.error)
    })
    if (sourceColumnId !== destColumnId) {
      persistReorder(boardId, sourceColumnId, token).then((result) => {
        if (!result.ok) toast.error(result.error)
      })
    }
  }

  const isCurrentBoard = loadedBoardId === boardId

  return (
    <AppShell title={boardMeta?.title} subtitle={currentWorkspace?.name} workspaceId={currentWorkspaceId} showActivity>
      {(!isCurrentBoard || status === 'loading') && <Spinner label="Loading board…" className="py-24" />}
      {isCurrentBoard && status === 'error' && (
        <div className="px-6 py-10">
          <ErrorState message={error} onRetry={() => loadBoard(boardId, token)} />
        </div>
      )}
      {isCurrentBoard && status === 'success' && boardMeta && (
        <Board
          boardMeta={boardMeta}
          tasksById={tasksById}
          taskIdsByColumn={taskIdsByColumn}
          membersById={membersById}
          savingTaskIds={savingTaskIds}
          onDragEnd={handleDragEnd}
          onCreateTask={(payload) => createTask(payload, token)}
          onUpdateTask={(taskId, patch) => updateTask(taskId, patch, token)}
          onDeleteTask={(taskId) => deleteTask(taskId, token)}
        />
      )}
    </AppShell>
  )
}
