import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod/v4"
import type { FontVariant } from "./schemas"
import {
  getCatalogForPrompt,
  isValidFont,
  fuzzyMatchFont,
  validateWeight,
  validateStyle,
} from "./google-fonts-catalog"

const LLMPhraseResponseSchema = z.object({
  family: z.string().describe("A Google Font family name from the provided list"),
  weight: z
    .number()
    .min(100)
    .max(900)
    .describe("Font weight (100=thin, 400=regular, 700=bold, 900=black)"),
  style: z
    .enum(["normal", "italic"])
    .describe("Font style - use italic for flowing, graceful, or emotional phrases"),
  hue: z
    .number()
    .min(0)
    .max(360)
    .describe("HSL hue value (0=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta)"),
  saturation: z
    .number()
    .min(0)
    .max(100)
    .describe("HSL saturation (0=gray, 50=muted, 100=vivid)"),
})

function buildPhrasePrompt(phrase: string, reason: string): string {
  const fontCatalog = getCatalogForPrompt()

  return `You are a creative typography expert. Given a phrase, select a Google Font and color that visually expresses its overall meaning, emotion, and cultural significance.

## Phrase to style: "${phrase}"
## Context: ${reason}

## Available Fonts (organized by category):

${fontCatalog}

## Guidelines:

**Font Selection for Phrases:**
- The font should capture the OVERALL vibe of the phrase
- Song titles: match the genre/mood (dreamy scripts for ballads, bold for rock, etc.)
- Place names: consider the cultural associations
- Idioms: match the emotional tone
- Cultural references: honor the source material's aesthetic

**Weight:**
- 100-300: whispered, ethereal, dreamy
- 400-500: balanced, conversational
- 600-700: confident, statement
- 800-900: powerful, impactful

**Style:**
- normal: straightforward, clear
- italic: flowing, musical, nostalgic, emotional

**Color (HSL hue):**
- Consider what color palette the phrase evokes
- Song titles: match the mood (warm for romantic, cool for melancholy)
- Places: geographic associations (sunny yellows for California, cool blues for Nordic places)
- Emotions: direct color associations

**Saturation:**
- 70-100: vivid, intense, dramatic
- 40-70: balanced, approachable
- 10-40: muted, nostalgic, sophisticated

Create a unified visual identity that captures the essence of this phrase.`
}

function getFallbackVariant(): FontVariant {
  return {
    family: "Inter",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 220, saturation: 50 },
  }
}

export async function resolvePhraseWithLLM(
  words: string[],
  reason: string
): Promise<FontVariant> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, using fallback for phrase")
    return getFallbackVariant()
  }

  const phrase = words.join(" ")

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: LLMPhraseResponseSchema,
      prompt: buildPhrasePrompt(phrase, reason),
      temperature: 0.7,
    })

    let validFamily = object.family

    if (!isValidFont(validFamily)) {
      const fuzzyMatch = fuzzyMatchFont(validFamily)
      if (fuzzyMatch) {
        validFamily = fuzzyMatch
      } else {
        console.warn(`Unknown font "${object.family}" for phrase, falling back to Inter`)
        validFamily = "Inter"
      }
    }

    const validWeight = validateWeight(validFamily, object.weight)
    const validStyle = validateStyle(validFamily, object.style)

    return {
      family: validFamily,
      weight: validWeight,
      style: validStyle,
      colorIntent: {
        hue: Math.round(object.hue) % 360,
        saturation: Math.min(100, Math.max(0, Math.round(object.saturation))),
      },
    }
  } catch (error) {
    console.error("Phrase LLM resolution error:", error)
    return getFallbackVariant()
  }
}
