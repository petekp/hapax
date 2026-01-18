import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { resolveWordWithLLM } from "@/lib/llm-resolver"

const RequestSchema = z.object({
  word: z.string().min(1).max(100),
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

    const { word } = parseResult.data

    console.log(`[regenerate] Generating fresh style for "${word}"...`)

    const variant = await resolveWordWithLLM(word)

    console.log(`[regenerate] "${word}" → ${variant.family} ${variant.weight} | hue=${variant.colorIntent.hue} chroma=${variant.colorIntent.chroma} L=${variant.colorIntent.lightness}`)

    return NextResponse.json({
      variant,
      source: "regenerated" as const,
    })
  } catch (error) {
    console.error("[regenerate-word] Error:", error)
    return NextResponse.json(
      { error: "Failed to regenerate style" },
      { status: 500 }
    )
  }
}
