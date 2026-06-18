import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBoardStore } from './boardStore'
import * as api from '../api/endpoints'

vi.mock('../api/endpoints')

function fixtureState() {
  return {
    boardId: 'b1',
    boardMeta: { id: 'b1', title: 'Test board', columns: [{ id: 'c1', title: 'To do' }, { id: 'c2', title: 'Done' }] },
    tasksById: {
      t1: { id: 't1', columnId: 'c1', order: 0, title: 'Task one', priority: 'medium', updatedAt: new Date().toISOString() },
      t2: { id: 't2', columnId: 'c1', order: 1, title: 'Task two', priority: 'low', updatedAt: new Date().toISOString() },
      t3: { id: 't3', columnId: 'c2', order: 0, title: 'Task three', priority: 'high', updatedAt: new Date().toISOString() }
    },
    taskIdsByColumn: { c1: ['t1', 't2'], c2: ['t3'] },
    status: 'success',
    error: null,
    pendingTaskIds: new Set(),
    savingTaskIds: new Set()
  }
}

beforeEach(() => {
  // Partial merge, not a full replace - replacing would also wipe out the
  // store's action functions (moveTaskLocal, updateTask, ...), since they
  // live on the same state object returned by create().
  useBoardStore.setState(fixtureState())
  vi.resetAllMocks()
})

describe('moveTaskLocal (drag-and-drop reducer)', () => {
  it('reorders a task within the same column', () => {
    useBoardStore.getState().moveTaskLocal('t2', 'c1', 'c1', 0)
    expect(useBoardStore.getState().taskIdsByColumn.c1).toEqual(['t2', 't1'])
    expect(useBoardStore.getState().taskIdsByColumn.c2).toEqual(['t3'])
  })

  it('moves a task across columns and updates its columnId', () => {
    useBoardStore.getState().moveTaskLocal('t1', 'c1', 'c2', 0)
    const state = useBoardStore.getState()
    expect(state.taskIdsByColumn.c1).toEqual(['t2'])
    expect(state.taskIdsByColumn.c2).toEqual(['t1', 't3'])
    expect(state.tasksById.t1.columnId).toBe('c2')
  })

  it('does not mutate the original task objects (immutable update)', () => {
    const before = useBoardStore.getState().tasksById.t1
    useBoardStore.getState().moveTaskLocal('t1', 'c1', 'c2', 0)
    expect(before.columnId).toBe('c1') // the old object reference is untouched
  })
})

describe('updateTask (optimistic update + rollback)', () => {
  it('applies the patch immediately, before the API call resolves', async () => {
    let resolvePatch
    api.patchTask.mockReturnValue(new Promise((resolve) => { resolvePatch = resolve }))

    const promise = useBoardStore.getState().updateTask('t1', { title: 'Renamed' }, 'fake-token')

    // Optimistic state should already reflect the edit, synchronously.
    expect(useBoardStore.getState().tasksById.t1.title).toBe('Renamed')
    expect(useBoardStore.getState().pendingTaskIds.has('t1')).toBe(true)

    resolvePatch({ id: 't1', columnId: 'c1', order: 0, title: 'Renamed', priority: 'medium', updatedAt: new Date().toISOString() })
    const result = await promise

    expect(result.ok).toBe(true)
    expect(useBoardStore.getState().pendingTaskIds.has('t1')).toBe(false)
  })

  it('rolls back to the previous value if the API call fails', async () => {
    api.patchTask.mockRejectedValue(new Error('Network down'))

    const result = await useBoardStore.getState().updateTask('t1', { title: 'Will fail' }, 'fake-token')

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Network down')
    expect(useBoardStore.getState().tasksById.t1.title).toBe('Task one') // rolled back
    expect(useBoardStore.getState().pendingTaskIds.has('t1')).toBe(false)
  })
})

describe('refreshBoard (polling merge)', () => {
  it('preserves a task with a pending optimistic write instead of overwriting it from the poll', async () => {
    api.patchTask.mockReturnValue(new Promise(() => {})) // never resolves - stays "pending"
    useBoardStore.getState().updateTask('t1', { title: 'Local edit in flight' }, 'fake-token')

    api.getBoard.mockResolvedValue({
      id: 'b1',
      title: 'Test board',
      columns: [{ id: 'c1', title: 'To do' }, { id: 'c2', title: 'Done' }],
      tasks: [
        { id: 't1', columnId: 'c1', order: 0, title: 'Stale server title', priority: 'medium', updatedAt: new Date().toISOString() },
        { id: 't2', columnId: 'c1', order: 1, title: 'Task two', priority: 'low', updatedAt: new Date().toISOString() },
        { id: 't3', columnId: 'c2', order: 0, title: 'Task three', priority: 'high', updatedAt: new Date().toISOString() }
      ]
    })

    await useBoardStore.getState().refreshBoard('b1', 'fake-token')

    // The in-flight local edit wins over the (older) server snapshot.
    expect(useBoardStore.getState().tasksById.t1.title).toBe('Local edit in flight')
    // Untouched tasks still pick up the server's version.
    expect(useBoardStore.getState().tasksById.t2.title).toBe('Task two')
  })
})
