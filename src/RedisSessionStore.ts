import Redis from 'ioredis'
import type { SessionStore, RoutingSession } from '@supaproxy/core/ports/session-store'
import pino from 'pino'

const log = pino({ name: 'redis-session-store' })

export class RedisSessionStore implements SessionStore {
  private readonly client: Redis

  constructor(host: string, port: number) {
    this.client = new Redis({ host, port, lazyConnect: true })
  }

  async get(key: string): Promise<RoutingSession | null> {
    const raw = await this.client.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as RoutingSession
    } catch (err) {
      log.warn({ error: (err as Error).message, key }, 'Session parse failed')
      return null
    }
  }

  async set(key: string, session: RoutingSession, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(session), 'EX', ttlSeconds)
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key)
  }

  async getRecentQueryCount(scope: string, windowSeconds: number): Promise<number> {
    const key = `ratelimit:${scope}`
    try {
      const count = await this.client.incr(key)
      if (count === 1) {
        await this.client.expire(key, windowSeconds)
      }
      return count - 1
    } catch (err) {
      log.warn({ err }, 'Redis query count failed, defaulting to 0')
      return 0
    }
  }
}
