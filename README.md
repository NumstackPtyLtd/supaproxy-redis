# @supaproxy/redis
Redis session store adapter for SupaProxy. Manages session persistence with ioredis.

## Install
```sh
pnpm add @supaproxy/redis
```

## Usage
```ts
import { createRedisSession } from '@supaproxy/redis'
const sessionStore = createRedisSession('localhost', 6379)
```
