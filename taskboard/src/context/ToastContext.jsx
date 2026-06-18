import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import clsx from 'clsx'

const ToastContext = createContext(null)
let idCounter = 0

const ICONS = { error: AlertTriangle, success: CheckCircle2, info: Info }
const TONES = {
  error: 'border-ember-400/30 bg-ember-100 text-ember-600',
  success: 'border-moss-300/40 bg-moss-50 text-moss-600',
  info: 'border-ink/10 bg-white text-ink-soft'
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, { tone = 'info', duration = 5000 } = {}) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, tone }])
      if (duration) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  const value = useMemo(
    () => ({
      push,
      dismiss,
      error: (msg, opts) => push(msg, { ...opts, tone: 'error' }),
      success: (msg, opts) => push(msg, { ...opts, tone: 'success' }),
      info: (msg, opts) => push(msg, { ...opts, tone: 'info' })
    }),
    [push, dismiss]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.tone] || Info
            return (
              <div
                key={toast.id}
                className={clsx(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lift',
                  TONES[toast.tone]
                )}
                role="status"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="flex-1 text-sm leading-snug">{toast.message}</p>
                <button onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
