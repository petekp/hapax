import { generateText, tool, stepCountIs } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod/v4"
import type { ColorIntent, FontVariant } from "./schemas"

export interface ColorProposal {
  word: string
  currentIntent: ColorIntent
  proposedIntent: ColorIntent
  semanticRationale: string
  hueCategory: string
}

export interface HueTarget {
  minHue: number
  maxHue: number
  name: string
  targetPercentMin: number
  targetPercentMax: number
}

export interface ProposalConstraints {
  chromaCeiling: number
  aesthetic: "celestial"
  hueTargets: HueTarget[]
}

const DEFAULT_HUE_TARGETS: HueTarget[] = [
  { minHue: 0, maxHue: 29, name: "red/orange", targetPercentMin: 6, targetPercentMax: 7 },
  { minHue: 30, maxHue: 59, name: "amber/gold", targetPercentMin: 10, targetPercentMax: 12 },
  { minHue: 60, maxHue: 89, name: "yellow-green", targetPercentMin: 5, targetPercentMax: 7 },
  { minHue: 90, maxHue: 119, name: "green", targetPercentMin: 5, targetPercentMax: 7 },
  { minHue: 120, maxHue: 149, name: "green-teal", targetPercentMin: 7, targetPercentMax: 10 },
  { minHue: 150, maxHue: 179, name: "cyan-green", targetPercentMin: 7, targetPercentMax: 10 },
  { minHue: 180, maxHue: 209, name: "cyan/teal", targetPercentMin: 10, targetPercentMax: 12 },
  { minHue: 210, maxHue: 239, name: "blue", targetPercentMin: 12, targetPercentMax: 15 },
  { minHue: 240, maxHue: 269, name: "indigo", targetPercentMin: 10, targetPercentMax: 12 },
  { minHue: 270, maxHue: 299, name: "violet/purple", targetPercentMin: 12, targetPercentMax: 15 },
  { minHue: 300, maxHue: 329, name: "magenta/rose", targetPercentMin: 7, targetPercentMax: 10 },
  { minHue: 330, maxHue: 359, name: "pink/red", targetPercentMin: 5, targetPercentMax: 7 },
]

const DEFAULT_CONSTRAINTS: ProposalConstraints = {
  chromaCeiling: 0.22,
  aesthetic: "celestial",
  hueTargets: DEFAULT_HUE_TARGETS,
}

const ProposalOutputSchema = z.object({
  word: z.string(),
  hue: z.number().min(0).max(360),
  chroma: z.number().min(0).max(0.4),
  lightness: z.number().min(30).max(90),
  hueCategory: z.string(),
  semanticRationale: z.string(),
})

