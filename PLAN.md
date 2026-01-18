# Hapax: LLM-Powered Semantic Font Styling

A creative text input that uses an LLM to infer the perfect Google Font (+ color) for each word as you type, in real time.

## Vision

As you type "the wine was too strong", each word gets styled the moment you hit space. The LLM picks a font family, weight, style, and color that matches the semantic meaning of each word. "Fire" might get a bold condensed red. "Whisper" might get a light italic lavender.

The experience should feel magical and surprising—a creative toy, not a utility.

## Core Design Decisions

| Topic | Decision |
|-------|----------|
| **Vibe** | Creative toy, surprise is good |
| **Font scope** | All ~1,500 Google Fonts |
| **Caching** | Shared global cache, all users benefit from each other's lookups |
| **Word→Font** | Predictable (same word = same font, cacheable) |
| **Triggering** | On space, cache-first, LLM fallback with loading state |
| **Font attributes** | Family + weight + style + color |
| **Color** | HSL (hue + saturation from LLM, derive lightness for legibility) |
| **Dark/light mode** | Automatic—compute lightness based on mode |
| **Segmentation** | Word-level cache with phrase-level overrides |
| **Phrase handling** | LLM suggests phrases, cache them, retroactively re-style |

## User Experience Flow

```
User types: "California "
→ "California" instantly styled (word cache hit or LLM call)

User types: "Dreamin'"
→ "Dreamin'" instantly styled (word cache)
→ System checks: "California Dreamin'" a known phrase? YES
→ Both words smoothly transition to the phrase style
```

## Color & Legibility

The LLM picks the *character* of the color (hue + saturation). We derive legible lightness per mode:

```typescript
function deriveColor(intent: ColorIntent, mode: 'light' | 'dark'): string {
  const lightness = mode === 'light' ? 30 : 75
  return `hsl(${intent.hue}, ${intent.saturation}%, ${lightness}%)`
}
```

| Word | LLM picks | Light mode | Dark mode |
|------|-----------|------------|-----------|
| "fire" | hue: 15, sat: 90 | dark burnt orange | bright orange |
| "ocean" | hue: 210, sat: 80 | deep blue | sky blue |
| "whisper" | hue: 270, sat: 20 | muted purple | soft lavender |

## Caching Architecture

Two cache layers:

### Layer 1: Word Cache
- Key: normalized word (lowercase, trimmed)
- Value: FontVariant + known phrases this word participates in
- Scope: global (all users share)

### Layer 2: Phrase Cache
- Key: normalized phrase (e.g., "california dreamin'")
- Value: FontVariant for the phrase as a unit
- Triggered when: words typed match a known phrase pattern

### Cache Flow

```
┌─────────────────────────────────────────────────────┐
│ User types "California " (space detected)           │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 1. Check word cache for "california"                │
│    → HIT: apply variant immediately                 │
│    → Also get: knownPhrases: ["california dreamin'"]│
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 2. Register phrase listener for "dreamin'"          │
│    (if next word matches, trigger phrase lookup)    │
└─────────────────────────────────────────────────────┘
                         │
        User types "Dreamin'"
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 3. Check word cache for "dreamin'"                  │
│    → HIT: apply variant immediately                 │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 4. Check phrase listeners: "dreamin'" completes     │
│    "california dreamin'" → fetch phrase cache       │
│    → HIT: re-style both words with phrase variant   │
└─────────────────────────────────────────────────────┘
```

## Zod Schemas

### Primitives

```typescript
import { z } from 'zod'

const FontWeight = z.union([
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

const FontStyle = z.enum(['normal', 'italic'])

const ColorIntent = z.object({
  hue: z.number().min(0).max(360),
  saturation: z.number().min(0).max(100),
})

const FontVariant = z.object({
  family: z.string().min(1),
  weight: FontWeight.default(400),
  style: FontStyle.default('normal'),
  colorIntent: ColorIntent,
})
```

### Cache Entries

```typescript
const WordCacheEntry = z.object({
  wordNormalized: z.string(),
  variant: FontVariant,
  knownPhrases: z.array(z.string()).default([]),
  schemaVersion: z.number(),
  modelVersion: z.string(),
  createdAt: z.number(),
  hitCount: z.number().default(0),
  lastAccessedAt: z.number(),
})

const PhraseCacheEntry = z.object({
  phraseNormalized: z.string(),
  words: z.array(z.string()),
  variant: FontVariant,
  schemaVersion: z.number(),
  modelVersion: z.string(),
  createdAt: z.number(),
})
```

### LLM Interface

```typescript
const LLMWordRequest = z.object({
  word: z.string(),
  schemaVersion: z.literal(1),
  context: z.object({
    position: z.number().optional(),
    totalWords: z.number().optional(),
  }).optional(),
})

const LLMWordResponse = z.object({
  variant: FontVariant,
  confidence: z.number().min(0).max(1),
  phraseSuggestions: z.array(z.object({
    phrase: z.string(),
    triggerWords: z.array(z.string()),
  })).optional(),
})

// Batch variant for efficiency
const LLMBatchRequest = z.object({
  words: z.array(z.string()).min(1).max(20),
  schemaVersion: z.literal(1),
})

const LLMBatchResponse = z.object({
  mappings: z.array(z.object({
    word: z.string(),
    variant: FontVariant,
    confidence: z.number().min(0).max(1),
    phraseSuggestions: z.array(z.object({
      phrase: z.string(),
      triggerWords: z.array(z.string()),
    })).optional(),
  })),
})
```

### UI State

```typescript
const WordToken = z.object({
  id: z.string(),
  raw: z.string(),
  normalized: z.string(),
  position: z.number(),
})

const WordResolution = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  z.object({ status: z.literal('loading'), requestId: z.string() }),
  z.object({
    status: z.literal('resolved'),
    variant: FontVariant,
    source: z.enum(['cache', 'llm']),
  }),
  z.object({
    status: z.literal('error'),
    message: z.string(),
  }),
])

const WordState = z.object({
  token: WordToken,
  resolution: WordResolution,
  fontLoaded: z.boolean(),
  phraseGroupId: z.string().nullable(),
})

const InputState = z.object({
  rawText: z.string(),
  words: z.array(WordState),
  cursor: z.number().optional(),
})
```

### Font Loading State

```typescript
const FontLoadState = z.object({
  variant: FontVariant,
  loadedChars: z.string(),
  pendingChars: z.string(),
  status: z.enum(['idle', 'loading', 'ready', 'error']),
  errorMessage: z.string().optional(),
})
```

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **UI**: React 19, Tailwind CSS 4, shadcn/ui
- **Validation**: Zod
- **Cache**: Server-side (Vercel KV, Redis, or similar) for shared global cache
- **Fonts**: Google Fonts API with dynamic subsetting (`text=` parameter)

## Open Questions

1. **LLM choice**: Which model? OpenAI, Anthropic, or open-source?
2. **Rate limiting**: How to handle abuse of the shared cache?
3. **Font metadata**: Pre-fetch Google Fonts catalog for validation, or trust LLM output?
4. **Animations**: How should the font transition look when phrase override kicks in?

## Next Steps

1. Set up Zod schemas in `src/lib/schemas/`
2. Build the word tokenization + state management
3. Implement word cache (start with in-memory, then add persistence)
4. Build the Google Fonts loading layer
5. Integrate LLM for word→font mapping
6. Add phrase detection + cache
7. Polish the UI transitions
