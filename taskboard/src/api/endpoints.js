// endpoints.js
//
// This is the application's only entry point into "the backend." Every
// function here mirrors one of the endpoints listed in the assignment brief.
// Components and hooks never import mockDb or client directly — they import
// from here, so the rest of the app is written against a stable API contract
// regardless of what's behind it.

import * as db from './mockDb'
import { simulateRequest, issueToken, requireAuth } from './client'
import { ApiError } from './mockDb'

function sanitizeUser(user) {
  if (!user) return null
  const { password: _password, ...safe } = user
  return safe
}

function hydrateTask(task) {
  return { ...task }
}

function hydrateBoard(board) {
  const tasks = db.getTasksForBoard(board.id).map(hydrateTask)
  return { ...board, tasks }
}

// POST /login
export function login({ email, password }) {
  return simulateRequest(
    () => {
      const user = db.findUserByEmail(email || '')
      if (!user || user.password !== password) {
        throw new ApiError(401, 'Incorrect email or password.')
      }
      return { token: issueToken(user.id), user: sanitizeUser(user) }
    },
    { allowRandomFailure: false }
  )
}

// GET /workspaces
export function getWorkspaces(token) {
  return simulateRequest(() => {
    const userId = requireAuth(token)
    return db.getWorkspacesForUser(userId).map((w) => ({
      ...w,
      members: w.memberIds.map((id) => sanitizeUser(db.findUserById(id))).filter(Boolean)
    }))
  })
}

// GET /boards?workspaceId=
export function getBoards(workspaceId, token) {
  return simulateRequest(() => {
    requireAuth(token)
    return db.getBoardsForWorkspace(workspaceId).map((b) => ({
      ...b,
      taskCount: db.getTasksForBoard(b.id).length
    }))
  })
}

// GET /board/:id
export function getBoard(boardId, token) {
  return simulateRequest(() => {
    requireAuth(token)
    const board = db.getBoardById(boardId)
    if (!board) throw new ApiError(404, 'Board not found.')
    return hydrateBoard(board)
  })
}

// PATCH /task/:id
export function patchTask(taskId, patch, token) {
  return simulateRequest(() => {
    requireAuth(token)
    return hydrateTask(db.updateTask(taskId, patch))
  })
}

// POST /task
export function postTask(payload, token) {
  return simulateRequest(() => {
    requireAuth(token)
    return hydrateTask(db.createTask(payload))
  })
}

// DELETE /task/:id  (extension beyond the brief's listed endpoints, needed for "delete tasks")
export function removeTask(taskId, token) {
  return simulateRequest(() => {
    requireAuth(token)
    return db.deleteTask(taskId)
  })
}

// PATCH /board/:id/reorder  (extension - persists drag-and-drop column/order changes)
export function reorderTasks(boardId, columnId, orderedTaskIds, token) {
  return simulateRequest(() => {
    requireAuth(token)
    return db.reorderTasks(boardId, columnId, orderedTaskIds).map(hydrateTask)
  })
}

// GET /workspace/:id/activity  (extension - powers the activity feed / polling)
export function getActivity(workspaceId, token, { since } = {}) {
  return simulateRequest(() => {
    requireAuth(token)
    const entries = since ? db.getActivitySince(workspaceId, since) : db.getActivityForWorkspace(workspaceId)
    return entries.map((entry) => ({ ...entry, actor: sanitizeUser(db.findUserById(entry.actorId)) }))
  })
}

// GET /public/board/:id  — no token required, and the response is deliberately
// a narrower shape: it omits workspace membership, assignee emails, and any
// other internal detail that shouldn't leave the authenticated app.
export function getPublicBoard(boardId) {
  return simulateRequest(
    () => {
      const board = db.getBoardById(boardId)
      if (!board || !board.isPublic) {
        throw new ApiError(404, 'This board does not exist or is not shared publicly.')
      }
      const workspace = db.getWorkspaceById(board.workspaceId)
      const tasks = db.getTasksForBoard(board.id).map((task) => ({
        id: task.id,
        columnId: task.columnId,
        order: task.order,
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigneeName: task.assigneeId ? db.findUserById(task.assigneeId)?.name || null : null,
        updatedAt: task.updatedAt
      }))
      return {
        id: board.id,
        title: board.title,
        description: board.description,
        workspaceName: workspace?.name || 'Shared workspace',
        columns: board.columns,
        tasks
      }
    },
    { allowRandomFailure: false }
  )
}

export { ApiError }
