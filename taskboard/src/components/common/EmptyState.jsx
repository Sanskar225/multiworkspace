import clsx from 'clsx'

export default function EmptyState({ icon: Icon, title, message, action, className }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink/15 px-6 py-10 text-center', className)}>
      {Icon && <Icon className="h-6 w-6 text-ink-faint" />}
      <p className="font-display font-medium text-ink">{title}</p>
      {message && <p className="max-w-xs text-sm text-ink-faint">{message}</p>}
      {action}
    </div>
  )
}
