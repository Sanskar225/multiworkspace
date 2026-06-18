import { AlertTriangle } from 'lucide-react'
import Button from './Button'

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-ember-400/30 bg-ember-100/40 px-6 py-12 text-center">
      <AlertTriangle className="h-7 w-7 text-ember-500" />
      <div>
        <p className="font-display font-semibold text-ink">{title}</p>
        {message && <p className="mt-1 max-w-sm text-sm text-ink-soft">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
