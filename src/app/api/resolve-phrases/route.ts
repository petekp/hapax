import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { detectPhrases, type DetectedPhrase } from "@/lib/phrase-detector"
import { getCachedPhrase, setCachedPhrase, incrementPhraseHitCount } from "@/lib/phrase-cache"
import { resolvePhraseWithLLM } from "@/lib/phrase-resolver"
import { getVettedPhraseStyle } from "@/lib/vetted-cache"
import type { FontVariant } from "@/lib/schemas"

const RequestSchema = z.object({
  words: z.array(z.string().min(1)).min(2).max(50),
})

export interface ResolvedPhrase {
  words: string[]
  startIndex: number
  endIndex: number
  variant: FontVariant
  source: "cache" | "llm" | "vetted"
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
      const phraseText = phraseWords.join(" ")

      const vetted = getVettedPhraseStyle(phraseText)
      if (vetted) {
        console.log(`[phrase] "${phraseText}" (vetted) → ${vetted.family} ${vetted.weight} | hue=${vetted.colorIntent.hue} chroma=${vetted.colorIntent.chroma} L=${vetted.colorIntent.lightness}`)
        resolvedPhrases.push({
          words: phraseWords,
          startIndex: phrase.startIndex,
          endIndex: phrase.endIndex,
          variant: vetted,
          source: "vetted",
        })
        continue
      }

      const cached = await getCachedPhrase(phraseWords)
      if (cached) {
        console.log(`[phrase] "${phraseText}" (cache) → ${cached.family} ${cached.weight} | hue=${cached.colorIntent.hue} chroma=${cached.colorIntent.chroma} L=${cached.colorIntent.lightness}`)
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

      console.log(`[phrase] Styling "${phraseText}" (${phrase.reason})...`)
      const variant = await resolvePhraseWithLLM(phraseWords, phrase.reason)
      console.log(`[phrase] "${phraseText}" → ${variant.family} ${variant.weight} | hue=${variant.colorIntent.hue} chroma=${variant.colorIntent.chroma} L=${variant.colorIntent.lightness}`)

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
