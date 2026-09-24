# Hapax

A gallery of rare words where each word has its own font and color palette.

## Stack

- Next.js 16 (App Router) with React 19 and TypeScript
- Tailwind CSS 4 with shadcn/ui components
- Motion for animations
- Vercel KV (Redis) for persistence, JSON fallback when unavailable
- **Dev-only:** Vercel AI SDK for styling new words

## Commands

- `pnpm dev` - Development server
- `pnpm build` - Production build
- `pnpm lint` - ESLint check
- `pnpm lint-styles` - Check color distribution and JSON/MDX sync
- `pnpm sync-styles` - Sync `vetted-styles.json` → MDX frontmatter
- `pnpm font-designers` - Refresh typeface designer credits (`src/data/font-designers.json`)

## Structure

- `src/app/` - Pages and API routes
- `src/components/gallery/` - Gallery display components
- `src/components/vibe-input/` - Dev tooling (not user-facing)
- `src/lib/` - Font resolution, color derivation, caching
- `src/content/words/` - MDX word content (definitions, frontmatter)
- `src/data/vetted-styles.json` - Word-to-style mappings (source of truth)
- `src/components/gallery/masonry/tuning-context.tsx` - Animation parameters
- `src/components/performances/` - Words that act out their meaning (registry + per-word components)

## Key Concepts

**Vibe:** A word's visual treatment (font + color palette). See `.claude/docs/styling-guide.md`.

**Color system:** OkLCH color space with hue (0-360°), chroma (0-0.4), lightness (30-90).

**Ink:** Word colors render through `deriveInkVariables` + the `.ink` class, which gamut-map the intent separately for sRGB and P3 screens. Don't set a word's `color` from a raw `oklch()` string: browsers clip out-of-gamut colors and shift the hue.

**Performance:** A word can act out its meaning with a `Title` (how the word itself moves) and an optional `Atmosphere` (the page's weather). Register it in `src/components/performances/index.ts`. Reduced motion must show a still, finished state.

## Patterns

- Zod schemas define data types: `src/lib/schemas/hapax.ts`
- Production serves from `vetted-styles.json` only (no LLM calls)
- Dev-only routes gated with `NODE_ENV === "production"` check
- Edit `vetted-styles.json`, then run `pnpm sync-styles` to update MDX
