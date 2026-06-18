// boardStore.js
//
// Why zustand here and Context elsewhere: auth and workspace state change
// rarely and few components care about every field, so Context is fine. Board
// state is the opposite — drag-and-drop and inline editing need frequent,
// fine-grained updates (often just one task or one column), and Context would
// re-render the whole board tree on every keystroke. Zustand lets components
// select just the slice they need (e.g. a single TaskCard subscribes to just
// its own task) so reordering 50 tasks doesn't re-render 50 cards.
//
// Shape mirrors the classic "normalized board" pattern: tasks are keyed by id,
// and each column holds an ordered array of task ids. This makes drag-and-drop
// reordering an array splice instead of a re-sort, and makes optimistic
// updates a single object merge.

import { create } from 'zustand'
import * as api from '../api/endpoints'

function normalize(board) {
  const taskIdsByColumn = {}
  board.columns.forEach((c) => {
    taskIdsByColumn[c.id] = []
  })
  const tasksById = {}
  ;[...board.tasks]
    .sort((a, b) => a.order - b.order)
    .forEach((task) => {
      tasksById[task.id] = task
      if (!taskIdsByColumn[task.columnId]) taskIdsByColumn[task.columnId] = []
      taskIdsByColumn[task.columnId].push(task.id)
    })
  return { tasksById, taskIdsByColumn }
}

