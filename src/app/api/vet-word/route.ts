import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { z } from "zod/v4"
import type { FontVariant } from "@/lib/schemas"

const RequestSchema = z.object({
  word: z.string().min(1).max(100),
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

    const { word, variant } = parseResult.data
    const normalized = word.toLowerCase().trim()

    const content = await fs.readFile(VETTED_STYLES_PATH, "utf-8")
    const data = JSON.parse(content)

    data.words[normalized] = variant

    const sortedWords: Record<string, FontVariant> = {}
    for (const key of Object.keys(data.words).sort()) {
      sortedWords[key] = data.words[key]
    }
    data.words = sortedWords

    await fs.writeFile(VETTED_STYLES_PATH, JSON.stringify(data, null, 2) + "\n")

    console.log(`[vetted] Saved "${normalized}" → ${variant.family} ${variant.weight}`)

    return NextResponse.json({ success: true, word: normalized })
  } catch (error) {
    console.error("[vet-word] Error:", error)
    return NextResponse.json(
      { error: "Failed to save vetted style" },
      { status: 500 }
    )
  }
}
