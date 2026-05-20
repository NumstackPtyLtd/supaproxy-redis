import type { SessionStore } from '@supaproxy/core/ports/session-store'
import { RedisSessionStore } from './RedisSessionStore.js'

export function createRedisSession(host: string, port: number): SessionStore {
  return new RedisSessionStore(host, port)
}

export { RedisSessionStore } from './RedisSessionStore.js'
