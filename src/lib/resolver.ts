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

export async function resolvePhrases(words: string[]): Promise<ResolvePhraseResponse> {
  if (words.length < 2) {
    return { phrases: [] }
  }

  const response = await fetch("/api/resolve-phrases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ words }),
  })

  if (!response.ok) {
    console.error(`Phrase resolution failed: ${response.status}`)
    return { phrases: [] }
  }

  return response.json()
}
