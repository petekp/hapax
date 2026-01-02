import { z } from "zod/v4"

// ============================================
// PRIMITIVES
// ============================================

export const FontWeight = z.union([
  z.literal(100),
  z.literal(200),
  z.literal(300),
  z.literal(400),
  z.literal(500),
  z.literal(600),
  z.literal(700),
  z.literal(800),
  z.literal(900),
])
export type FontWeight = z.infer<typeof FontWeight>

export const FontStyle = z.enum(["normal", "italic"])
export type FontStyle = z.infer<typeof FontStyle>

export const ColorIntent = z.object({
  hue: z.number().min(0).max(360),
  saturation: z.number().min(0).max(100),
})
export type ColorIntent = z.infer<typeof ColorIntent>

export const FontVariant = z.object({
  family: z.string().min(1),
  weight: FontWeight.default(400),
  style: FontStyle.default("normal"),
  colorIntent: ColorIntent,
})
export type FontVariant = z.infer<typeof FontVariant>

// ============================================
// CACHE ENTRIES
// ============================================

export const WordCacheEntry = z.object({
  wordNormalized: z.string(),
  variant: FontVariant,
  knownPhrases: z.array(z.string()).default([]),
  schemaVersion: z.number(),
  modelVersion: z.string(),
  createdAt: z.number(),
  hitCount: z.number().default(0),
  lastAccessedAt: z.number(),
})
export type WordCacheEntry = z.infer<typeof WordCacheEntry>

export const PhraseCacheEntry = z.object({
  phraseNormalized: z.string(),
  words: z.array(z.string()),
  variant: FontVariant,
  schemaVersion: z.number(),
  modelVersion: z.string(),
  createdAt: z.number(),
})
export type PhraseCacheEntry = z.infer<typeof PhraseCacheEntry>

// ============================================
// LLM INTERFACE
// ============================================

export const LLMWordRequest = z.object({
  word: z.string(),
  schemaVersion: z.literal(1),
  context: z
    .object({
      position: z.number().optional(),
      totalWords: z.number().optional(),
    })
    .optional(),
})
export type LLMWordRequest = z.infer<typeof LLMWordRequest>

export const PhraseSuggestion = z.object({
  phrase: z.string(),
  triggerWords: z.array(z.string()),
})
export type PhraseSuggestion = z.infer<typeof PhraseSuggestion>

export const LLMWordResponse = z.object({
  variant: FontVariant,
  confidence: z.number().min(0).max(1),
  phraseSuggestions: z.array(PhraseSuggestion).optional(),
})
export type LLMWordResponse = z.infer<typeof LLMWordResponse>

export const LLMBatchRequest = z.object({
  words: z.array(z.string()).min(1).max(20),
  schemaVersion: z.literal(1),
})
export type LLMBatchRequest = z.infer<typeof LLMBatchRequest>

export const LLMBatchResponseItem = z.object({
  word: z.string(),
  variant: FontVariant,
  confidence: z.number().min(0).max(1),
  phraseSuggestions: z.array(PhraseSuggestion).optional(),
})
export type LLMBatchResponseItem = z.infer<typeof LLMBatchResponseItem>

export const LLMBatchResponse = z.object({
  mappings: z.array(LLMBatchResponseItem),
})
export type LLMBatchResponse = z.infer<typeof LLMBatchResponse>

// ============================================
// UI STATE
// ============================================

export const WordToken = z.object({
  id: z.string(),
  raw: z.string(),
  normalized: z.string(),
  position: z.number(),
})
export type WordToken = z.infer<typeof WordToken>

export const WordResolutionPending = z.object({
  status: z.literal("pending"),
})

export const WordResolutionLoading = z.object({
  status: z.literal("loading"),
  requestId: z.string(),
})

export const WordResolutionResolved = z.object({
  status: z.literal("resolved"),
  variant: FontVariant,
  source: z.enum(["cache", "llm"]),
})

export const WordResolutionError = z.object({
  status: z.literal("error"),
  message: z.string(),
})

export const WordResolution = z.discriminatedUnion("status", [
  WordResolutionPending,
  WordResolutionLoading,
  WordResolutionResolved,
  WordResolutionError,
])
export type WordResolution = z.infer<typeof WordResolution>

export const WordState = z.object({
  token: WordToken,
  resolution: WordResolution,
  fontLoaded: z.boolean(),
  phraseGroupId: z.string().nullable(),
})
export type WordState = z.infer<typeof WordState>

export const InputState = z.object({
  rawText: z.string(),
  words: z.array(WordState),
})
export type InputState = z.infer<typeof InputState>

// ============================================
// FONT LOADING STATE
// ============================================

export const FontLoadState = z.object({
  variant: FontVariant,
  loadedChars: z.string(),
  pendingChars: z.string(),
  status: z.enum(["idle", "loading", "ready", "error"]),
  errorMessage: z.string().optional(),
})
export type FontLoadState = z.infer<typeof FontLoadState>
