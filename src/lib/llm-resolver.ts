import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod/v4"
import type { FontVariant } from "./schemas"
import {
  getCatalogForPrompt,
  getFontNamesForPrompt,
  isValidFont,
  fuzzyMatchFont,
  validateWeight,
  validateStyle,
} from "./google-fonts-catalog"

const LLMFontResponseSchema = z.object({
  family: z.string().describe("A Google Font family name from the provided list"),
  weight: z
    .number()
    .min(100)
    .max(900)
    .describe("Font weight (100=thin, 400=regular, 700=bold, 900=black)"),
  style: z
    .enum(["normal", "italic"])
    .describe("Font style - use italic for flowing, graceful, or whispered words"),
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

function buildPrompt(word: string): string {
  const fontCatalog = getCatalogForPrompt()

  return `You are a creative typography expert. Given a single word, select a Google Font and color that visually expresses its meaning, emotion, or essence.

## Word to style: "${word}"

## Available Fonts (organized by category):

${fontCatalog}

## Guidelines:

**Font Selection:**
- Match the font's personality to the word's meaning and emotion
- DISPLAY fonts: bold statements, power, impact, fun, headlines
- SERIF fonts: elegance, tradition, literature, sophistication
- SANS-SERIF fonts: modern, clean, tech, neutral, professional
- HANDWRITING fonts: personal, emotional, casual, creative, whimsical
- MONOSPACE fonts: technical, code, precise, digital, robotic

**Weight:**
- 100-300: delicate, light, whisper, ethereal
- 400-500: balanced, normal, everyday
- 600-700: strong, emphasis, confident
- 800-900: powerful, heavy, bold statements

**Style:**
- normal: default, straightforward
- italic: flowing, graceful, whispered, poetic, movement

**Color (HSL hue):**
- 0-30: passion, anger, fire, love, warmth, energy
- 30-60: joy, optimism, sunshine, creativity, caution
- 60-90: nature, freshness, spring
- 90-150: growth, calm, nature, health, envy
- 150-210: cool, water, sky, trust, technology
- 210-270: trust, sadness, depth, calm, corporate
- 270-330: royalty, mystery, magic, luxury, spirituality
- 330-360: romance, sweetness, playfulness

**Saturation:**
- 70-100: vivid, intense, emotional, dramatic
- 40-70: balanced, approachable
- 10-40: muted, subtle, sophisticated, calm

Be creative and expressive! The goal is for each word to feel unique and meaningful.`
}

function getFallbackVariant(): FontVariant {
  return {
    family: "Inter",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 220, saturation: 50 },
  }
}

export async function resolveWordWithLLM(word: string): Promise<FontVariant> {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY not set, using fallback")
    return getFallbackVariant()
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: LLMFontResponseSchema,
      prompt: buildPrompt(word),
      temperature: 0.7, // Some creativity but not too random
    })

    // Validate and correct the font family
    let validFamily = object.family

    if (!isValidFont(validFamily)) {
      // Try fuzzy matching
      const fuzzyMatch = fuzzyMatchFont(validFamily)
      if (fuzzyMatch) {
        validFamily = fuzzyMatch
      } else {
        // Use a sensible fallback
        console.warn(`Unknown font "${object.family}", falling back to Inter`)
        validFamily = "Inter"
      }
    }

    // Validate weight and style against what the font supports
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
    console.error("LLM resolution error:", error)
    return getFallbackVariant()
  }
}
