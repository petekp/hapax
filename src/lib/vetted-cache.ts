import type { FontVariant } from "./schemas"
import vettedStylesData from "@/data/vetted-styles.json"

interface VariantData {
  family: string
  weight: number
  style: "normal" | "italic"
  colorIntent: {
    hue: number
    chroma: number
    lightness: number
  }
}

interface VettedStylesFile {
  version: number
  words: Record<string, VariantData>
  phrases: Record<string, VariantData>
}

const data = vettedStylesData as VettedStylesFile
const vettedWords = new Map<string, FontVariant>()
const vettedPhrases = new Map<string, FontVariant>()

for (const [word, variant] of Object.entries(data.words)) {
  vettedWords.set(word.toLowerCase(), variant as FontVariant)
}

for (const [phrase, variant] of Object.entries(data.phrases)) {
  vettedPhrases.set(phrase.toLowerCase(), variant as FontVariant)
}

export function getVettedStyle(word: string): FontVariant | null {
  const normalized = word.toLowerCase().trim()
  return vettedWords.get(normalized) ?? null
}

export function getVettedPhraseStyle(phrase: string): FontVariant | null {
  const normalized = phrase.toLowerCase().trim()
  return vettedPhrases.get(normalized) ?? null
}

export function hasVettedStyle(word: string): boolean {
  const normalized = word.toLowerCase().trim()
  return vettedWords.has(normalized)
}

export function hasVettedPhraseStyle(phrase: string): boolean {
  const normalized = phrase.toLowerCase().trim()
  return vettedPhrases.has(normalized)
}

export function getVettedStylesVersion(): number {
  return data.version
}

export function getAllVettedWords(): string[] {
  return Array.from(vettedWords.keys())
}

export function getAllVettedPhrases(): string[] {
  return Array.from(vettedPhrases.keys())
}
