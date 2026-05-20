import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { RoutingSession } from '@supaproxy/core/ports/session-store'

const getMock = vi.fn()
const setMock = vi.fn()
const delMock = vi.fn()
const incrMock = vi.fn()
const expireMock = vi.fn()

vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: getMock,
      set: setMock,
      del: delMock,
      incr: incrMock,
      expire: expireMock,
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

import { RedisSessionStore } from './RedisSessionStore.js'

describe('RedisSessionStore', () => {
  let store: RedisSessionStore

  const session: RoutingSession = {
    workspaceId: 'ws-1',
    lastMessageAt: 1716230400000,
    routedFrom: 'slack',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    store = new RedisSessionStore('localhost', 6379)
  })

  describe('get', () => {
    it('returns parsed session when key exists', async () => {
      getMock.mockResolvedValue(JSON.stringify(session))

      const result = await store.get('session:key')

      expect(getMock).toHaveBeenCalledWith('session:key')
      expect(result).toEqual(session)
    })

    it('returns null for missing key', async () => {
      getMock.mockResolvedValue(null)

      const result = await store.get('missing')

      expect(result).toBeNull()
    })

    it('returns null for invalid JSON', async () => {
      getMock.mockResolvedValue('not-json{{{')

      const result = await store.get('bad')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('stores session with EX TTL', async () => {
      setMock.mockResolvedValue('OK')

      await store.set('session:key', session, 3600)

      expect(setMock).toHaveBeenCalledWith(
        'session:key',
        JSON.stringify(session),
        'EX',
        3600,
      )
    })
  })

  describe('delete', () => {
    it('calls del with the key', async () => {
      delMock.mockResolvedValue(1)

      await store.delete('session:key')

      expect(delMock).toHaveBeenCalledWith('session:key')
    })
  })

  describe('getRecentQueryCount', () => {
    it('increments key, sets expiry on first call, returns count - 1', async () => {
      incrMock.mockResolvedValue(1)
      expireMock.mockResolvedValue(1)

      const count = await store.getRecentQueryCount('workspace:ws-1', 60)

      expect(incrMock).toHaveBeenCalledWith('ratelimit:workspace:ws-1')
      expect(expireMock).toHaveBeenCalledWith('ratelimit:workspace:ws-1', 60)
      expect(count).toBe(0)
    })

    it('does not set expiry when count > 1', async () => {
      incrMock.mockResolvedValue(5)

      const count = await store.getRecentQueryCount('workspace:ws-1', 60)

      expect(expireMock).not.toHaveBeenCalled()
      expect(count).toBe(4)
    })

    it('returns 0 on error', async () => {
      incrMock.mockRejectedValue(new Error('connection lost'))

      const count = await store.getRecentQueryCount('workspace:ws-1', 60)

      expect(count).toBe(0)
    })
  })
})
