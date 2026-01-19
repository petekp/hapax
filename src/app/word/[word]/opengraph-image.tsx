import { generateWordOgImage, size as ogSize, contentType as ogContentType } from "@/lib/og/og-image"
import { readFileSync } from "fs"
import { join } from "path"
import type { FontVariant } from "@/lib/schemas"

export const runtime = "nodejs"
export const alt = "A rare word from hapax.ink"
export const size = ogSize
export const contentType = ogContentType

interface WordsIndex {
  words: Record<string, FontVariant>
}

function loadWordVariant(word: string): FontVariant | null {
  try {
    const indexPath = join(process.cwd(), "src", "generated", "words-index.json")
    const content = readFileSync(indexPath, "utf-8")
    const data: WordsIndex = JSON.parse(content)
    return data.words[word.toLowerCase()] || null
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ word: string }> }) {
  const { word } = await params
  const decodedWord = decodeURIComponent(word)

  const variant = loadWordVariant(decodedWord)

  if (!variant) {
    const fallbackVariant: FontVariant = {
      family: "Georgia",
      weight: 400,
      style: "normal",
      colorIntent: { hue: 220, chroma: 0.15, lightness: 70 },
    }
    return generateWordOgImage(decodedWord, fallbackVariant)
  }

  return generateWordOgImage(decodedWord, variant)
}
