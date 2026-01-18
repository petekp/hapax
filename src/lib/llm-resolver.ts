import { generateText, tool, stepCountIs, hasToolCall } from "ai";
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

function isCapitalized(word: string): boolean {
  if (word.length === 0) return false;
  const firstChar = word[0];
  return (
    firstChar === firstChar.toUpperCase() &&
    firstChar !== firstChar.toLowerCase()
  );
}

function buildPrompt(word: string): string {
  const capitalized = isCapitalized(word);
  const properNounContext = capitalized
    ? `\n\n**PROPER NOUN DETECTED**: "${word}" is capitalized, indicating it's likely a proper noun (name, place, brand, title). Consider:\n- NAMES (Sarah, Michael): elegant, personal, classic fonts - think refined serifs or sophisticated sans\n- PLACES (Paris, Tokyo): fonts evoking cultural character - romantic for Paris, modern for Tokyo\n- BRANDS (Apple, Nike): clean, contemporary, purposeful typography\n- TITLES (Beatles, Gatsby): fonts matching the era or genre of what's named`
    : "";

  return `You experience grapheme-color synesthesia for typography. The word "${word}" triggers a vivid, involuntary perception of a specific font and color.${properNounContext}

## STEP 1: FEEL THE WORD

Before searching, sense "${word}":
- What WEIGHT does it have? (massive? featherlight? medium?)
- What TEXTURE? (sharp edges? smooth curves? rough? refined?)
- What ERA? (ancient? futuristic? timeless?)
- What TEMPERATURE? (burning? icy? neutral?)
- What EMOTION? (aggressive? serene? chaotic? elegant?)

## STEP 2: SEARCH FOR FONTS

Use searchFonts. Match your sensations:
- WEIGHT: minWeight 700+ for heavy words, maxWeight 300 for delicate
- CATEGORY: "display" for impactful, "serif" for literary, "handwriting" for organic, "monospace" for technical

## STEP 3: MATCH FONT TO WORD

BANNED FONTS (never pick these, they're wrong for almost everything):
- Corben: chunky, childish, cartoonish - NEVER USE
- Baloo, Nunito, Quicksand, Comfortaa: too cute/childish
- Gluten, Sniglet, Patrick Hand: too playful
- Lobster, Pacifico: overused casual scripts

GOTHIC/BLACKLETTER fonts (UnifrakturCook, Grenze Gotisch, Pirata One):
- ONLY for: medieval, dark, evil, doom, death, gothic, ancient, curse, demon
- NEVER for: star, movie, science, modern, bright, happy, tech, nature

MATCH THE WORD'S ESSENCE:
- Bright/sparkling words (star, shine, light) → clean, modern fonts with personality
- Cinema/film words → elegant serifs, classic Hollywood feel
- Nature words → organic, flowing fonts
- Tech words → geometric, monospace
- Elegant words → refined serifs with contrast
- Playful words (monkey, silly) → fun display fonts (but not the banned ones)

Font names reveal personality:
- "Black", "Ultra", "Heavy" in name → bold, powerful
- "Light", "Thin" in name → delicate
- Evocative names (Creepster, Butcherman) → match their vibe

## STEP 4: CHOOSE YOUR COLOR (OKLCH)

Close your eyes. "${word}" appears in your mind. What color IS it?

We use OKLCH for perceptually uniform colors. You control three dimensions:

**HUE (0-360)** - The color family:
0-30: reds, rusts, ambers (blood, fire, rust, anger, heat)
30-60: oranges, golds (warmth, energy, autumn, honey)
60-90: yellows, limes (sunshine, acid, electric, caution)
90-150: greens (nature, poison, envy, growth, decay)
150-210: teals, cyans (ocean, ice, clinical, digital)
210-270: blues, indigos (depth, sadness, night, mystery)
270-330: purples, magentas (royal, mystic, corrupt, fantasy)
330-360: roses, crimsons (passion, flesh, romantic, violent)

DO NOT DEFAULT TO hue=210. That's lazy. Is "${word}" really sky blue?

**CHROMA (0-0.4)** - Color intensity/saturation:
- 0.25-0.35: vivid, alive (default for most words)
- 0.35-0.4: electric, intense, neon (danger, fire, toxic)
- 0.15-0.25: sophisticated, muted (elegant, vintage, subtle)
- 0.05-0.15: nearly neutral (fog, ash, shadow, whisper)
- 0: pure grayscale (void, nothing, blank)

**LIGHTNESS (30-90)** - How light or dark:
- 75-90: bright, airy, luminous (light, shine, glow, heaven)
- 60-75: balanced, natural (default for most words)
- 45-60: rich, deep, saturated (ocean, wine, forest)
- 30-45: dark, heavy, dramatic (shadow, doom, night, void)

IMPORTANT: Use lightness to add DEPTH. Don't make everything 70%. A "shadow" should be dark (35), a "sunshine" should be bright (85).

## STEP 5: SUBMIT

Call selectFont with:
- A font that captures the ESSENCE of "${word}"
- A color with precise hue, chroma (intensity), and lightness (depth)
- The weight that matches the word's presence`;
}

const FinalChoiceSchema = z.object({
  family: z.string(),
  weight: z.number().min(100).max(900),
  style: z.enum(["normal", "italic"]),
  hue: z.number().min(0).max(360),
  chroma: z.number().min(0).max(0.4),
  lightness: z.number().min(30).max(90),
  category: z.enum([
    "serif",
    "sans-serif",
    "display",
    "handwriting",
    "monospace",
  ]),
});

function getFallbackVariant(): FontVariant {
  return {
    family: "Inter",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 220, chroma: 0.15, lightness: 70 },
  };
}

export async function resolveWordWithLLM(word: string): Promise<FontVariant> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getFallbackVariant();
  }

  const capitalized = isCapitalized(word);
  console.log(
    `[word] Styling "${word}"${capitalized ? " (proper noun)" : ""}...`
  );

  const catalog = await ensureFontCatalog();

  try {
    const { steps } = await generateText({
      model: anthropic("claude-opus-4-5"),
      tools: {
        searchFonts: tool({
          description:
            "Search for Google Fonts matching criteria. Returns up to 50 random matching fonts.",
          inputSchema: z.object({
            category: z
              .enum([
                "serif",
                "sans-serif",
                "display",
                "handwriting",
                "monospace",
              ])
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
          chroma: Math.min(0.4, Math.max(0, choice.chroma)),
          lightness: Math.min(90, Math.max(30, Math.round(choice.lightness))),
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
