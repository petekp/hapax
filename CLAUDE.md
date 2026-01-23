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
- `pnpm seed-gallery` - Populate gallery with styled words

## Structure

- `src/app/` - Pages and API routes
- `src/components/gallery/` - Gallery display components
- `src/components/vibe-input/` - Dev tooling (not user-facing)
- `src/lib/` - Font resolution, color derivation, caching
- `src/data/vetted-styles.json` - Word-to-style mappings

## Key Concepts

**Vibe:** A word's visual treatment (font + color palette). See `.claude/docs/styling-guide.md`.

**Color system:** OkLCH color space with hue (0-360°), chroma (0-0.4), lightness (30-90).

**Data sources must stay in sync:**
- `src/data/vetted-styles.json` - Gallery display, font preloading
- `src/content/words/*.mdx` frontmatter - Word detail pages

## Patterns

- Zod schemas define data types: `src/lib/schemas/hapax.ts`
- Production serves from `vetted-styles.json` only (no LLM calls)
- Dev-only routes gated with `NODE_ENV === "production"` check
