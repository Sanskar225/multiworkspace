import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'

const PRIORITIES = ['low', 'medium', 'high']

const emptyDraft = (columnId) => ({ title: '', description: '', priority: 'medium', assigneeId: '', columnId })

export default function TaskModal({ open, onClose, task, defaultColumnId, columns, members, onSave, onDelete }) {
  const isEditing = Boolean(task)
  const [draft, setDraft] = useState(emptyDraft(defaultColumnId))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (task) {
      setDraft({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        assigneeId: task.assigneeId || '',
        columnId: task.columnId
      })
    } else {
      setDraft(emptyDraft(defaultColumnId))
    }
    setError(null)
  }, [task, defaultColumnId, open])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!draft.title.trim()) {
      setError('Give this task a title.')
      return
    }
    setSaving(true)
    setError(null)
    const result = await onSave({
      ...draft,
      title: draft.title.trim(),
      assigneeId: draft.assigneeId || null
    })
    setSaving(false)
    if (result?.ok) onClose()
    else setError(result?.error || 'Could not save this task.')
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await onDelete(task.id)
    setDeleting(false)
    if (result?.ok) onClose()
    else setError(result?.error || 'Could not delete this task.')
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit task' : 'New task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">Title</label>
          <input
            autoFocus
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none ring-jade-500/40 focus:ring-2"
            placeholder="What needs to get done?"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">Description</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            rows={3}
            className="w-full resize-none rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none ring-jade-500/40 focus:ring-2"
            placeholder="Add more detail (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">Column</label>
            <select
              value={draft.columnId}
              onChange={(e) => setDraft((d) => ({ ...d, columnId: e.target.value }))}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none ring-jade-500/40 focus:ring-2"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-soft">Priority</label>
            <select
              value={draft.priority}
              onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm capitalize text-ink outline-none ring-jade-500/40 focus:ring-2"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-soft">Assignee</label>
          <select
            value={draft.assigneeId}
            onChange={(e) => setDraft((d) => ({ ...d, assigneeId: e.target.value }))}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none ring-jade-500/40 focus:ring-2"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="rounded-lg bg-ember-100 px-3 py-2 text-sm text-ember-600">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {isEditing ? (
            <Button variant="danger" size="sm" icon={Trash2} loading={deleting} onClick={handleDelete} type="button">
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>Cancel</Button>
            <Button size="sm" type="submit" loading={saving}>{isEditing ? 'Save changes' : 'Create task'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
