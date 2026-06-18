// client.js
//
// A thin "transport" layer that every endpoint in endpoints.js goes through.
// In a real app this would be an axios/fetch wrapper hitting a real server;
// here it simulates the same characteristics a real HTTP client deals with:
// latency, transient failures, and auth/token errors. Centralizing this means
// endpoints.js reads like a real API spec and swapping the mock for a real
// fetch() later only requires changing this one file.

import { ApiError } from './mockDb'

const LATENCY_MS = [250, 650] // simulated min/max network latency
const FAILURE_RATE = 0.06 // ~6% of requests randomly fail to exercise error states

function randomDelay() {
  const [min, max] = LATENCY_MS
  return min + Math.random() * (max - min)
}

/**
 * Wraps a synchronous "handler" (which talks to mockDb) so it behaves like
 * an async network call: it awaits a delay, may reject with a network-shaped
 * error, and always resolves/rejects with a consistent envelope.
 */
export async function simulateRequest(handler, { allowRandomFailure = true } = {}) {
  await new Promise((resolve) => setTimeout(resolve, randomDelay()))

  if (allowRandomFailure && Math.random() < FAILURE_RATE) {
    throw new ApiError(503, 'The service is temporarily unavailable. Please try again.')
  }

  try {
    return handler()
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(500, err?.message || 'Something went wrong.')
  }
}

// ---- Token helpers -------------------------------------------------------
// A fake bearer token: base64(JSON) instead of a real signed JWT. Good enough
// to demonstrate "session has an expiry, app must respect it" without pulling
// in a crypto library for a mock.

const SESSION_LENGTH_MS = 20 * 60 * 1000 // 20 minutes

export function issueToken(userId) {
  const payload = { userId, issuedAt: Date.now(), expiresAt: Date.now() + SESSION_LENGTH_MS }
  return btoa(JSON.stringify(payload))
}

export function decodeToken(token) {
  try {
    return JSON.parse(atob(token))
  } catch {
    return null
  }
}

export function isTokenValid(token) {
  const payload = decodeToken(token)
  return Boolean(payload && payload.expiresAt > Date.now())
}

export function requireAuth(token) {
  if (!isTokenValid(token)) {
    throw new ApiError(401, 'Your session has expired. Please sign in again.')
  }
  return decodeToken(token).userId
}
