import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronsUpDown, Check } from 'lucide-react'
import { useWorkspace } from '../../context/WorkspaceContext'

export default function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (!currentWorkspace) return null

  function handleSelect(workspace) {
    switchWorkspace(workspace.id)
    setOpen(false)
    navigate(`/workspace/${workspace.id}/boards`)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-left shadow-card transition-colors hover:border-ink/20"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-jade-500 font-display text-xs font-bold text-white">
            {currentWorkspace.name.slice(0, 1)}
          </div>
          <span className="truncate font-display text-sm font-semibold text-ink">{currentWorkspace.name}</span>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink-faint" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-full min-w-[14rem] rounded-lg border border-ink/10 bg-white py-1.5 shadow-lift">
          <p className="px-3 pb-1 pt-1 text-[11px] font-mono uppercase tracking-wide text-ink-faint">Your workspaces</p>
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => handleSelect(w)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-paper"
            >
              <span className="truncate">{w.name}</span>
              {w.id === currentWorkspace.id && <Check className="h-4 w-4 text-jade-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
