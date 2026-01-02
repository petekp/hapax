import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod/v4"

const PhraseDetectionSchema = z.object({
  phrases: z
    .array(
      z.object({
        words: z
          .array(z.string())
          .describe("The exact words that form this phrase, in order"),
        startIndex: z.number().describe("Index of first word in the phrase"),
        endIndex: z.number().describe("Index of last word in the phrase (inclusive)"),
        reason: z.string().describe("Brief explanation of why this is a meaningful phrase"),
      })
    )
    .describe("Detected phrases that should be styled as a unit"),
})

export interface DetectedPhrase {
  words: string[]
  startIndex: number
  endIndex: number
  reason: string
}

const DETECTION_CACHE_PREFIX = "vibe:detection:"

interface DetectionCacheEntry {
  phrases: DetectedPhrase[]
  createdAt: number
}

const memoryDetectionCache = new Map<string, DetectionCacheEntry>()

function hasVercelKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

async function getKV() {
  if (!hasVercelKV()) {
    return null
  }
  const { kv } = await import("@vercel/kv")
  return kv
}

function detectionCacheKey(words: string[]): string {
  return `${DETECTION_CACHE_PREFIX}${words.join("|")}`
}

async function getCachedDetection(words: string[]): Promise<DetectedPhrase[] | null> {
  const key = detectionCacheKey(words)
  const kv = await getKV()

  if (kv) {
    try {
      const entry = await kv.get<DetectionCacheEntry>(key)
      if (entry) return entry.phrases
    } catch (error) {
      console.error("Detection cache get error:", error)
    }
  } else {
    const entry = memoryDetectionCache.get(key)
    if (entry) return entry.phrases
  }

  return null
}

async function setCachedDetection(words: string[], phrases: DetectedPhrase[]): Promise<void> {
  const key = detectionCacheKey(words)
  const entry: DetectionCacheEntry = {
    phrases,
    createdAt: Date.now(),
  }

  const kv = await getKV()

  if (kv) {
    try {
      await kv.set(key, entry, { ex: 30 * 24 * 60 * 60 })
    } catch (error) {
      console.error("Detection cache set error:", error)
    }
  } else {
    memoryDetectionCache.set(key, entry)
  }
}

const KNOWN_PHRASES: { words: string[]; reason: string }[] = [
  { words: ["california", "dreaming"], reason: "Famous song by The Mamas & the Papas" },
  { words: ["bohemian", "rhapsody"], reason: "Iconic Queen song" },
  { words: ["stairway", "to", "heaven"], reason: "Led Zeppelin classic" },
  { words: ["hotel", "california"], reason: "Eagles song" },
  { words: ["new", "york"], reason: "Major city name" },
  { words: ["los", "angeles"], reason: "Major city name" },
  { words: ["san", "francisco"], reason: "Major city name" },
  { words: ["star", "wars"], reason: "Iconic film franchise" },
  { words: ["lord", "of", "the", "rings"], reason: "Epic fantasy franchise" },
  { words: ["game", "of", "thrones"], reason: "TV series" },
  { words: ["harry", "potter"], reason: "Book/film franchise" },
  { words: ["artificial", "intelligence"], reason: "Technology concept" },
  { words: ["climate", "change"], reason: "Environmental concept" },
  { words: ["social", "media"], reason: "Technology concept" },
  { words: ["carpe", "diem"], reason: "Latin phrase meaning seize the day" },
  { words: ["hakuna", "matata"], reason: "Swahili phrase from The Lion King" },
  { words: ["once", "upon", "a", "time"], reason: "Classic story opening" },
  { words: ["happily", "ever", "after"], reason: "Classic story ending" },
  { words: ["breaking", "bad"], reason: "TV series" },
  { words: ["stranger", "things"], reason: "TV series" },
]

function findKnownPhrases(words: string[]): DetectedPhrase[] {
  const results: DetectedPhrase[] = []
  const normalizedWords = words.map((w) => w.toLowerCase())

  for (const known of KNOWN_PHRASES) {
    const phraseLen = known.words.length
    for (let i = 0; i <= normalizedWords.length - phraseLen; i++) {
      const slice = normalizedWords.slice(i, i + phraseLen)
      if (slice.every((w, j) => w === known.words[j])) {
        results.push({
          words: words.slice(i, i + phraseLen),
          startIndex: i,
          endIndex: i + phraseLen - 1,
          reason: known.reason,
        })
      }
    }
  }

  return results
}

export async function detectPhrases(words: string[]): Promise<DetectedPhrase[]> {
  if (words.length < 2) return []

  const knownPhrases = findKnownPhrases(words)
  if (knownPhrases.length > 0) {
    return knownPhrases
  }

  const cached = await getCachedDetection(words)
  if (cached !== null) {
    return cached
  }

  if (!process.env.OPENAI_API_KEY) {
    return []
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: PhraseDetectionSchema,
      prompt: buildPhraseDetectionPrompt(words),
      temperature: 0.3,
    })

    const validPhrases = object.phrases.filter((p) => {
      const isValid =
        p.startIndex >= 0 &&
        p.endIndex < words.length &&
        p.startIndex <= p.endIndex &&
        p.words.length === p.endIndex - p.startIndex + 1
      return isValid
    })

    setCachedDetection(words, validPhrases).catch(console.error)

    return validPhrases
  } catch (error) {
    console.error("Phrase detection error:", error)
    return []
  }
}

function buildPhraseDetectionPrompt(words: string[]): string {
  const wordList = words.map((w, i) => `${i}: "${w}"`).join("\n")

  return `You are analyzing a sequence of words to detect meaningful multi-word phrases that should be styled as a visual unit.

## Words (with indices):
${wordList}

## What counts as a phrase:
- Song titles: "california dreaming", "bohemian rhapsody", "stairway to heaven"
- Movie/book titles: "star wars", "lord of the rings", "breakfast at tiffanys"
- Idioms: "raining cats and dogs", "piece of cake", "break a leg"
- Famous quotes or expressions: "to be or not to be", "et tu brute"
- Compound concepts: "artificial intelligence", "climate change", "social media"
- Names: "new york", "los angeles", "mount everest"
- Cultural references: "carpe diem", "hakuna matata", "yolo"

## What is NOT a phrase:
- Generic word pairs: "the cat", "is running", "very big"
- Articles + nouns: "a house", "the dog"
- Common preposition phrases: "in the", "on top"

Only return phrases where styling them as a unified visual unit would enhance meaning. Be selective - most word sequences are NOT phrases.

Return an empty array if no meaningful phrases are detected.`
}
