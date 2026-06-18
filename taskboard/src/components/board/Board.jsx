import { useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import Column from './Column'
import TaskModal from './TaskModal'

export default function Board({ boardMeta, tasksById, taskIdsByColumn, membersById, savingTaskIds, onDragEnd, onCreateTask, onUpdateTask, onDeleteTask }) {
  const [modalState, setModalState] = useState(null) // { mode: 'create'|'edit', task?, columnId? }

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
    if (modalState?.mode === 'edit') {
      return onUpdateTask(modalState.task.id, payload)
    }
    return onCreateTask({ ...payload, boardId: boardMeta.id })
  }

  return (
    <div className="h-full px-4 py-4 lg:px-6">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex h-full gap-4 overflow-x-auto pb-2">
          {boardMeta.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              taskIds={taskIdsByColumn[column.id] || []}
              tasksById={tasksById}
              membersById={membersById}
              savingTaskIds={savingTaskIds}
              onOpenTask={(task) => setModalState({ mode: 'edit', task })}
              onAddTask={(columnId) => setModalState({ mode: 'create', columnId })}
            />
          ))}
        </div>
      </DragDropContext>

      <TaskModal
        open={Boolean(modalState)}
        onClose={() => setModalState(null)}
        task={modalState?.mode === 'edit' ? modalState.task : null}
        defaultColumnId={modalState?.mode === 'create' ? modalState.columnId : boardMeta.columns[0]?.id}
        columns={boardMeta.columns}
        members={Object.values(membersById)}
        onSave={handleSave}
        onDelete={onDeleteTask}
      />
    </div>
  )
}
