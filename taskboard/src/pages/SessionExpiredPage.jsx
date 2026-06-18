import { useNavigate } from 'react-router-dom'
import { TimerOff } from 'lucide-react'
import Button from '../components/common/Button'
import { useDocumentMeta } from '../utils/seo'

export default function SessionExpiredPage() {
  const navigate = useNavigate()
  useDocumentMeta({ title: 'Session expired — Ledger' })

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 text-center shadow-lift">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brass-100 text-brass-600">
          <TimerOff className="h-6 w-6" />
        </div>
        <h1 className="font-display text-lg font-semibold text-ink">Your session has expired</h1>
        <p className="mt-2 text-sm text-ink-faint">
          For your security, you've been signed out after a period of inactivity. Sign in again to pick up where you left off.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
          Back to sign in
        </Button>
      </div>
    </div>
  )
}
