import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { detectPhrases, type DetectedPhrase } from "@/lib/phrase-detector"
import { getCachedPhrase, setCachedPhrase, incrementPhraseHitCount } from "@/lib/phrase-cache"
import { resolvePhraseWithLLM } from "@/lib/phrase-resolver"
import type { FontVariant } from "@/lib/schemas"

const RequestSchema = z.object({
  words: z.array(z.string().min(1)).min(2).max(50),
})

export interface ResolvedPhrase {
  words: string[]
  startIndex: number
  endIndex: number
  variant: FontVariant
  source: "cache" | "llm"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parseResult = RequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { words } = parseResult.data
    const normalizedWords = words.map((w) => w.toLowerCase().trim())

    const detectedPhrases = await detectPhrases(normalizedWords)

    if (detectedPhrases.length === 0) {
      return NextResponse.json({ phrases: [] })
    }

    const resolvedPhrases: ResolvedPhrase[] = []

    for (const phrase of detectedPhrases) {
      const phraseWords = normalizedWords.slice(phrase.startIndex, phrase.endIndex + 1)

      const cached = await getCachedPhrase(phraseWords)
      if (cached) {
        incrementPhraseHitCount(phraseWords).catch(console.error)
        resolvedPhrases.push({
          words: phraseWords,
          startIndex: phrase.startIndex,
          endIndex: phrase.endIndex,
          variant: cached,
          source: "cache",
        })
        continue
      }

      const variant = await resolvePhraseWithLLM(phraseWords, phrase.reason)

      setCachedPhrase(phraseWords, variant).catch(console.error)

      resolvedPhrases.push({
        words: phraseWords,
        startIndex: phrase.startIndex,
        endIndex: phrase.endIndex,
        variant,
        source: "llm",
      })
    }

    return NextResponse.json({ phrases: resolvedPhrases })
  } catch (error) {
    console.error("Phrase resolution error:", error)
    return NextResponse.json({ phrases: [] })
  }
}
