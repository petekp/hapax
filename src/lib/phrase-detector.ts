import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod/v4";

const PhraseDetectionSchema = z.object({
  phrases: z
    .array(
      z.object({
        words: z
          .array(z.string())
          .describe("The exact words that form this phrase, in order"),
        startIndex: z.number().describe("Index of first word in the phrase"),
        endIndex: z
          .number()
          .describe("Index of last word in the phrase (inclusive)"),
        reason: z
          .string()
          .describe("Brief explanation of why this is a meaningful phrase"),
      })
    )
    .describe("Detected phrases that should be styled as a unit"),
});

export interface DetectedPhrase {
  words: string[];
  startIndex: number;
  endIndex: number;
  reason: string;
}

const DETECTION_CACHE_PREFIX = "vibe:detection:";
const DETECTION_VERSION = "claude-haiku-v5-strict";

interface DetectionCacheEntry {
  phrases: DetectedPhrase[];
  version: string;
  createdAt: number;
}

const memoryDetectionCache = new Map<string, DetectionCacheEntry>();

function hasVercelKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKV() {
  if (!hasVercelKV()) {
    return null;
  }
  const { kv } = await import("@vercel/kv");
  return kv;
}

function detectionCacheKey(words: string[]): string {
  return `${DETECTION_CACHE_PREFIX}${words.join("|")}`;
}

async function getCachedDetection(
  words: string[]
): Promise<DetectedPhrase[] | null> {
  const key = detectionCacheKey(words);
  const kv = await getKV();

  if (kv) {
    try {
      const entry = await kv.get<DetectionCacheEntry>(key);
      if (entry && entry.version === DETECTION_VERSION) return entry.phrases;
    } catch (error) {
      console.error("Detection cache get error:", error);
    }
  } else {
    const entry = memoryDetectionCache.get(key);
    if (entry && entry.version === DETECTION_VERSION) return entry.phrases;
  }

  return null;
}

async function setCachedDetection(
  words: string[],
  phrases: DetectedPhrase[]
): Promise<void> {
  const key = detectionCacheKey(words);
  const entry: DetectionCacheEntry = {
    phrases,
    version: DETECTION_VERSION,
    createdAt: Date.now(),
  };

  const kv = await getKV();

  if (kv) {
    try {
      await kv.set(key, entry, { ex: 30 * 24 * 60 * 60 });
    } catch (error) {
      console.error("Detection cache set error:", error);
    }
  } else {
    memoryDetectionCache.set(key, entry);
  }
}

export async function detectPhrases(
  words: string[]
): Promise<DetectedPhrase[]> {
  if (words.length < 2) return [];

  const cached = await getCachedDetection(words);
  if (cached !== null) {
    return cached;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return [];
  }

  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5"),
      schema: PhraseDetectionSchema,
      prompt: buildPhraseDetectionPrompt(words),
      temperature: 0.3,
    });

    const validPhrases = object.phrases.filter((p) => {
      const isValid =
        p.startIndex >= 0 &&
        p.endIndex < words.length &&
        p.startIndex <= p.endIndex &&
        p.words.length === p.endIndex - p.startIndex + 1;
      return isValid;
    });

    setCachedDetection(words, validPhrases).catch(console.error);

    return validPhrases;
  } catch (error) {
    console.error("Phrase detection error:", error);
    return [];
  }
}

function buildPhraseDetectionPrompt(words: string[]): string {
  const wordList = words.map((w, i) => `${i}: "${w}"`).join("\n");

  return `Identify ONLY well-known, culturally recognized phrases. Be very strict.

## Words (with indices):
${wordList}

## ONLY detect these:

**Fixed expressions that most people would recognize**:
- Idioms: "once upon a time", "piece of cake", "break a leg"
- Common sayings: "what's up", "long time no see", "it's that time again"
- Greetings: "good morning", "thank you", "I love you"

**Proper nouns & titles**:
- Place names: "New York", "Los Angeles", "San Francisco", "Las Vegas", "Hong Kong"
- Band/artist names: "Nine Inch Nails", "Guns N' Roses", "Red Hot Chili Peppers"
- Known titles: song names, movie titles, book titles people would recognize
- Brand names, organization names

**Established compound terms** (dictionary-level):
- "ice cream", "hot dog", "real estate", "high school"
- NOT arbitrary adjective+noun combinations

## DO NOT detect:

- Grammatically connected but NOT culturally fixed: "the eternal wizard", "a beautiful sunset", "my old friend"
- Made-up or novel combinations, even if they sound nice together
- Generic adjective + noun pairs: "big house", "fast car", "dark night"
- Random word sequences that happen to be next to each other

## Key test:
Would most English speakers instantly recognize this exact phrase? If you have to think about it, it's NOT a phrase.

"once upon a time" → YES, universally known
"the eternal wizard" → NO, just adjective + noun
"break a leg" → YES, common idiom
"climb a mountain" → NO, generic verb phrase

Return ONLY phrases that pass this strict test. Empty array is fine if none qualify.`;
}
