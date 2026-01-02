import type { FontWeight } from "./schemas"

export interface FontEntry {
  family: string
  category: "serif" | "sans-serif" | "display" | "handwriting" | "monospace"
  weights: number[]
  hasItalic: boolean
}

interface GoogleFontsMetadata {
  familyMetadataList: Array<{
    family: string
    category: string
    fonts: Record<string, unknown>
  }>
}

let cachedFonts: Map<string, FontEntry> | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

function normalizeCategory(category: string): FontEntry["category"] {
  const lower = category.toLowerCase().replace(/\s+/g, "-")
  if (lower === "sans-serif" || lower === "sans serif") return "sans-serif"
  if (lower === "serif") return "serif"
  if (lower === "display") return "display"
  if (lower === "handwriting" || lower === "script") return "handwriting"
  if (lower === "monospace") return "monospace"
  return "sans-serif"
}

function parseWeightsFromFonts(fonts: Record<string, unknown>): { weights: number[]; hasItalic: boolean } {
  const weights = new Set<number>()
  let hasItalic = false

  for (const key of Object.keys(fonts)) {
    if (key.endsWith("i")) {
      hasItalic = true
      const weight = parseInt(key.slice(0, -1), 10)
      if (!isNaN(weight)) weights.add(weight)
    } else {
      const weight = parseInt(key, 10)
      if (!isNaN(weight)) weights.add(weight)
    }
  }

  return {
    weights: Array.from(weights).sort((a, b) => a - b),
    hasItalic,
  }
}

async function fetchGoogleFontsMetadata(): Promise<Map<string, FontEntry>> {
  const response = await fetch("https://fonts.google.com/metadata/fonts", {
    cache: "no-store", // Use our own in-memory cache instead
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Fonts: ${response.status}`)
  }

  const data: GoogleFontsMetadata = await response.json()
  const fonts = new Map<string, FontEntry>()

  for (const font of data.familyMetadataList) {
    const { weights, hasItalic } = parseWeightsFromFonts(font.fonts)

    fonts.set(font.family.toLowerCase(), {
      family: font.family,
      category: normalizeCategory(font.category),
      weights: weights.length > 0 ? weights : [400],
      hasItalic,
    })
  }

  return fonts
}

export async function ensureFontCatalog(): Promise<Map<string, FontEntry>> {
  const now = Date.now()

  if (cachedFonts && now - cacheTimestamp < CACHE_DURATION_MS) {
    return cachedFonts
  }

  try {
    cachedFonts = await fetchGoogleFontsMetadata()
    cacheTimestamp = now
    console.log(`Loaded ${cachedFonts.size} fonts from Google Fonts API`)
    return cachedFonts
  } catch (error) {
    console.error("Failed to fetch Google Fonts, using fallback:", error)
    if (cachedFonts) return cachedFonts
    cachedFonts = getFallbackCatalog()
    cacheTimestamp = now
    return cachedFonts
  }
}

function getFallbackCatalog(): Map<string, FontEntry> {
  const fonts = new Map<string, FontEntry>()

  const fallbackFonts: FontEntry[] = [
    { family: "Inter", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: false },
    { family: "Roboto", category: "sans-serif", weights: [100, 300, 400, 500, 700, 900], hasItalic: true },
    { family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900], hasItalic: true },
    { family: "Bebas Neue", category: "display", weights: [400], hasItalic: false },
    { family: "Dancing Script", category: "handwriting", weights: [400, 500, 600, 700], hasItalic: false },
    { family: "Fira Code", category: "monospace", weights: [300, 400, 500, 600, 700], hasItalic: false },
    { family: "Montserrat", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true },
    { family: "Lora", category: "serif", weights: [400, 500, 600, 700], hasItalic: true },
    { family: "Oswald", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700], hasItalic: false },
    { family: "Pacifico", category: "handwriting", weights: [400], hasItalic: false },
  ]

  for (const font of fallbackFonts) {
    fonts.set(font.family.toLowerCase(), font)
  }

  return fonts
}

export function isValidFont(family: string, catalog: Map<string, FontEntry>): boolean {
  return catalog.has(family.toLowerCase())
}

export function getFont(family: string, catalog: Map<string, FontEntry>): FontEntry | undefined {
  return catalog.get(family.toLowerCase())
}

export function getAvailableWeights(family: string, catalog: Map<string, FontEntry>): number[] {
  const font = getFont(family, catalog)
  return font?.weights ?? [400]
}

export function hasItalic(family: string, catalog: Map<string, FontEntry>): boolean {
  const font = getFont(family, catalog)
  return font?.hasItalic ?? false
}

export function validateWeight(family: string, weight: number, catalog: Map<string, FontEntry>): FontWeight {
  const available = getAvailableWeights(family, catalog)
  if (available.includes(weight)) return weight as FontWeight

  return available.reduce((prev, curr) =>
    Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev
  ) as FontWeight
}

export function validateStyle(
  family: string,
  style: "normal" | "italic",
  catalog: Map<string, FontEntry>
): "normal" | "italic" {
  if (style === "italic" && !hasItalic(family, catalog)) {
    return "normal"
  }
  return style
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

export function fuzzyMatchFont(input: string, catalog: Map<string, FontEntry>): string | null {
  const normalized = input.toLowerCase()

  if (catalog.has(normalized)) {
    return catalog.get(normalized)!.family
  }

  let bestMatch: FontEntry | null = null
  let bestScore = Infinity

  for (const font of catalog.values()) {
    const distance = levenshtein(normalized, font.family.toLowerCase())
    const threshold = font.family.length <= 8 ? 2 : 3

    if (distance < bestScore && distance <= threshold) {
      bestScore = distance
      bestMatch = font
    }
  }

  return bestMatch?.family ?? null
}

export function findFontByCategory(
  category: FontEntry["category"],
  catalog: Map<string, FontEntry>
): FontEntry | null {
  for (const font of catalog.values()) {
    if (font.category === category) {
      return font
    }
  }
  return null
}
