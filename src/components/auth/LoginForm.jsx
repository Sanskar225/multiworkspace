import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../common/Button'

const DEMO_ACCOUNTS = [
  { email: 'amara@ledger.dev', label: 'Amara — Atlas Studio + Northwind' },
  { email: 'devon@ledger.dev', label: 'Devon — Atlas Studio' },
  { email: 'marco@ledger.dev', label: 'Marco — Northwind Labs' }
]

export default function LoginForm() {
  const { login, authError, isLoggingIn } = useAuth()
  const [email, setEmail] = useState('amara@ledger.dev')
  const [password, setPassword] = useState('demo1234')

  async function handleSubmit(e) {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-surface/95 p-8 shadow-lift backdrop-blur">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-azure-500 font-display text-base font-bold text-white">L</div>
        <span className="font-display text-lg font-semibold text-ink">Ledger</span>
      </div>
      <h1 className="font-display text-xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-faint">Use one of the demo accounts below, or your own once you wire up a real backend.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-soft">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none ring-azure-500/40 transition-shadow focus:ring-2"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-soft">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none ring-azure-500/40 transition-shadow focus:ring-2"
            placeholder="demo1234"
          />
        </div>

        {authError && (
          <p className="rounded-lg bg-ember-100 px-3 py-2 text-sm text-ember-600">{authError}</p>
        )}

        <Button type="submit" className="w-full" loading={isLoggingIn} icon={LogIn}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 border-t border-ink/8 pt-4">
        <p className="mb-2 text-xs font-mono uppercase tracking-wide text-ink-faint">Demo accounts (password: demo1234)</p>
        <ul className="space-y-1">
          {DEMO_ACCOUNTS.map((acc) => (
            <li key={acc.email}>
              <button
                type="button"
                onClick={() => setEmail(acc.email)}
                className="text-left text-sm text-azure-600 underline-offset-2 hover:underline"
              >
                {acc.email} <span className="text-ink-faint">— {acc.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
