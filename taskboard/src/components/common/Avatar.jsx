import clsx from 'clsx'

export default function Avatar({ user, size = 'md', title }) {
  const sizes = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-11 w-11 text-sm' }
  if (!user) {
    return (
      <div
        className={clsx('flex items-center justify-center rounded-full border border-dashed border-ink/20 text-ink-faint', sizes[size])}
        title="Unassigned"
      >
        —
      </div>
    )
  }
  return (
    <div
      className={clsx('flex items-center justify-center rounded-full font-display font-semibold text-white shadow-card', sizes[size])}
      style={{ backgroundColor: user.color }}
      title={title || user.name}
    >
      {user.initials}
    </div>
  )
}
