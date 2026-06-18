import { Search, X } from 'lucide-react'

const PRIORITIES = ['all', 'low', 'medium', 'high']

export default function FilterBar({ filters, onChange, members, resultCount, totalCount, isFiltering }) {
  function update(patch) {
    onChange({ ...filters, ...patch })
  }

  function clear() {
    onChange({ query: '', priority: 'all', assigneeId: 'all' })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-ink/8 px-4 py-2.5 lg:px-6">
      <div className="relative flex-1 min-w-[10rem] max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
        <input
          value={filters.query}
          onChange={(e) => update({ query: e.target.value })}
          placeholder="Search tasks…"
          className="w-full rounded-lg border border-ink/15 bg-white py-1.5 pl-8 pr-3 text-sm text-ink outline-none ring-azure-500/40 focus:ring-2"
        />
      </div>

      <select
        value={filters.priority}
        onChange={(e) => update({ priority: e.target.value })}
        className="rounded-lg border border-ink/15 bg-white py-1.5 px-2.5 text-sm capitalize text-ink outline-none ring-azure-500/40 focus:ring-2"
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{p === 'all' ? 'All priorities' : p}</option>
        ))}
      </select>

      <select
        value={filters.assigneeId}
        onChange={(e) => update({ assigneeId: e.target.value })}
        className="rounded-lg border border-ink/15 bg-white py-1.5 px-2.5 text-sm text-ink outline-none ring-azure-500/40 focus:ring-2"
      >
        <option value="all">Everyone</option>
        <option value="unassigned">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      {isFiltering && (
        <button onClick={clear} className="flex items-center gap-1 text-sm text-ink-faint hover:text-ink">
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}

      <span className="ml-auto whitespace-nowrap font-mono text-xs text-ink-faint">
        {isFiltering ? `${resultCount} of ${totalCount} tasks` : `${totalCount} tasks`}
      </span>
    </div>
  )
}
