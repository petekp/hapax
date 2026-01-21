import type { FontVariant } from "./schemas"
import vettedStyles from "@/data/vetted-styles.json"

interface VettedStylesData {
  version: number
  words: Record<string, FontVariant>
}

const data = vettedStyles as VettedStylesData

function buildGoogleFontsPreloadUrl(
  requests: Array<{ word: string; variant: FontVariant }>
): string {
  const base = "https://fonts.googleapis.com/css2"

  const allChars = new Set<string>()
  const familyParams: string[] = []
  const seenFamilies = new Set<string>()

  for (const req of requests) {
    for (const char of req.word) {
      allChars.add(char)
    }

    const key = `${req.variant.family}:${req.variant.weight}:${req.variant.style}`
    if (seenFamilies.has(key)) continue
    seenFamilies.add(key)

    const family = req.variant.family.replace(/ /g, "+")

    if (req.variant.style === "italic") {
      familyParams.push(`family=${family}:ital,wght@1,${req.variant.weight}`)
    } else {
      familyParams.push(`family=${family}:wght@${req.variant.weight}`)
    }
  }

  const parts = [...familyParams]

  const uniqueChars = [...allChars].join("")
  if (uniqueChars) {
    parts.push(`text=${encodeURIComponent(uniqueChars)}`)
  }

  parts.push("display=swap")

  return `${base}?${parts.join("&")}`
}

// Get the first N words that appear in the gallery (above-fold)
// Gallery distributes words across 4 rows, interleaved
function getAboveFoldWords(count = 32): Array<{ word: string; variant: FontVariant }> {
  const entries = Object.entries(data.words)
  const result: Array<{ word: string; variant: FontVariant }> = []

  // Match gallery's distribution: 4 rows, 8 words each, interleaved
  const rowCount = 4
  const wordsPerRow = 8

  for (let row = 0; row < rowCount; row++) {
    let wordIndex = row
    for (let i = 0; i < wordsPerRow && result.length < count; i++) {
      const entry = entries[wordIndex % entries.length]
      if (entry) {
        result.push({ word: entry[0], variant: entry[1] })
      }
      wordIndex += rowCount
    }
  }

  return result
}

// Generate preload URLs, batched to avoid URL length limits
export function getPreloadUrls(wordsCount = 32, batchSize = 12): string[] {
  const words = getAboveFoldWords(wordsCount)
  const urls: string[] = []

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize)
    urls.push(buildGoogleFontsPreloadUrl(batch))
  }

  return urls
}

// Pre-compute for static rendering
export const PRELOAD_URLS = getPreloadUrls(32, 12)
