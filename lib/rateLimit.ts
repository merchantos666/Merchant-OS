type Key = string

type Entry = {
  count: number
  resetAt: number
}

const store = new Map<Key, Entry>()

export function rateLimit(key: Key, max: number, windowMs: number) {
  const now = Date.now()
  const current = store.get(key)
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }
  if (current.count >= max) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }
  current.count += 1
  return { allowed: true, remaining: max - current.count, resetAt: current.resetAt }
}

