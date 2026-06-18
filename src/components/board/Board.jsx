import { useMemo, useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import Column from './Column'
import TaskModal from './TaskModal'
import FilterBar from './FilterBar'
import { useToast } from '../../context/ToastContext'

const emptyFilters = { query: '', priority: 'all', assigneeId: 'all' }

function matchesFilters(task, filters) {
  if (filters.priority !== 'all' && task.priority !== filters.priority) return false
  if (filters.assigneeId === 'unassigned' && task.assigneeId) return false
  if (filters.assigneeId !== 'all' && filters.assigneeId !== 'unassigned' && task.assigneeId !== filters.assigneeId) return false
  if (filters.query.trim()) {
    const q = filters.query.trim().toLowerCase()
    const haystack = `${task.title} ${task.description || ''}`.toLowerCase()
    if (!haystack.includes(q)) return false
  }
  return true
}

export default function Board({ boardMeta, tasksById, taskIdsByColumn, membersById, savingTaskIds, onDragEnd, onCreateTask, onUpdateTask, onDeleteTask }) {
  const [modalState, setModalState] = useState(null) // { mode: 'create'|'edit', task?, columnId? }
  const [filters, setFilters] = useState(emptyFilters)
  const toast = useToast()

  const isFiltering = filters.query.trim() !== '' || filters.priority !== 'all' || filters.assigneeId !== 'all'

  const { filteredTaskIdsByColumn, resultCount, totalCount } = useMemo(() => {
    let total = 0
    let result = 0
    const filtered = {}
    boardMeta.columns.forEach((column) => {
      const ids = taskIdsByColumn[column.id] || []
      total += ids.length
      const kept = isFiltering ? ids.filter((id) => tasksById[id] && matchesFilters(tasksById[id], filters)) : ids
      result += kept.length
      filtered[column.id] = kept
    })
    return { filteredTaskIdsByColumn: filtered, resultCount: result, totalCount: total }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardMeta.columns, taskIdsByColumn, tasksById, filters, isFiltering])

  function handleDragEnd(result) {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    onDragEnd({
      taskId: draggableId,
      sourceColumnId: source.droppableId,
      destColumnId: destination.droppableId,
      destIndex: destination.index
    })
  }

  async function handleSave(payload) {
    const result =
      modalState?.mode === 'edit'
        ? await onUpdateTask(modalState.task.id, payload)
        : await onCreateTask({ ...payload, boardId: boardMeta.id })
    if (!result?.ok) toast.error(result?.error || 'Could not save this task.')
    return result
  }

  async function handleDelete(taskId) {
    const result = await onDeleteTask(taskId)
    if (!result?.ok) toast.error(result?.error || 'Could not delete this task.')
    return result
  }

  return (
    <div className="flex h-full flex-col">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        members={Object.values(membersById)}
        resultCount={resultCount}
        totalCount={totalCount}
        isFiltering={isFiltering}
      />

      <div className="min-h-0 flex-1 px-4 py-4 lg:px-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full gap-4 overflow-x-auto pb-2">
            {boardMeta.columns.map((column) => (
              <Column
                key={column.id}
                column={column}
                taskIds={filteredTaskIdsByColumn[column.id] || []}
                tasksById={tasksById}
                membersById={membersById}
                savingTaskIds={savingTaskIds}
                dragDisabled={isFiltering}
                onOpenTask={(task) => setModalState({ mode: 'edit', task })}
                onAddTask={(columnId) => setModalState({ mode: 'create', columnId })}
              />
            ))}
          </div>
        </DragDropContext>
        {isFiltering && (
          <p className="mt-2 text-center text-xs text-ink-faint">Reordering is disabled while a filter is active — clear it to drag tasks.</p>
        )}
      </div>

      <TaskModal
        open={Boolean(modalState)}
        onClose={() => setModalState(null)}
        task={modalState?.mode === 'edit' ? modalState.task : null}
        defaultColumnId={modalState?.mode === 'create' ? modalState.columnId : boardMeta.columns[0]?.id}
        columns={boardMeta.columns}
        members={Object.values(membersById)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
