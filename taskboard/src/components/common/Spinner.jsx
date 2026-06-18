import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function Spinner({ label = 'Loading…', className, size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-9 w-9' }
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3 py-10 text-ink-faint', className)}>
      <Loader2 className={clsx(sizes[size], 'animate-spin')} />
      {label && <p className="text-sm font-mono">{label}</p>}
    </div>
  )
}
