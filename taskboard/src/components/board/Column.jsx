import { Droppable } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import clsx from 'clsx'
import TaskCard from './TaskCard'

export default function Column({ column, taskIds, tasksById, membersById, savingTaskIds, dragDisabled, onOpenTask, onAddTask }) {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col rounded-2xl bg-paper-dim/70">
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-semibold text-ink">{column.title}</h3>
          <span className="rounded-full bg-ink/8 px-1.5 py-0.5 text-[11px] font-mono text-ink-soft">{taskIds.length}</span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="rounded-md p-1 text-ink-faint transition-colors hover:bg-ink/8 hover:text-ink"
          aria-label={`Add task to ${column.title}`}
          title="Add task"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={clsx(
              'flex-1 overflow-y-auto px-2.5 pb-2.5 pt-1 transition-colors',
              snapshot.isDraggingOver && 'bg-azure-50/60'
            )}
          >
            {taskIds.length === 0 && !snapshot.isDraggingOver && (
              <p className="px-1.5 py-6 text-center text-xs text-ink-faint">No tasks yet</p>
            )}
            {taskIds.map((taskId, index) => {
              const task = tasksById[taskId]
              if (!task) return null
              return (
                <TaskCard
                  key={taskId}
                  task={task}
                  index={index}
                  assignee={task.assigneeId ? membersById[task.assigneeId] : null}
                  onOpen={onOpenTask}
                  isSaving={savingTaskIds.has(taskId)}
                  dragDisabled={dragDisabled}
                />
              )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
