import type { FontVariant } from "./schemas";

const CACHE_PREFIX = "vibe:word:";
const SCHEMA_VERSION = 2; // Bumped: OKLCH color system (hue/chroma/lightness)
const MODEL_VERSION = "claude-opus-4-5";

interface CacheEntry {
  variant: FontVariant;
  schemaVersion: number;
  modelVersion: string;
  createdAt: number;
  hitCount: number;
}

// In-memory fallback for local development
const memoryCache = new Map<string, CacheEntry>();

// Check if Vercel KV is available
function hasVercelKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Lazy import to avoid errors when KV isn't configured
async function getKV() {
  if (!hasVercelKV()) {
    return null;
  }
  const { kv } = await import("@vercel/kv");
  return kv;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().trim();
}

function isCapitalized(word: string): boolean {
  const trimmed = word.trim();
  if (trimmed.length === 0) return false;
  const firstChar = trimmed[0];
  return (
    firstChar === firstChar.toUpperCase() &&
    firstChar !== firstChar.toLowerCase()
  );
}

function cacheKey(word: string): string {
  const normalized = normalizeWord(word);
  const cap = isCapitalized(word) ? ":cap" : "";
  return `${CACHE_PREFIX}${normalized}${cap}`;
}

export async function getCachedFont(word: string): Promise<FontVariant | null> {
  const key = cacheKey(word);

  const kv = await getKV();

  if (kv) {
    try {
      const entry = await kv.get<CacheEntry>(key);

      if (entry) {
        console.log(
          `[font-cache] KV entry for "${word}": modelVersion=${entry.modelVersion}, current=${MODEL_VERSION}`
        );
      }

      if (
        entry &&
        entry.schemaVersion === SCHEMA_VERSION &&
        entry.modelVersion === MODEL_VERSION
      ) {
        return entry.variant;
      }
    } catch (error) {
      console.error("KV get error:", error);
    }
  } else {
    // Fallback to memory cache
    const entry = memoryCache.get(key);

    if (
      entry &&
      entry.schemaVersion === SCHEMA_VERSION &&
      entry.modelVersion === MODEL_VERSION
    ) {
      return entry.variant;
    }
  }

  return null;
}

export async function setCachedFont(
  word: string,
  variant: FontVariant
): Promise<void> {
  const key = cacheKey(word);
  const entry: CacheEntry = {
    variant,
    schemaVersion: SCHEMA_VERSION,
    modelVersion: MODEL_VERSION,
    createdAt: Date.now(),
    hitCount: 0,
  };

  const kv = await getKV();

  if (kv) {
    try {
      // Cache for 30 days
      await kv.set(key, entry, { ex: 30 * 24 * 60 * 60 });
    } catch (error) {
      console.error("KV set error:", error);
    }
  } else {
    // Fallback to memory cache
    memoryCache.set(key, entry);
  }
}

export async function incrementHitCount(word: string): Promise<void> {
  const key = cacheKey(word);

  const kv = await getKV();

  if (kv) {
    try {
      const entry = await kv.get<CacheEntry>(key);
      if (entry) {
        entry.hitCount += 1;
        await kv.set(key, entry, { ex: 30 * 24 * 60 * 60 });
      }
    } catch (error) {
      console.error("KV increment error:", error);
    }
  } else {
    // Fallback to memory cache
    const entry = memoryCache.get(key);
    if (entry) {
      entry.hitCount += 1;
    }
  }
}

// Debug helper to see cache state
export function getMemoryCacheSize(): number {
  return memoryCache.size;
}

export function clearMemoryCache(): void {
  memoryCache.clear();
}
