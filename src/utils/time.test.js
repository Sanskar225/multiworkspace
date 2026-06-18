import { describe, it, expect } from 'vitest'
import { timeAgo } from './time'

function isoSecondsAgo(seconds) {
  return new Date(Date.now() - seconds * 1000).toISOString()
}

describe('timeAgo', () => {
  it('shows "just now" for anything under 10 seconds', () => {
    expect(timeAgo(isoSecondsAgo(3))).toBe('just now')
  })

  it('shows seconds for under a minute', () => {
    expect(timeAgo(isoSecondsAgo(45))).toBe('45s ago')
  })

  it('shows minutes for under an hour', () => {
    expect(timeAgo(isoSecondsAgo(60 * 5))).toBe('5m ago')
  })

  it('shows hours for under a day', () => {
    expect(timeAgo(isoSecondsAgo(3600 * 4))).toBe('4h ago')
  })

  it('shows days for under a week', () => {
    expect(timeAgo(isoSecondsAgo(86400 * 2))).toBe('2d ago')
  })
})
