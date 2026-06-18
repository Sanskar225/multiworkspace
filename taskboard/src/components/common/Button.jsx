import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-azure-500 text-white hover:bg-azure-600 focus-visible:ring-azure-500',
  secondary: 'bg-white text-ink border border-ink/15 hover:bg-paper focus-visible:ring-ink/30',
  ghost: 'bg-transparent text-ink-soft hover:bg-ink/5 focus-visible:ring-ink/20',
  danger: 'bg-white text-ember-600 border border-ember-400/40 hover:bg-ember-100 focus-visible:ring-ember-400'
}

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  )
}