function buildBatchPrompt(
  words: Array<{ word: string; currentIntent: ColorIntent }>,
  constraints: ProposalConstraints
): string {
  const wordList = words
    .map((w) => `- "${w.word}" (current: hue ${w.currentIntent.hue}°, chroma ${w.currentIntent.chroma}, lightness ${w.currentIntent.lightness})`)
    .join("\n")

  const hueTargetInfo = constraints.hueTargets
    .map((t) => `  ${t.minHue}-${t.maxHue}° ${t.name}: target ${t.targetPercentMin}-${t.targetPercentMax}%`)
    .join("\n")

  return `You are restyling a gallery of rare, beautiful words. Each word needs a color that captures its ESSENCE and MEANING.

## AESTHETIC: CELESTIAL & MYSTERIOUS

The gallery should feel like a night sky—deep, luminous, otherworldly. Think:
- Bioluminescence in dark water
- Stars against infinite darkness
- The glow of distant nebulae
- Moonlight on ancient stone

This means:
- FAVOR cool hues (blues, teals, indigos, violets) for most words
- USE warm hues (golds, ambers, roses) SPARINGLY as rare accents
- KEEP chroma restrained (default ceiling: ${constraints.chromaCeiling}) for cohesion
- LET meaning guide lightness: dark words should be dark, luminous words can be bright

## COLOR SYSTEM (OKLCH)

**HUE (0-360)**: Color family. Choose based on word MEANING:
${hueTargetInfo}

**CHROMA (0-${constraints.chromaCeiling})**: Saturation. Most words: 0.12-0.18. Only words with inherent luminosity (effulgent, phosphorescent) should exceed the ceiling.

**LIGHTNESS (30-90)**: Dark to bright. Match the word's weight:
- 30-45: heavy, dark, shadowy words (eigengrau, tenebrous, crepuscular)
- 45-60: balanced, most words
- 60-75: airy, light words (gossamer, ethereal)
- 75-90: truly luminous words (alabaster, candescent)

## SEMANTIC COLOR PRINCIPLES

The color must be DEFENSIBLE from the word's meaning. Ask:
- What does this word FEEL like?
- What images does it evoke?
- What temperature is it? (cool/warm)
- What weight does it have? (heavy/light)
- What era? (ancient/timeless/modern)

Examples of good semantic fit:
- "eigengrau" (color you see in darkness) → very dark, nearly achromatic violet
- "welkin" (sky/heavens) → ethereal pale blue, high lightness
- "carbuncle" (glowing red gem) → deep ruby, can exceed chroma ceiling
- "petrichor" (smell of rain) → muted teal-green
- "susurrus" (whispering sound) → pale silvery-blue

## WORDS TO RESTYLE

${wordList}

## YOUR TASK

For each word, call the proposeColor tool with:
1. The word
2. Hue that captures its meaning
3. Chroma (usually 0.12-0.18, max ${constraints.chromaCeiling} unless semantic exception)
4. Lightness that matches its weight/mood
5. Category name for the hue range
6. Brief semantic rationale (1-2 sentences explaining WHY this color fits)

Process each word thoughtfully. Don't default to purple/violet for everything.`
}

export async function proposeColorsForBatch(
  words: Array<{ word: string; currentIntent: ColorIntent; variant: FontVariant }>,
  constraints: ProposalConstraints = DEFAULT_CONSTRAINTS
): Promise<ColorProposal[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set")
  }

  const proposals: ColorProposal[] = []

  await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    tools: {
      proposeColor: tool({
        description: "Submit a color proposal for a word",
        inputSchema: ProposalOutputSchema,
        execute: async (input) => {
          const proposal: ColorProposal = {
            word: input.word,
            currentIntent: words.find((w) => w.word.toLowerCase() === input.word.toLowerCase())?.currentIntent ?? {
              hue: 0,
              chroma: 0,
              lightness: 50,
            },
            proposedIntent: {
              hue: Math.round(input.hue) % 360,
              chroma: Math.min(0.4, Math.max(0, input.chroma)),
              lightness: Math.min(90, Math.max(30, Math.round(input.lightness))),
            },
            semanticRationale: input.semanticRationale,
            hueCategory: input.hueCategory,
          }
          proposals.push(proposal)
          return { accepted: true, word: input.word }
        },
      }),
    },
    stopWhen: [stepCountIs(words.length + 5)],
    prompt: buildBatchPrompt(
      words.map((w) => ({ word: w.word, currentIntent: w.currentIntent })),
      constraints
    ),
    temperature: 0.7,
  })

  return proposals
}

export async function proposeColors(
  wordData: Array<{ word: string; currentIntent: ColorIntent; variant: FontVariant }>,
  constraints: ProposalConstraints = DEFAULT_CONSTRAINTS,
  batchSize: number = 10
): Promise<ColorProposal[]> {
  const allProposals: ColorProposal[] = []

  for (let i = 0; i < wordData.length; i += batchSize) {
    const batch = wordData.slice(i, i + batchSize)
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(wordData.length / batchSize)}...`)

    const proposals = await proposeColorsForBatch(batch, constraints)
    allProposals.push(...proposals)

    if (i + batchSize < wordData.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return allProposals
}
