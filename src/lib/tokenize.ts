import { nanoid } from "nanoid"
import type { WordToken, WordState } from "./schemas"

export function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(/[^\p{L}\p{N}'-]/gu, "")
}

export function tokenize(text: string): WordToken[] {
  const tokens: WordToken[] = []
  const regex = /(\S+)/g
  let match: RegExpExecArray | null
  let position = 0

  while ((match = regex.exec(text)) !== null) {
    const raw = match[1]
    const normalized = normalizeWord(raw)

    if (normalized.length > 0) {
      tokens.push({
        id: nanoid(),
        raw,
        normalized,
        position,
      })
      position++
    }
  }

  return tokens
}

export function createInitialWordState(token: WordToken): WordState {
  return {
    token,
    resolution: { status: "pending" },
    fontLoaded: false,
    phraseGroupId: null,
  }
}

export function reconcileWords(
  existing: WordState[],
  newTokens: WordToken[]
): WordState[] {
  const existingByNormalized = new Map<string, WordState>()
  for (const word of existing) {
    existingByNormalized.set(word.token.normalized, word)
  }

  return newTokens.map((token) => {
    const cached = existingByNormalized.get(token.normalized)

    if (cached) {
      return {
        token: {
          ...cached.token,
          position: token.position,
          raw: token.raw,
        },
        resolution: cached.resolution,
        fontLoaded: cached.fontLoaded,
        phraseGroupId: cached.phraseGroupId,
      }
    }

    return createInitialWordState(token)
  })
}
