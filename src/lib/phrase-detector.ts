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
const DETECTION_VERSION = "claude-haiku-v8-principled";

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
    if (cached.length > 0) {
      console.log(`[detect] Cache HIT: found ${cached.length} phrase(s) in "${words.join(" ")}"`)
      cached.forEach(p => console.log(`[detect]   → "${p.words.join(" ")}" (${p.reason})`))
    }
    return cached;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return [];
  }

  console.log(`[detect] Analyzing: "${words.join(" ")}"`)

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

    if (validPhrases.length > 0) {
      console.log(`[detect] Found ${validPhrases.length} phrase(s):`)
      validPhrases.forEach(p => console.log(`[detect]   → "${p.words.join(" ")}" (${p.reason})`))
    } else {
      console.log(`[detect] No phrases found in "${words.join(" ")}"`)
    }

    setCachedDetection(words, validPhrases).catch(console.error);

    return validPhrases;
  } catch (error) {
    console.error("[detect] Error:", error);
    return [];
  }
}

function buildPhraseDetectionPrompt(words: string[]): string {
  const wordList = words.map((w, i) => `${i}: "${w}"`).join("\n");

  return `Identify multi-word units that function as a single concept in the cultural consciousness.

## Words (with indices):
${wordList}

## The Core Principle

Detect word sequences where:
1. **The whole is a recognized entity** - not just words that happen to be adjacent
2. **People would say "that's a thing"** - it has its own identity, Wikipedia article, or cultural presence
3. **Breaking it apart loses the meaning** - "New" and "York" separately don't convey "New York"

This includes:
- **Named entities**: people, places, organizations, events, products, titles, teams
- **Fixed expressions**: idioms, sayings, greetings that are said exactly this way
- **Established terms**: compound concepts that have become single units ("ice cream", "black hole")

## The Key Test

Ask: "Is this a THING that EXISTS as a unit, or just a grammatical phrase?"

✓ "George Washington" → a specific person
✓ "World War II" → a specific event
✓ "ice cream" → a specific thing
✓ "break a leg" → a fixed idiom
✓ "artificial intelligence" → an established field
✓ "New York Yankees" → a specific team

✗ "the old man" → just article + adjective + noun
✗ "beautiful sunset" → just adjective + noun
✗ "running quickly" → just verb + adverb
✗ "very important" → just intensifier + adjective

## Important

- Capitalization is a hint but not definitive
- Be generous with named entities - if consecutive capitalized words could be a name, they probably are
- Empty array is fine if nothing qualifies
- When in doubt about a proper noun, include it`;
}
