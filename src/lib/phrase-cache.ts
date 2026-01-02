import type { FontVariant } from "./schemas"

const CACHE_PREFIX = "vibe:phrase:"
const SCHEMA_VERSION = 1
const MODEL_VERSION = "claude-haiku-v2"

interface PhraseCacheEntry {
  variant: FontVariant
  schemaVersion: number
  modelVersion: string
  createdAt: number
  hitCount: number
}

const memoryCache = new Map<string, PhraseCacheEntry>()

function hasVercelKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

async function getKV() {
  if (!hasVercelKV()) {
    return null
  }
  const { kv } = await import("@vercel/kv")
  return kv
}

function normalizePhrase(words: string[]): string {
  return words
    .map((w) => w.toLowerCase().trim())
    .join(" ")
}

function cacheKey(words: string[]): string {
  return `${CACHE_PREFIX}${normalizePhrase(words)}`
}

export async function getCachedPhrase(words: string[]): Promise<FontVariant | null> {
  const key = cacheKey(words)

  const kv = await getKV()

  if (kv) {
    try {
      const entry = await kv.get<PhraseCacheEntry>(key)

      if (
        entry &&
        entry.schemaVersion === SCHEMA_VERSION &&
        entry.modelVersion === MODEL_VERSION
      ) {
        return entry.variant
      }
    } catch (error) {
      console.error("Phrase KV get error:", error)
    }
  } else {
    const entry = memoryCache.get(key)
    if (
      entry &&
      entry.schemaVersion === SCHEMA_VERSION &&
      entry.modelVersion === MODEL_VERSION
    ) {
      return entry.variant
    }
  }

  return null
}

export async function setCachedPhrase(
  words: string[],
  variant: FontVariant
): Promise<void> {
  const key = cacheKey(words)
  const entry: PhraseCacheEntry = {
    variant,
    schemaVersion: SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    createdAt: Date.now(),
    hitCount: 0,
  }

  const kv = await getKV()

  if (kv) {
    try {
      await kv.set(key, entry, { ex: 30 * 24 * 60 * 60 })
    } catch (error) {
      console.error("Phrase KV set error:", error)
    }
  } else {
    memoryCache.set(key, entry)
  }
}

export async function incrementPhraseHitCount(words: string[]): Promise<void> {
  const key = cacheKey(words)

  const kv = await getKV()

  if (kv) {
    try {
      const entry = await kv.get<PhraseCacheEntry>(key)
      if (entry) {
        entry.hitCount += 1
        await kv.set(key, entry, { ex: 30 * 24 * 60 * 60 })
      }
    } catch (error) {
      console.error("Phrase KV increment error:", error)
    }
  } else {
    const entry = memoryCache.get(key)
    if (entry) {
      entry.hitCount += 1
    }
  }
}
