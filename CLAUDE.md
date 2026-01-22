# Hapax

A gallery of rare words. Each word has its own font and color palette.

## What it does

Users browse words in a gallery. Clicking a word shows its definition page. No user input or generation. The collection grows as we add more words.

## Stack

- Next.js 16 (App Router) with React 19 and TypeScript
- Tailwind CSS 4 with shadcn/ui components
- Motion for animations
- Vercel KV (Redis) for persistence, JSON fallback when unavailable

**Dev-only:** Vercel AI SDK with Anthropic/OpenAI/Google providers (for styling new words)

## Commands

- `pnpm dev` - Start development server
- `pnpm build` - Production build
- `pnpm lint` - ESLint check
- `pnpm seed-gallery` - Populate gallery with styled words
- `pnpm seed-test` - Test seeding script

## Structure

- `src/app/` - Next.js pages and API routes
- `src/components/` - React components (gallery/, ui/)
- `src/components/vibe-input/` - Dev tooling for styling new words (not user-facing)
- `src/lib/` - Font resolution, color derivation, caching
- `src/hooks/` - React hooks for font loading and input state
- `src/data/vetted-styles.json` - Word-to-style mappings

## Data sources

Word styling lives in two places that must stay in sync:
- `src/data/vetted-styles.json` - Gallery display, font preloading
- `src/content/words/*.mdx` frontmatter - Word detail pages

## Key concepts

**Vibe:** A word's visual treatment (font + color palette).

**Color system:** OkLCH color space with hue (0-360°), chroma (0-0.4), lightness (30-90). Supports light/dark modes.

**Production vs development:**
- Production serves from `vetted-styles.json`. No LLM calls.
- Development includes tools for styling new words via Claude.
- Dev-only routes gated with `NODE_ENV === "production"` check.

## Patterns

- Zod schemas in `lib/schemas/hapax.ts` define all data types
- Components use "use client" for interactivity, server components for data fetching
- Caching in dev: in-memory, vetted JSON, Vercel KV
