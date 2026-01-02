import { generateText, tool, stepCountIs, hasToolCall } from "ai";
import { openai } from "@ai-sdk/openai";
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

function searchFonts(
  catalog: Map<string, FontEntry>,
  options: {
    category?: string;
    minWeight?: number;
    maxWeight?: number;
    needsItalic?: boolean;
  }
): FontEntry[] {
  const results: FontEntry[] = [];

  for (const font of catalog.values()) {
    if (options.category && font.category !== options.category) continue;

    if (options.minWeight) {
      const hasHeavyEnough = font.weights.some((w) => w >= options.minWeight!);
      if (!hasHeavyEnough) continue;
    }

    if (options.maxWeight) {
      const hasLightEnough = font.weights.some((w) => w <= options.maxWeight!);
      if (!hasLightEnough) continue;
    }

    if (options.needsItalic && !font.hasItalic) continue;

    results.push(font);
  }

  // Shuffle and return up to 50
  return results.sort(() => Math.random() - 0.5).slice(0, 50);
}

function buildPrompt(word: string): string {
  return `You are a typographic synesthete. Words have SHAPES and TEXTURES in your mind.

Word: "${word}"

## FONT PERSONALITY GUIDE (critical - learn these vibes):

AGGRESSIVE/POWERFUL fonts:
- Black Ops One, Anton, Bebas Neue, Staatliches, Oswald → military, bold, commanding
- Bungee, Rubik Mono One → blocky, impactful
- Creepster, Nosifer, Eater → horror, disturbing

ELEGANT/REFINED fonts:
- Playfair Display, Cormorant, Bodoni Moda → sophisticated, literary
- Cinzel, Trajan → classical, monumental
- Crimson Text, EB Garamond → bookish, traditional

PLAYFUL/FRIENDLY fonts (NEVER use for dark/intense words!):
- Baloo, Nunito, Quicksand, Comfortaa → cute, approachable, childlike
- Gluten, Sniglet, Patrick Hand → fun, casual
- Lobster, Pacifico → retro-friendly script
- Corben → chunky rounded, TOO FRIENDLY for serious words

DARK/GOTHIC fonts:
- UnifrakturCook, Grenze Gotisch → blackletter, medieval dark
- IM Fell, Pirata One → weathered, ominous
- Nosifer, Creepster, Butcherman → horror

TECHY/MODERN fonts:
- Orbitron, Share Tech, Rajdhani → sci-fi, digital
- Space Mono, JetBrains Mono → code, technical
- Audiowide, Michroma → futuristic

DELICATE/LIGHT fonts:
- Cormorant (light weights), Lora → graceful serif
- Dancing Script, Alex Brush → flowing script

## BAD MATCHES TO AVOID:
- "haunted" + Baloo = WRONG (Baloo is cute/friendly)
- "war" + Lobster = WRONG (Lobster is casual script)
- "chaos" + clean geometric = WRONG (too orderly)
- "madman" + Gluten = WRONG (Gluten is playful/fun)
- Dark words + bright playful fonts = ALWAYS WRONG

## Search strategy:
Use searchFonts with category + weight filters.
After getting results, pick a font whose NAME suggests the right vibe.
When unsure, prefer fonts with evocative names (Creepster for horror, Orbitron for tech).

VARIETY IS KEY - don't keep picking the same fonts:
- UnifrakturCook is great but don't use it for every dark word
- Grenze Gotisch is great but don't use it for every gothic word
- Explore the FULL results, pick something that fits THIS specific word
- "war" and "armageddon" should have DIFFERENT fonts - they're different vibes

## Color (HSL) - BE UNIQUE AND BOLD!

Every word deserves its OWN distinct color. Don't default to obvious choices.

AVOID COLOR CLICHÉS:
- Not everything intense is red (hue=0)
- Not everything calm is blue (hue=240)
- Think about the SPECIFIC word, not the category

UNEXPECTED COLOR IDEAS:
- "war" could be hue=30 (burnt orange) or hue=350 (dark crimson), not just pure red
- "madman" could be hue=280 (violet) or hue=50 (sickly yellow)
- "chaos" could be hue=300 (magenta) or hue=15 (vermillion)
- "saturn" → hue=45 (golden), NOT blue
- "jupiter" → hue=25 (tan/orange bands), NOT blue
- "mars" → hue=15 (rust red)
- "destroyer" could be hue=270 (deep purple) or hue=0 (crimson)

USE THE FULL HUE WHEEL:
0=red, 15=vermillion, 30=orange, 45=gold, 60=yellow, 90=chartreuse
120=green, 150=spring, 180=cyan, 210=sky, 240=blue, 270=purple, 300=magenta, 330=rose

Saturation: Most words sat 50-80. Only "void/ash/fog/mist/shadow" can be sat 0-25.

Think: What SPECIFIC shade is THIS word? Not what category of color.

## Submit
Call selectFont. The font must EMBODY "${word}" - if it doesn't feel right, search again.`;
}

