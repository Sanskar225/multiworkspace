import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useDocumentMeta } from '../utils/seo'

export default function NotFoundPage() {
  useDocumentMeta({ title: 'Page not found — Ledger' })
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
      <Compass className="h-8 w-8 text-ink-faint" />
      <h1 className="font-display text-xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-faint">The page you're looking for doesn't exist, or you may not have access to it.</p>
      <Link to="/" className="mt-2 text-sm font-medium text-jade-600 underline-offset-2 hover:underline">
        Go back home
      </Link>
    </div>
  )
}
