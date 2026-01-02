// Curated Google Fonts catalog for LLM font selection
// These fonts are chosen for their expressiveness and availability

import type { FontWeight } from "./schemas"

export interface FontEntry {
  family: string
  category: "serif" | "sans-serif" | "display" | "handwriting" | "monospace"
  weights: number[]
  hasItalic: boolean
  vibe: string // helps LLM understand the font's personality
}

// Curated list of ~100 expressive fonts organized by category
export const FONT_CATALOG: FontEntry[] = [
  // === DISPLAY FONTS (bold, attention-grabbing) ===
  { family: "Bebas Neue", category: "display", weights: [400], hasItalic: false, vibe: "bold, condensed, industrial, powerful" },
  { family: "Anton", category: "display", weights: [400], hasItalic: false, vibe: "heavy, impactful, headlines" },
  { family: "Righteous", category: "display", weights: [400], hasItalic: false, vibe: "retro, groovy, fun" },
  { family: "Bangers", category: "display", weights: [400], hasItalic: false, vibe: "comic book, loud, playful" },
  { family: "Permanent Marker", category: "display", weights: [400], hasItalic: false, vibe: "handwritten, casual, graffiti" },
  { family: "Alfa Slab One", category: "display", weights: [400], hasItalic: false, vibe: "slab serif, bold, strong" },
  { family: "Bungee", category: "display", weights: [400], hasItalic: false, vibe: "urban, signage, bold" },
  { family: "Rubik Mono One", category: "display", weights: [400], hasItalic: false, vibe: "geometric, heavy, modern" },
  { family: "Black Ops One", category: "display", weights: [400], hasItalic: false, vibe: "military, stencil, tactical" },
  { family: "Creepster", category: "display", weights: [400], hasItalic: false, vibe: "horror, spooky, halloween" },
  { family: "Fascinate", category: "display", weights: [400], hasItalic: false, vibe: "art deco, elegant display" },
  { family: "Faster One", category: "display", weights: [400], hasItalic: false, vibe: "speed, racing, motion" },
  { family: "Fredoka", category: "display", weights: [300, 400, 500, 600, 700], hasItalic: false, vibe: "friendly, rounded, playful" },
  { family: "Lacquer", category: "display", weights: [400], hasItalic: false, vibe: "brush stroke, artistic, expressive" },
  { family: "Luckiest Guy", category: "display", weights: [400], hasItalic: false, vibe: "cartoon, fun, bouncy" },
  { family: "Modak", category: "display", weights: [400], hasItalic: false, vibe: "indian, decorative, festive" },
  { family: "Nosifer", category: "display", weights: [400], hasItalic: false, vibe: "horror, dripping, scary" },
  { family: "Rubik Wet Paint", category: "display", weights: [400], hasItalic: false, vibe: "wet paint, dripping, artistic" },
  { family: "Shrikhand", category: "display", weights: [400], hasItalic: false, vibe: "indian, bold, festive" },
  { family: "Ultra", category: "display", weights: [400], hasItalic: false, vibe: "ultra bold, heavy, impactful" },

  // === SERIF FONTS (elegant, traditional, literary) ===
  { family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "elegant, editorial, luxury" },
  { family: "Cinzel", category: "serif", weights: [400, 500, 600, 700, 800, 900], hasItalic: false, vibe: "classical, roman, inscriptional" },
  { family: "Cormorant Garamond", category: "serif", weights: [300, 400, 500, 600, 700], hasItalic: true, vibe: "elegant, delicate, literary" },
  { family: "Lora", category: "serif", weights: [400, 500, 600, 700], hasItalic: true, vibe: "readable, contemporary, stories" },
  { family: "Merriweather", category: "serif", weights: [300, 400, 700, 900], hasItalic: true, vibe: "readable, screen-optimized, pleasant" },
  { family: "Crimson Text", category: "serif", weights: [400, 600, 700], hasItalic: true, vibe: "book, old-style, academic" },
  { family: "EB Garamond", category: "serif", weights: [400, 500, 600, 700, 800], hasItalic: true, vibe: "classical, timeless, books" },
  { family: "Libre Baskerville", category: "serif", weights: [400, 700], hasItalic: true, vibe: "traditional, elegant, readable" },
  { family: "Spectral", category: "serif", weights: [200, 300, 400, 500, 600, 700, 800], hasItalic: true, vibe: "modern serif, screen, elegant" },
  { family: "Vollkorn", category: "serif", weights: [400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "warm, readable, daily text" },
  { family: "Bodoni Moda", category: "serif", weights: [400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "fashion, high contrast, glamour" },
  { family: "Fraunces", category: "serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "wonky, soft, friendly serif" },
  { family: "Newsreader", category: "serif", weights: [200, 300, 400, 500, 600, 700, 800], hasItalic: true, vibe: "news, editorial, readable" },
  { family: "Bitter", category: "serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "slab serif, readable, sturdy" },
  { family: "Cardo", category: "serif", weights: [400, 700], hasItalic: true, vibe: "scholarly, unicode, historical" },

  // === SANS-SERIF FONTS (modern, clean, versatile) ===
  { family: "Montserrat", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "geometric, urban, modern" },
  { family: "Oswald", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700], hasItalic: false, vibe: "condensed, headlines, impactful" },
  { family: "Raleway", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "elegant, thin, sophisticated" },
  { family: "Poppins", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "geometric, friendly, modern" },
  { family: "Work Sans", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "neutral, screen, optimized" },
  { family: "Inter", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: false, vibe: "ui, technical, clear" },
  { family: "Space Grotesk", category: "sans-serif", weights: [300, 400, 500, 600, 700], hasItalic: false, vibe: "tech, futuristic, geometric" },
  { family: "DM Sans", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "low contrast, geometric, friendly" },
  { family: "Archivo", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "grotesque, strong, versatile" },
  { family: "Barlow", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "slightly rounded, friendly, soft" },
  { family: "Cabin", category: "sans-serif", weights: [400, 500, 600, 700], hasItalic: true, vibe: "humanist, warm, readable" },
  { family: "Exo 2", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "futuristic, tech, sci-fi" },
  { family: "Fjalla One", category: "sans-serif", weights: [400], hasItalic: false, vibe: "condensed, headlines, strong" },
  { family: "Josefin Sans", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700], hasItalic: true, vibe: "elegant, vintage, geometric" },
  { family: "Karla", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800], hasItalic: true, vibe: "grotesque, quirky, friendly" },
  { family: "Manrope", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800], hasItalic: false, vibe: "modern, clean, versatile" },
  { family: "Nunito", category: "sans-serif", weights: [200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "rounded, friendly, balanced" },
  { family: "Outfit", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: false, vibe: "geometric, modern, clean" },
  { family: "Quicksand", category: "sans-serif", weights: [300, 400, 500, 600, 700], hasItalic: false, vibe: "rounded, friendly, display" },
  { family: "Rubik", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "rounded corners, friendly, modern" },
  { family: "Sora", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800], hasItalic: false, vibe: "geometric, tech, clean" },
  { family: "Urbanist", category: "sans-serif", weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "low contrast, geometric, modern" },

  // === HANDWRITING/SCRIPT FONTS (personal, emotional, expressive) ===
  { family: "Dancing Script", category: "handwriting", weights: [400, 500, 600, 700], hasItalic: false, vibe: "casual script, friendly, lively" },
  { family: "Sacramento", category: "handwriting", weights: [400], hasItalic: false, vibe: "monoline script, casual, brush" },
  { family: "Pacifico", category: "handwriting", weights: [400], hasItalic: false, vibe: "brush script, fun, surf" },
  { family: "Great Vibes", category: "handwriting", weights: [400], hasItalic: false, vibe: "elegant script, formal, wedding" },
  { family: "Caveat", category: "handwriting", weights: [400, 500, 600, 700], hasItalic: false, vibe: "handwritten, casual, notes" },
  { family: "Kalam", category: "handwriting", weights: [300, 400, 700], hasItalic: false, vibe: "handwritten, casual, friendly" },
  { family: "Satisfy", category: "handwriting", weights: [400], hasItalic: false, vibe: "script, casual, flowing" },
  { family: "Shadows Into Light", category: "handwriting", weights: [400], hasItalic: false, vibe: "handwritten, whimsical, light" },
  { family: "Indie Flower", category: "handwriting", weights: [400], hasItalic: false, vibe: "handwritten, cute, personal" },
  { family: "Amatic SC", category: "handwriting", weights: [400, 700], hasItalic: false, vibe: "condensed hand, tall, quirky" },
  { family: "Architects Daughter", category: "handwriting", weights: [400], hasItalic: false, vibe: "handwritten, casual, sketchy" },
  { family: "Courgette", category: "handwriting", weights: [400], hasItalic: false, vibe: "medium script, casual, warm" },
  { family: "Gloria Hallelujah", category: "handwriting", weights: [400], hasItalic: false, vibe: "handwritten, comic, fun" },
  { family: "Homemade Apple", category: "handwriting", weights: [400], hasItalic: false, vibe: "very casual, personal, notes" },
  { family: "Kaushan Script", category: "handwriting", weights: [400], hasItalic: false, vibe: "brush script, bold, lively" },
  { family: "Lobster", category: "handwriting", weights: [400], hasItalic: false, vibe: "bold script, retro, fun" },
  { family: "Marck Script", category: "handwriting", weights: [400], hasItalic: false, vibe: "casual script, flowing" },
  { family: "Patrick Hand", category: "handwriting", weights: [400], hasItalic: false, vibe: "handwritten, casual, friendly" },
  { family: "Rock Salt", category: "handwriting", weights: [400], hasItalic: false, vibe: "rough handwritten, edgy" },
  { family: "Yellowtail", category: "handwriting", weights: [400], hasItalic: false, vibe: "vintage script, retro, americana" },

  // === MONOSPACE FONTS (technical, code, precise) ===
  { family: "Fira Code", category: "monospace", weights: [300, 400, 500, 600, 700], hasItalic: false, vibe: "coding, ligatures, technical" },
  { family: "JetBrains Mono", category: "monospace", weights: [100, 200, 300, 400, 500, 600, 700, 800], hasItalic: true, vibe: "coding, developer, precise" },
  { family: "Source Code Pro", category: "monospace", weights: [200, 300, 400, 500, 600, 700, 800, 900], hasItalic: true, vibe: "coding, adobe, clean" },
  { family: "Space Mono", category: "monospace", weights: [400, 700], hasItalic: true, vibe: "futuristic, geometric, mono" },
  { family: "Inconsolata", category: "monospace", weights: [200, 300, 400, 500, 600, 700, 800, 900], hasItalic: false, vibe: "humanist mono, readable" },
  { family: "Roboto Mono", category: "monospace", weights: [100, 200, 300, 400, 500, 600, 700], hasItalic: true, vibe: "geometric mono, google" },
  { family: "Ubuntu Mono", category: "monospace", weights: [400, 700], hasItalic: true, vibe: "linux, friendly mono" },
  { family: "Anonymous Pro", category: "monospace", weights: [400, 700], hasItalic: true, vibe: "coding, clear, readable" },
  { family: "Courier Prime", category: "monospace", weights: [400, 700], hasItalic: true, vibe: "typewriter, screenplay, classic" },
  { family: "Cutive Mono", category: "monospace", weights: [400], hasItalic: false, vibe: "typewriter, vintage, classic" },
]

