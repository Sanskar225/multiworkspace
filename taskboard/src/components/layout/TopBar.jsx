import { useState, useRef, useEffect } from 'react'
import { Menu, ChevronDown, LogOut, TimerOff, Radio } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../common/Avatar'

export default function TopBar({ onOpenMobileMenu, onToggleActivity, activityOpen, title, subtitle }) {
  const { user, logout, expireNow } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-ink/8 bg-surface/80 px-4 backdrop-blur lg:px-6">
      <button onClick={onOpenMobileMenu} className="rounded-md p-2 text-ink-soft hover:bg-ink/5 lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate font-display text-base font-semibold text-ink lg:text-lg">{title}</h1>}
        {subtitle && <p className="truncate text-xs text-ink-faint">{subtitle}</p>}
      </div>

      {onToggleActivity && (
        <button
          onClick={onToggleActivity}
          className={`hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors sm:flex ${
            activityOpen ? 'border-jade-500 bg-jade-50 text-jade-700' : 'border-ink/10 text-ink-soft hover:bg-ink/5'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          Activity
        </button>
      )}

      <div className="relative" ref={ref}>
        <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-ink/5">
          <Avatar user={user} size="sm" />
          <span className="hidden text-sm font-medium text-ink sm:inline">{user?.name}</span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-ink-faint sm:inline" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1.5 w-56 rounded-lg border border-ink/10 bg-white py-1.5 shadow-lift">
            <p className="px-3 py-1.5 text-xs text-ink-faint">{user?.email}</p>
            <button
              onClick={() => {
                setMenuOpen(false)
                expireNow()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper"
              title="Demo affordance: forces the session to expire immediately, instead of waiting 20 minutes."
            >
              <TimerOff className="h-4 w-4" />
              Simulate session expiry
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ember-600 hover:bg-ember-100/60"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
