import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { getVettedStyle } from "@/lib/vetted-cache"
import { getCachedFont, setCachedFont, incrementHitCount } from "@/lib/font-cache"
import { resolveWordWithLLM } from "@/lib/llm-resolver"
import type { FontVariant } from "@/lib/schemas"

const RequestSchema = z.object({
  word: z.string().min(1).max(100),
})

function getFallbackVariant(): FontVariant {
  return {
    family: "Inter",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 220, chroma: 0.15, lightness: 70 },
  }
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

    const { word } = parseResult.data
    const trimmed = word.trim()

    // Check vetted styles first (highest priority, normalized lookup)
    const vetted = getVettedStyle(trimmed)
    if (vetted) {
      console.log(`[word] "${trimmed}" (vetted) → ${vetted.family} ${vetted.weight} | hue=${vetted.colorIntent.hue} chroma=${vetted.colorIntent.chroma} L=${vetted.colorIntent.lightness}`)
      return NextResponse.json({
        variant: vetted,
        source: "vetted" as const,
      })
    }

    // Check runtime cache (cache key includes capitalization)
    const cached = await getCachedFont(trimmed)
    if (cached) {
      console.log(`[word] "${trimmed}" (cache) → ${cached.family} ${cached.weight} | hue=${cached.colorIntent.hue} chroma=${cached.colorIntent.chroma} L=${cached.colorIntent.lightness}`)
      // Fire and forget hit count increment
      incrementHitCount(trimmed).catch(console.error)

      return NextResponse.json({
        variant: cached,
        source: "cache" as const,
      })
    }

    // Cache miss - call LLM (pass original word with capitalization)
    const variant = await resolveWordWithLLM(trimmed)

    console.log(`[word] "${trimmed}" → ${variant.family} ${variant.weight} | hue=${variant.colorIntent.hue} chroma=${variant.colorIntent.chroma} L=${variant.colorIntent.lightness}`)

    // Store in cache (fire and forget)
    setCachedFont(trimmed, variant).catch(console.error)

    return NextResponse.json({
      variant,
      source: "llm" as const,
    })
  } catch (error) {
    console.error("[api/resolve-font] Font resolution error:", error)

    // Return a fallback on error - still 200 so client works
    return NextResponse.json({
      variant: getFallbackVariant(),
      source: "llm" as const,
    })
  }
}
