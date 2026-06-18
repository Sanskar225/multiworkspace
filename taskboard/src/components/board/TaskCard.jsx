import { Draggable } from '@hello-pangea/dnd'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import Badge from '../common/Badge'
import Avatar from '../common/Avatar'
import { timeAgo } from '../../utils/time'

const PRIORITY_TONE = { high: 'high', medium: 'medium', low: 'low' }

export default function TaskCard({ task, index, assignee, onOpen, isSaving }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpen(task)}
          className={clsx(
            'group mb-2.5 cursor-pointer rounded-xl border border-ink/8 bg-white p-3.5 shadow-card transition-shadow',
            'hover:border-jade-300/60 hover:shadow-lift',
            snapshot.isDragging && 'rotate-1 shadow-lift ring-2 ring-jade-300/60',
            task._optimistic && 'opacity-70'
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <Badge tone={PRIORITY_TONE[task.priority] || 'neutral'}>{task.priority}</Badge>
            {isSaving && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ink-faint" />}
          </div>

          <p className="text-sm font-medium leading-snug text-ink">{task.title}</p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-ink-faint">{task.description}</p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-[11px] text-ink-faint">{timeAgo(task.updatedAt)}</span>
            <Avatar user={assignee} size="sm" />
          </div>
        </div>
      )}
    </Draggable>
  )
}
