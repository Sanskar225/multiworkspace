import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import VantaBackground from '../components/common/VantaBackground'
import LoginForm from '../components/auth/LoginForm'
import { useAuth } from '../context/AuthContext'
import { useDocumentMeta } from '../utils/seo'

export default function LoginPage() {
  const { isAuthenticated, expiredFlag, clearExpiredFlag } = useAuth()
  const location = useLocation()

  useDocumentMeta({ title: 'Sign in — Ledger', description: 'Sign in to your Ledger workspaces.' })

  useEffect(() => {
    if (expiredFlag) clearExpiredFlag()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/workspaces'} replace />
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a1322] px-4">
      <VantaBackground className="absolute inset-0" />
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  )
}
