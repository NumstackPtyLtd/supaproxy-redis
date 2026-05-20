import { describe, it, expect, vi } from 'vitest'

vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      incr: vi.fn(),
      expire: vi.fn(),
    })),
  }
})

vi.mock('pino', () => ({
  default: () => ({
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}))

import { createRedisSession } from './index.js'

describe('createRedisSession', () => {
  it('returns a SessionStore with all required methods', () => {
    const store = createRedisSession('localhost', 6379)

    expect(store).toBeDefined()
    expect(typeof store.get).toBe('function')
    expect(typeof store.set).toBe('function')
    expect(typeof store.delete).toBe('function')
    expect(typeof store.getRecentQueryCount).toBe('function')
  })
})
