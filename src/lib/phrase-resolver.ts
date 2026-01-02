import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod/v4";
import type { FontVariant } from "./schemas";
import {
  ensureFontCatalog,
  isValidFont,
  fuzzyMatchFont,
  validateWeight,
  validateStyle,
  findFontByCategory,
  type FontEntry,
} from "./google-fonts-catalog";

function getRandomFonts(
  catalog: Map<string, FontEntry>,
  count: number
): FontEntry[] {
  const allFonts = Array.from(catalog.values());
  const shuffled = allFonts.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const LLMPhraseResponseSchema = z.object({
  family: z
    .string()
    .describe("A Google Font family name that best expresses this phrase"),
  weight: z
    .number()
    .min(100)
    .max(900)
    .describe("Font weight (100=thin, 400=regular, 700=bold, 900=black)"),
  style: z
    .enum(["normal", "italic"])
    .describe(
      "Font style - use italic for flowing, graceful, or emotional phrases"
    ),
  hue: z
    .number()
    .min(0)
    .max(360)
    .describe(
      "HSL hue value (0=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta)"
    ),
  saturation: z
    .number()
    .min(0)
    .max(100)
    .describe("HSL saturation (0=gray, 50=muted, 100=vivid)"),
  category: z
    .enum(["serif", "sans-serif", "display", "handwriting", "monospace"])
    .describe("The font category you chose from"),
});

function buildPhrasePrompt(
  phrase: string,
  reason: string,
  _sampleFonts: FontEntry[]
): string {
  return `# Phrase Typography

Phrase: **"${phrase}"**
Context: ${reason}

You have ALL 1700+ Google Fonts. Make this phrase FEEL like its cultural meaning.

## The Phrase's World

"${phrase}" exists in a specific cultural context. What world does it evoke?

- What era? What decade's aesthetics?
- What genre of music, film, or art?
- What place, real or imagined?
- What emotion or atmosphere?

## Font Selection

Match the font to the phrase's soul:

- 60s/70s vibes: Righteous, Monoton, Bungee, Yellowtail
- 80s energy: Audiowide, Orbitron, Press Start 2P
- Classic/timeless: Playfair Display, Cormorant, Bodoni Moda
- Handmade/organic: Sacramento, Caveat, Homemade Apple
- Modern edge: Space Grotesk, Syne, Outfit
- Playful: Fredoka, Grandstander, Baloo 2
- Raw/powerful: Bebas Neue, Anton, Oswald

But these are just sparks - use ANY Google Font that captures "${phrase}".

## Color (Hue 0-360)

What color IS this phrase? Not what color it "should" be - what color do you SEE?

- "California Dreaming" might be warm amber (40), not obvious blue
- "I love you" might be deep burgundy (350) or soft coral (15)
- "Tech industry" might be electric cyan (185) or cold gray (0 sat)

Trust your instinct. The whole spectrum: 0=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta

## Saturation (0-100)

- 0-20: faded, nostalgic, timeworn
- 20-45: muted, sophisticated, vintage
- 45-65: natural, balanced
- 65-85: vivid, alive, present
- 85-100: electric, neon, impossible to ignore

## Weight (100-900)

How heavy is this phrase's presence?

## Make It Real

"${phrase}" - give it the typography it deserves. Something that makes people say "yes, that's exactly what it looks like."`;
}

function getFallbackVariant(): FontVariant {
  return {
    family: "Inter",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 220, saturation: 50 },
  };
}

export async function resolvePhraseWithLLM(
  words: string[],
  reason: string
): Promise<FontVariant> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set, using fallback for phrase");
    return getFallbackVariant();
  }

  const catalog = await ensureFontCatalog();
  const phrase = words.join(" ");
  const sampleFonts = getRandomFonts(catalog, 30);

  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5"),
      schema: LLMPhraseResponseSchema,
      prompt: buildPhrasePrompt(phrase, reason, sampleFonts),
      temperature: 0.8,
    });

    let validFamily = object.family;

    if (!isValidFont(validFamily, catalog)) {
      const fuzzyMatch = fuzzyMatchFont(validFamily, catalog);
      if (fuzzyMatch) {
        console.log(
          `Fuzzy matched phrase font "${object.family}" to "${fuzzyMatch}"`
        );
        validFamily = fuzzyMatch;
      } else {
        const categoryFallback = findFontByCategory(object.category, catalog);
        if (categoryFallback) {
          console.warn(
            `Unknown phrase font "${object.family}", using category fallback "${categoryFallback.family}"`
          );
          validFamily = categoryFallback.family;
        } else {
          console.warn(
            `Unknown phrase font "${object.family}", falling back to Inter`
          );
          validFamily = "Inter";
        }
      }
    }

    const validWeight = validateWeight(validFamily, object.weight, catalog);
    const validStyle = validateStyle(validFamily, object.style, catalog);

    return {
      family: validFamily,
      weight: validWeight,
      style: validStyle,
      colorIntent: {
        hue: Math.round(object.hue) % 360,
        saturation: Math.min(100, Math.max(0, Math.round(object.saturation))),
      },
    };
  } catch (error) {
    console.error("Phrase LLM resolution error:", error);
    return getFallbackVariant();
  }
}
