const hashCache = new Map<string, number>()

export function hashString(str: string): number {
  const cached = hashCache.get(str)
  if (cached !== undefined) return cached

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const result = Math.abs(hash)
  hashCache.set(str, result)
  return result
}

export function seededRandom(seed: number): number {
  const state = (seed * 1103515245 + 12345) & 0x7fffffff
  return state / 0x7fffffff
}
