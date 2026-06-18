import { describe, it, expect } from 'vitest'
import { issueToken, decodeToken, isTokenValid, requireAuth } from './client'
import { ApiError } from './mockDb'

describe('token helpers', () => {
  it('issues a token that decodes back to the same user id', () => {
    const token = issueToken('u_amara')
    const payload = decodeToken(token)
    expect(payload.userId).toBe('u_amara')
    expect(payload.expiresAt).toBeGreaterThan(Date.now())
  })

  it('treats a freshly issued token as valid', () => {
    const token = issueToken('u_amara')
    expect(isTokenValid(token)).toBe(true)
  })

  it('treats a garbage/non-base64 string as invalid rather than throwing', () => {
    expect(isTokenValid('not-a-real-token')).toBe(false)
  })

  it('treats an expired token as invalid', () => {
    const expiredPayload = { userId: 'u_amara', issuedAt: Date.now() - 1000, expiresAt: Date.now() - 1 }
    const expiredToken = btoa(JSON.stringify(expiredPayload))
    expect(isTokenValid(expiredToken)).toBe(false)
  })

  it('requireAuth returns the user id for a valid token', () => {
    const token = issueToken('u_devon')
    expect(requireAuth(token)).toBe('u_devon')
  })

  it('requireAuth throws a 401 ApiError for an invalid token', () => {
    expect(() => requireAuth('garbage')).toThrow(ApiError)
    try {
      requireAuth('garbage')
    } catch (err) {
      expect(err.status).toBe(401)
    }
  })
})
