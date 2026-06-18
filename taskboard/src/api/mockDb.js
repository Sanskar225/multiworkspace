// mockDb.js
//
// A tiny in-memory "database" that stands in for a real backend. It is seeded
// once from src/data/seed.js and then persisted to localStorage so state
// survives page reloads (similar to a real server keeping state between requests).
//
// Every exported function here is the ONLY place that touches storage directly.
// api/endpoints.js calls into this module; nothing else should reach into
// localStorage or the seed data directly. That keeps the "fake backend" swappable
// for a real one later without touching UI code.

import { SEED_USERS, SEED_WORKSPACES, SEED_BOARDS, SEED_TASKS, SEED_ACTIVITY } from '../data/seed'

const STORAGE_KEY = 'ledger_mockdb_v1'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function freshDb() {
  return {
    users: structuredClone(SEED_USERS),
    workspaces: structuredClone(SEED_WORKSPACES),
    boards: structuredClone(SEED_BOARDS),
    tasks: structuredClone(SEED_TASKS),
    activity: structuredClone(SEED_ACTIVITY)
  }
}

let db = loadFromStorage() || freshDb()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // localStorage can fail in private-browsing/quota situations; the app
    // still works in-memory for the session, it just won't survive a reload.
  }
}

if (!loadFromStorage()) persist()

export function resetDb() {
  db = freshDb()
  persist()
}

export function genId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

// ---- Reads -----------------------------------------------------------

export function findUserByEmail(email) {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
}

export function findUserById(id) {
  return db.users.find((u) => u.id === id) || null
}

export function getWorkspacesForUser(userId) {
  return db.workspaces.filter((w) => w.memberIds.includes(userId))
}

export function getWorkspaceById(id) {
  return db.workspaces.find((w) => w.id === id) || null
}

export function getBoardsForWorkspace(workspaceId) {
  return db.boards.filter((b) => b.workspaceId === workspaceId)
}

export function getBoardById(id) {
  return db.boards.find((b) => b.id === id) || null
}

export function getTasksForBoard(boardId) {
  return db.tasks.filter((t) => t.boardId === boardId)
}

export function getTaskById(id) {
  return db.tasks.find((t) => t.id === id) || null
}

export function getActivityForWorkspace(workspaceId, { limit = 30 } = {}) {
  return db.activity
    .filter((a) => a.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)
}

export function getActivitySince(workspaceId, isoTimestamp) {
  return db.activity.filter(
    (a) => a.workspaceId === workspaceId && new Date(a.timestamp) > new Date(isoTimestamp)
  )
}

// ---- Writes ------------------------------------------------------------

export function createTask({ boardId, columnId, title, description, priority, assigneeId }) {
  const board = getBoardById(boardId)
  if (!board) throw new ApiError(404, 'Board not found')

  const siblings = db.tasks.filter((t) => t.boardId === boardId && t.columnId === columnId)
  const now = new Date().toISOString()
  const task = {
    id: genId('task'),
    boardId,
    columnId,
    order: siblings.length,
    title: title?.trim() || 'Untitled task',
    description: description?.trim() || '',
    priority: priority || 'medium',
    assigneeId: assigneeId || null,
    createdAt: now,
    updatedAt: now
  }
  db.tasks.push(task)
  logActivity(board.workspaceId, boardId, task.id, 'created', `created "${task.title}"`)
  persist()
  return task
}

export function updateTask(taskId, patch) {
  const task = getTaskById(taskId)
  if (!task) throw new ApiError(404, 'Task not found')
  const board = getBoardById(task.boardId)

  const movedColumn = patch.columnId && patch.columnId !== task.columnId
  Object.assign(task, patch, { updatedAt: new Date().toISOString() })

  if (movedColumn) {
    const column = board?.columns.find((c) => c.id === patch.columnId)
    logActivity(board.workspaceId, task.boardId, task.id, 'moved', `moved "${task.title}" to ${column?.title || 'a column'}`)
  } else {
    logActivity(board?.workspaceId, task.boardId, task.id, 'updated', `updated "${task.title}"`)
  }

  persist()
  return task
}

export function reorderTasks(boardId, columnId, orderedTaskIds) {
  orderedTaskIds.forEach((taskId, index) => {
    const task = db.tasks.find((t) => t.id === taskId && t.boardId === boardId)
    if (task) {
      task.columnId = columnId
      task.order = index
    }
  })
  persist()
  return getTasksForBoard(boardId)
}

export function deleteTask(taskId) {
  const task = getTaskById(taskId)
  if (!task) throw new ApiError(404, 'Task not found')
  const board = getBoardById(task.boardId)
  db.tasks = db.tasks.filter((t) => t.id !== taskId)
  logActivity(board?.workspaceId, task.boardId, taskId, 'deleted', `deleted "${task.title}"`)
  persist()
  return { id: taskId }
}

export function logActivity(workspaceId, boardId, taskId, type, message, actorId = 'u_amara') {
  if (!workspaceId) return
  const entry = {
    id: genId('act'),
    workspaceId,
    boardId,
    taskId,
    actorId,
    type,
    message,
    timestamp: new Date().toISOString()
  }
  db.activity.unshift(entry)
  db.activity = db.activity.slice(0, 200)
  persist()
  return entry
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
