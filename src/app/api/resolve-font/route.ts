import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
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
    colorIntent: { hue: 220, saturation: 50 },
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
    const normalized = word.toLowerCase().trim()

    // Check cache first
    const cached = await getCachedFont(normalized)
    if (cached) {
      console.log(`[STYLED] "${normalized}" (cache) → ${cached.family} ${cached.weight} ${cached.style} | hue=${cached.colorIntent.hue} sat=${cached.colorIntent.saturation}`)
      // Fire and forget hit count increment
      incrementHitCount(normalized).catch(console.error)

      return NextResponse.json({
        variant: cached,
        source: "cache" as const,
      })
    }

    // Cache miss - call LLM
    const variant = await resolveWordWithLLM(normalized)

    console.log(`[STYLED] "${normalized}" → ${variant.family} ${variant.weight} | hue=${variant.colorIntent.hue} sat=${variant.colorIntent.saturation}`)

    // Store in cache (fire and forget)
    setCachedFont(normalized, variant).catch(console.error)

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
