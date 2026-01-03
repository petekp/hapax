import type { FontVariant } from "./schemas"

interface ResolveResponse {
  variant: FontVariant
  source: "cache" | "llm"
}

export async function resolveFont(
  word: string,
  signal?: AbortSignal
): Promise<ResolveResponse> {
  const response = await fetch("/api/resolve-font", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`Font resolution failed: ${response.status}`)
  }

  return response.json()
}

export interface ResolvedPhrase {
  words: string[]
  startIndex: number
  endIndex: number
  variant: FontVariant
  source: "cache" | "llm"
}

interface ResolvePhraseResponse {
  phrases: ResolvedPhrase[]
}

// Cache for individual phrases -> font variant
const phraseVariantCache = new Map<string, { variant: FontVariant; timestamp: number }>()
// Cache for word sequences that have no phrases
const noPhrasesCache = new Set<string>()
// Cache for word sequences we've already sent to the server
const resolvedSequences = new Set<string>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

function getPhraseKey(words: string[]): string {
  return words.map(w => w.toLowerCase().trim()).join("|")
}

function getCachedPhraseVariant(phraseWords: string[]): FontVariant | null {
  const key = getPhraseKey(phraseWords)
  const cached = phraseVariantCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.variant
  }
  return null
}

function setCachedPhraseVariant(phraseWords: string[], variant: FontVariant): void {
  const key = getPhraseKey(phraseWords)
  phraseVariantCache.set(key, { variant, timestamp: Date.now() })
}

export async function resolvePhrases(words: string[]): Promise<ResolvePhraseResponse> {
  if (words.length < 2) {
    return { phrases: [] }
  }

  const normalizedWords = words.map(w => w.toLowerCase().trim())
  const sequenceKey = getPhraseKey(normalizedWords)

  // Check if we've already determined this sequence has no phrases
  if (noPhrasesCache.has(sequenceKey)) {
    console.log(`[phrase-resolver] No phrases (cached): ${words.join(" ")}`)
    return { phrases: [] }
  }

  // Check client-side cache for known phrase patterns
  const cachedPhrases: ResolvedPhrase[] = []

  // Check for cached 2-word phrases
  for (let i = 0; i < normalizedWords.length - 1; i++) {
    const phraseWords = normalizedWords.slice(i, i + 2)
    const variant = getCachedPhraseVariant(phraseWords)
    if (variant) {
      console.log(`[phrase-resolver] Phrase cache HIT: "${phraseWords.join(" ")}"`)
      cachedPhrases.push({
        words: phraseWords,
        startIndex: i,
        endIndex: i + 1,
        variant,
        source: "cache",
      })
    }
  }

  // Check for cached 3-word phrases
  for (let i = 0; i < normalizedWords.length - 2; i++) {
    const phraseWords = normalizedWords.slice(i, i + 3)
    const variant = getCachedPhraseVariant(phraseWords)
    if (variant) {
      // Remove any overlapping 2-word phrases
      for (let j = cachedPhrases.length - 1; j >= 0; j--) {
        const p = cachedPhrases[j]
        if (p.startIndex >= i && p.endIndex <= i + 2) {
          cachedPhrases.splice(j, 1)
        }
      }
      console.log(`[phrase-resolver] Phrase cache HIT: "${phraseWords.join(" ")}"`)
      cachedPhrases.push({
        words: phraseWords,
        startIndex: i,
        endIndex: i + 2,
        variant,
        source: "cache",
      })
    }
  }

  // If we've already resolved this exact sequence, return cached phrases only
  if (resolvedSequences.has(sequenceKey)) {
    console.log(`[phrase-resolver] Sequence already resolved (cached): ${words.join(" ")}`)
    return { phrases: cachedPhrases }
  }

  // First time seeing this sequence - call the server
  console.log(`[phrase-resolver] Calling server for: ${words.join(" ")}`)
  const response = await fetch("/api/resolve-phrases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ words }),
  })

  if (!response.ok) {
    console.error(`Phrase resolution failed: ${response.status}`)
    return { phrases: cachedPhrases }
  }

  const serverResponse: ResolvePhraseResponse = await response.json()

  // Mark this sequence as resolved
  resolvedSequences.add(sequenceKey)

  // Cache new phrases from server
  for (const phrase of serverResponse.phrases) {
    setCachedPhraseVariant(phrase.words, phrase.variant)
  }

  // If server found no phrases, cache that fact
  if (serverResponse.phrases.length === 0 && cachedPhrases.length === 0) {
    noPhrasesCache.add(sequenceKey)
  }

  // Merge server and cached phrases, preferring server for conflicts
  const serverKeys = new Set(serverResponse.phrases.map(p => getPhraseKey(p.words)))
  const uniqueCached = cachedPhrases.filter(p => !serverKeys.has(getPhraseKey(p.words)))

  return {
    phrases: [...serverResponse.phrases, ...uniqueCached]
  }
}