const FinalChoiceSchema = z.object({
  family: z.string(),
  weight: z.number().min(100).max(900),
  style: z.enum(["normal", "italic"]),
  hue: z.number().min(0).max(360),
  saturation: z.number().min(0).max(100),
  category: z.enum(["serif", "sans-serif", "display", "handwriting", "monospace"]),
});

function getFallbackVariant(): FontVariant {
  return {
    family: "Inter",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 220, saturation: 50 },
  };
}

export async function resolveWordWithLLM(word: string): Promise<FontVariant> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getFallbackVariant();
  }

  const catalog = await ensureFontCatalog();

  try {
    const { steps } = await generateText({
      model: openai("gpt-4o-mini"),
      tools: {
        searchFonts: tool({
          description:
            "Search for Google Fonts matching criteria. Returns up to 50 random matching fonts.",
          inputSchema: z.object({
            category: z
              .enum(["serif", "sans-serif", "display", "handwriting", "monospace"])
              .optional()
              .describe("Font category to filter by"),
            minWeight: z
              .number()
              .min(100)
              .max(900)
              .optional()
              .describe("Minimum font weight needed"),
            maxWeight: z
              .number()
              .min(100)
              .max(900)
              .optional()
              .describe("Maximum font weight needed"),
            needsItalic: z
              .boolean()
              .optional()
              .describe("Whether italic style is required"),
          }),
          execute: async (params) => {
            const results = searchFonts(catalog, params);
            return results.map((f) => ({
              family: f.family,
              category: f.category,
              weights: f.weights,
              hasItalic: f.hasItalic,
            }));
          },
        }),
        selectFont: tool({
          description:
            "Submit your final font and color choice for this word. Call this after searching.",
          inputSchema: FinalChoiceSchema,
          execute: async (choice) => {
            return { selected: true, ...choice };
          },
        }),
      },
      stopWhen: [stepCountIs(5), hasToolCall("selectFont")],
      prompt: buildPrompt(word),
      temperature: 0.9,
    });

    // Find the selectFont tool call from steps
    const allToolCalls = steps?.flatMap((step) => step.toolCalls) ?? [];
    const selectCall = allToolCalls.find((tc) => tc.toolName === "selectFont");

    if (selectCall && "input" in selectCall) {
      const choice = selectCall.input as z.infer<typeof FinalChoiceSchema>;

      let validFamily = choice.family;

      if (!isValidFont(validFamily, catalog)) {
        const fuzzyMatch = fuzzyMatchFont(validFamily, catalog);
        if (fuzzyMatch) {
          validFamily = fuzzyMatch;
        } else {
          const categoryFallback = findFontByCategory(choice.category, catalog);
          validFamily = categoryFallback?.family ?? "Inter";
        }
      }

      const validWeight = validateWeight(validFamily, choice.weight, catalog);
      const validStyle = validateStyle(validFamily, choice.style, catalog);

      return {
        family: validFamily,
        weight: validWeight,
        style: validStyle,
        colorIntent: {
          hue: Math.round(choice.hue) % 360,
          saturation: Math.min(100, Math.max(0, Math.round(choice.saturation))),
        },
      };
    }

    // Fallback: try to parse font from text response
    console.warn("[llm-resolver] No selectFont call, parsing text response");
    return getFallbackVariant();
  } catch (error) {
    console.error("[llm-resolver] LLM resolution error:", error);
    return getFallbackVariant();
  }
}
