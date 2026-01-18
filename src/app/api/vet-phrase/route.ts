import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { z } from "zod/v4"
import type { FontVariant } from "@/lib/schemas"

const RequestSchema = z.object({
  phrase: z.string().min(1).max(500),
  variant: z.object({
    family: z.string(),
    weight: z.number().min(100).max(900),
    style: z.enum(["normal", "italic"]),
    colorIntent: z.object({
      hue: z.number().min(0).max(360),
      chroma: z.number().min(0).max(0.4),
      lightness: z.number().min(30).max(90),
    }),
  }),
})

const VETTED_STYLES_PATH = path.join(process.cwd(), "src/data/vetted-styles.json")

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Vetting is only available in development" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const parseResult = RequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { phrase, variant } = parseResult.data
    const normalized = phrase.toLowerCase().trim()

    const content = await fs.readFile(VETTED_STYLES_PATH, "utf-8")
    const data = JSON.parse(content)

    if (!data.phrases) {
      data.phrases = {}
    }

    data.phrases[normalized] = variant

    const sortedPhrases: Record<string, FontVariant> = {}
    for (const key of Object.keys(data.phrases).sort()) {
      sortedPhrases[key] = data.phrases[key]
    }
    data.phrases = sortedPhrases

    await fs.writeFile(VETTED_STYLES_PATH, JSON.stringify(data, null, 2) + "\n")

    console.log(`[vetted] Saved phrase "${normalized}" → ${variant.family} ${variant.weight}`)

    return NextResponse.json({ success: true, phrase: normalized })
  } catch (error) {
    console.error("[vet-phrase] Error:", error)
    return NextResponse.json(
      { error: "Failed to save vetted phrase style" },
      { status: 500 }
    )
  }
}
