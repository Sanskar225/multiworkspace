// activitySimulator.js
//
// Simulates teammates working in the same workspace concurrently, so the
// activity feed and polling-based sync have something to show. This writes
// straight to mockDb (rather than going through endpoints.js) because it's
// standing in for *other people's* clients hitting the server, not the
// current user's own actions — those go through the normal API layer.
//
// This runs purely in the browser tab's memory. If localStorage is shared
// (e.g. two tabs of the same app open side by side), each tab's poll will
// also pick up the other tab's simulated writes, which is a convenient way
// to see the "multi-user" effect for real instead of just within one tab.

import * as db from '../api/mockDb'

const MOVE_VERBS = ['moved', 'updated', 'commented']

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export function simulateOneEdit(workspaceId, currentUserId) {
  const boards = db.getBoardsForWorkspace(workspaceId)
  if (boards.length === 0) return null

  const board = pickRandom(boards)
  const tasks = db.getTasksForBoard(board.id)
  if (tasks.length === 0) return null

  const workspace = db.getWorkspaceById(workspaceId)
  const otherMemberIds = workspace.memberIds.filter((id) => id !== currentUserId)
  if (otherMemberIds.length === 0) return null
  const actorId = pickRandom(otherMemberIds)

  const task = pickRandom(tasks)
  const verb = pickRandom(MOVE_VERBS)

  if (verb === 'moved' && board.columns.length > 1) {
    const otherColumns = board.columns.filter((c) => c.id !== task.columnId)
    const destination = pickRandom(otherColumns)
    db.updateTask(task.id, { columnId: destination.id })
    db.logActivity(workspaceId, board.id, task.id, 'moved', `moved "${task.title}" to ${destination.title}`, actorId)
  } else {
    db.updateTask(task.id, { updatedAt: new Date().toISOString() })
    db.logActivity(workspaceId, board.id, task.id, 'updated', `updated "${task.title}"`, actorId)
  }

  return { boardId: board.id }
}
