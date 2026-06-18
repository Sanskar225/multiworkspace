import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../api/endpoints'
import { isTokenValid } from '../api/client'

const AuthContext = createContext(null)
const SESSION_KEY = 'ledger_session_v1'

function readStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = readStoredSession()
    if (stored && isTokenValid(stored.token)) return stored
    return null
  })
  // Distinguishes "never logged in" from "was logged in, token expired" so the
  // UI can route to a dedicated session-expired screen instead of just /login.
  const [expiredFlag, setExpiredFlag] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [session])

  // Poll the token's expiry on an interval so a session that lapses while the
  // tab is open still gets caught, not just on next page load.
  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      if (!isTokenValid(session.token)) {
        setSession(null)
        setExpiredFlag(true)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [session])

  const login = useCallback(async (email, password) => {
    setIsLoggingIn(true)
    setAuthError(null)
    try {
      const { token, user } = await api.login({ email, password })
      setSession({ token, user })
      setExpiredFlag(false)
      return true
    } catch (err) {
      setAuthError(err.message || 'Unable to sign in.')
      return false
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    setExpiredFlag(false)
  }, [])

  // Exposed only so the UI can offer a "simulate session expiry" affordance —
  // genuinely waiting 20 minutes isn't a reasonable way to verify this flow.
  const expireNow = useCallback(() => {
    setSession(null)
    setExpiredFlag(true)
  }, [])

  const value = useMemo(
    () => ({
      user: session?.user || null,
      token: session?.token || null,
      isAuthenticated: Boolean(session),
      expiredFlag,
      authError,
      isLoggingIn,
      login,
      logout,
      expireNow,
      clearExpiredFlag: () => setExpiredFlag(false)
    }),
    [session, expiredFlag, authError, isLoggingIn, login, logout, expireNow]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