export const useBoardStore = create((set, get) => ({
  boardId: null,
  boardMeta: null, // { id, title, description, isPublic, workspaceId, columns }
  tasksById: {},
  taskIdsByColumn: {},
  status: 'idle', // idle | loading | success | error
  error: null,
  pendingTaskIds: new Set(), // tasks with an optimistic update in flight - protects them from being clobbered by a concurrent poll
  savingTaskIds: new Set(), // drives small per-card "saving" indicators

  async loadBoard(boardId, token) {
    set({ status: 'loading', error: null, boardId })
    try {
      const board = await api.getBoard(boardId, token)
      const { tasksById, taskIdsByColumn } = normalize(board)
      set({
        boardMeta: { id: board.id, title: board.title, description: board.description, isPublic: board.isPublic, workspaceId: board.workspaceId, columns: board.columns },
        tasksById,
        taskIdsByColumn,
        status: 'success'
      })
    } catch (err) {
      set({ status: 'error', error: err.message || 'Could not load this board.' })
    }
  },

  /** Silent background refresh used by polling - never flips status to "loading" so the board doesn't flash a spinner every poll cycle. */
  async refreshBoard(boardId, token) {
    if (get().boardId !== boardId) return
    try {
      const board = await api.getBoard(boardId, token)
      const { tasksById: incomingTasks, taskIdsByColumn: incomingOrder } = normalize(board)
      const { pendingTaskIds, tasksById: currentTasks } = get()

      // Protect any task with an optimistic write still in flight - keep the
      // local (optimistic) version rather than overwriting it with a possibly
      // stale server snapshot from before that write landed.
      const mergedTasks = { ...incomingTasks }
      pendingTaskIds.forEach((id) => {
        if (currentTasks[id]) mergedTasks[id] = currentTasks[id]
      })

      set({ tasksById: mergedTasks, taskIdsByColumn: incomingOrder })
    } catch {
      // Silent on purpose - a failed poll shouldn't interrupt the user; the next poll will retry.
    }
  },

  async createTask(payload, token) {
    const optimisticId = `temp_${Date.now()}`
    const optimisticTask = {
      id: optimisticId,
      boardId: payload.boardId,
      columnId: payload.columnId,
      order: (get().taskIdsByColumn[payload.columnId] || []).length,
      title: payload.title,
      description: payload.description || '',
      priority: payload.priority || 'medium',
      assigneeId: payload.assigneeId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _optimistic: true
    }

    set((state) => ({
      tasksById: { ...state.tasksById, [optimisticId]: optimisticTask },
      taskIdsByColumn: {
        ...state.taskIdsByColumn,
        [payload.columnId]: [...(state.taskIdsByColumn[payload.columnId] || []), optimisticId]
      }
    }))

    try {
      const created = await api.postTask(payload, token)
      set((state) => {
        const tasksById = { ...state.tasksById }
        delete tasksById[optimisticId]
        tasksById[created.id] = created
        const taskIdsByColumn = { ...state.taskIdsByColumn }
        taskIdsByColumn[created.columnId] = taskIdsByColumn[created.columnId].map((id) => (id === optimisticId ? created.id : id))
        return { tasksById, taskIdsByColumn }
      })
      return { ok: true, task: created }
    } catch (err) {
      set((state) => {
        const tasksById = { ...state.tasksById }
        delete tasksById[optimisticId]
        const taskIdsByColumn = { ...state.taskIdsByColumn }
        taskIdsByColumn[payload.columnId] = taskIdsByColumn[payload.columnId].filter((id) => id !== optimisticId)
        return { tasksById, taskIdsByColumn }
      })
      return { ok: false, error: err.message || 'Could not create task.' }
    }
  },

  async updateTask(taskId, patch, token) {
    const previous = get().tasksById[taskId]
    if (!previous) return { ok: false, error: 'Task not found locally.' }

    set((state) => ({
      tasksById: { ...state.tasksById, [taskId]: { ...previous, ...patch } },
      pendingTaskIds: new Set(state.pendingTaskIds).add(taskId),
      savingTaskIds: new Set(state.savingTaskIds).add(taskId)
    }))

    try {
      const updated = await api.patchTask(taskId, patch, token)
      set((state) => {
        const pendingTaskIds = new Set(state.pendingTaskIds)
        pendingTaskIds.delete(taskId)
        const savingTaskIds = new Set(state.savingTaskIds)
        savingTaskIds.delete(taskId)
        return { tasksById: { ...state.tasksById, [taskId]: updated }, pendingTaskIds, savingTaskIds }
      })
      return { ok: true, task: updated }
    } catch (err) {
      // Roll back to the pre-edit version on failure.
      set((state) => {
        const pendingTaskIds = new Set(state.pendingTaskIds)
        pendingTaskIds.delete(taskId)
        const savingTaskIds = new Set(state.savingTaskIds)
        savingTaskIds.delete(taskId)
        return { tasksById: { ...state.tasksById, [taskId]: previous }, pendingTaskIds, savingTaskIds }
      })
      return { ok: false, error: err.message || 'Could not save changes.' }
    }
  },

  async deleteTask(taskId, token) {
    const state = get()
    const task = state.tasksById[taskId]
    if (!task) return { ok: true }
    const previousColumnOrder = state.taskIdsByColumn[task.columnId]

    set((s) => {
      const tasksById = { ...s.tasksById }
      delete tasksById[taskId]
      return {
        tasksById,
        taskIdsByColumn: { ...s.taskIdsByColumn, [task.columnId]: previousColumnOrder.filter((id) => id !== taskId) }
      }
    })

    try {
      await api.removeTask(taskId, token)
      return { ok: true }
    } catch (err) {
      set((s) => ({
        tasksById: { ...s.tasksById, [taskId]: task },
        taskIdsByColumn: { ...s.taskIdsByColumn, [task.columnId]: previousColumnOrder }
      }))
      return { ok: false, error: err.message || 'Could not delete task.' }
    }
  },

  /** Pure local reorder for drag-and-drop - called on every drag, before the network call. */
  moveTaskLocal(taskId, sourceColumnId, destColumnId, destIndex) {
    set((state) => {
      const sourceIds = Array.from(state.taskIdsByColumn[sourceColumnId])
      const fromIndex = sourceIds.indexOf(taskId)
      if (fromIndex === -1) return state
      sourceIds.splice(fromIndex, 1)

      const destIds = sourceColumnId === destColumnId ? sourceIds : Array.from(state.taskIdsByColumn[destColumnId])
      destIds.splice(destIndex, 0, taskId)

      const tasksById = { ...state.tasksById, [taskId]: { ...state.tasksById[taskId], columnId: destColumnId } }

      return {
        tasksById,
        taskIdsByColumn: { ...state.taskIdsByColumn, [sourceColumnId]: sourceIds, [destColumnId]: destIds }
      }
    })
  },

  /** Persists the result of a drag to the API once the drop settles. */
  async persistReorder(boardId, columnId, token) {
    const orderedIds = get().taskIdsByColumn[columnId] || []
    try {
      await api.reorderTasks(boardId, columnId, orderedIds, token)
      return { ok: true }
    } catch (err) {
      // A failed reorder persist is low-stakes for a demo app: the next poll
      // reconciles order from the server, so we don't roll back the drag
      // gesture itself. We do still report the failure so the caller can
      // surface it (e.g. a toast) instead of failing completely silently.
      return { ok: false, error: err.message || 'Could not save the new order.' }
    }
  },

  reset() {
    set({ boardId: null, boardMeta: null, tasksById: {}, taskIdsByColumn: {}, status: 'idle', error: null, pendingTaskIds: new Set(), savingTaskIds: new Set() })
  }
}))