// Lookup map for O(1) validation
const fontLookup = new Map<string, FontEntry>()
for (const font of FONT_CATALOG) {
  fontLookup.set(font.family.toLowerCase(), font)
}

export function isValidFont(family: string): boolean {
  return fontLookup.has(family.toLowerCase())
}

export function getFont(family: string): FontEntry | undefined {
  return fontLookup.get(family.toLowerCase())
}

export function getAvailableWeights(family: string): number[] {
  const font = getFont(family)
  return font?.weights ?? [400]
}

export function hasItalic(family: string): boolean {
  const font = getFont(family)
  return font?.hasItalic ?? false
}

export function validateWeight(family: string, weight: number): FontWeight {
  const available = getAvailableWeights(family)
  if (available.includes(weight)) return weight as FontWeight

  // Find closest available weight
  return available.reduce((prev, curr) =>
    Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev
  ) as FontWeight
}

export function validateStyle(family: string, style: "normal" | "italic"): "normal" | "italic" {
  if (style === "italic" && !hasItalic(family)) {
    return "normal"
  }
  return style
}

// Simple fuzzy matching using Levenshtein distance
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

export function fuzzyMatchFont(input: string): string | null {
  const normalized = input.toLowerCase()

  // Exact match
  if (fontLookup.has(normalized)) {
    return fontLookup.get(normalized)!.family
  }

  // Find best fuzzy match
  let bestMatch: FontEntry | null = null
  let bestScore = Infinity

  for (const font of FONT_CATALOG) {
    const distance = levenshtein(normalized, font.family.toLowerCase())
    const threshold = font.family.length <= 8 ? 2 : 3

    if (distance < bestScore && distance <= threshold) {
      bestScore = distance
      bestMatch = font
    }
  }

  return bestMatch?.family ?? null
}

// Get catalog formatted for LLM prompt
export function getCatalogForPrompt(): string {
  const byCategory: Record<string, string[]> = {}

  for (const font of FONT_CATALOG) {
    if (!byCategory[font.category]) {
      byCategory[font.category] = []
    }
    byCategory[font.category].push(`${font.family} (${font.vibe})`)
  }

  return Object.entries(byCategory)
    .map(([category, fonts]) => `${category.toUpperCase()}:\n${fonts.join(", ")}`)
    .join("\n\n")
}

// Get just font names for validation in prompt
export function getFontNamesForPrompt(): string {
  return FONT_CATALOG.map(f => f.family).join(", ")
}
