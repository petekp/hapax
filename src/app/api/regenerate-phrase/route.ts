import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { resolvePhraseWithLLM } from "@/lib/phrase-resolver"

const RequestSchema = z.object({
  phrase: z.string().min(1).max(500),
})

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

    const { phrase } = parseResult.data
    const words = phrase.split(/\s+/).map(w => w.toLowerCase().trim())

    console.log(`[regenerate-phrase] Generating fresh style for "${phrase}"...`)

    const variant = await resolvePhraseWithLLM(words, "User requested regeneration")

    console.log(`[regenerate-phrase] "${phrase}" → ${variant.family} ${variant.weight} | hue=${variant.colorIntent.hue} chroma=${variant.colorIntent.chroma} L=${variant.colorIntent.lightness}`)

    return NextResponse.json({
      variant,
      source: "regenerated" as const,
    })
  } catch (error) {
    console.error("[regenerate-phrase] Error:", error)
    return NextResponse.json(
      { error: "Failed to regenerate phrase style" },
      { status: 500 }
    )
  }
}
