# Hapax

A curated visual collection of rare words—each styled with a unique font and color palette. Think cabinet of curiosities meets typography art.

## Vision

Users browse a gallery of beautifully styled rare words. Clicking a word reveals its detail page with a thoughtfully written definition. The experience is purely visual and contemplative—no user input or generation. The collection grows over time as we add and style more words.

## Stack

- Next.js 16 (App Router) with React 19 and TypeScript
- Tailwind CSS 4 with shadcn/ui components
- Framer Motion for animations
- Vercel KV (Redis) for persistence, JSON fallback when unavailable

**Dev-only:** Vercel AI SDK with Anthropic/OpenAI/Google providers (for styling new words)

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run seed-gallery` — Populate gallery with styled words
- `npm run seed-test` — Test seeding script

## Structure

- `src/app/` — Next.js pages and API routes
- `src/components/` — React components (gallery/, ui/)
- `src/components/vibe-input/` — Dev tooling for styling new words (not user-facing)
- `src/lib/` — Core logic: font resolution, color derivation, caching
- `src/hooks/` — React hooks for font loading and input state
- `src/data/vetted-styles.json` — The curated collection of word-to-style mappings

## Data Sources

Word styling lives in two places that must stay in sync:
- `src/data/vetted-styles.json` — Gallery display, font preloading
- `src/content/words/*.mdx` frontmatter — Word detail pages

## Key Concepts

**"Vibe":** A word's visual treatment—its font pairing and color palette.

**Color System:** OkLCH color space with hue (0-360°), chroma (0-0.4), lightness (30-90). Supports light/dark modes.

**Production vs Development:**
- Production serves the curated collection from `vetted-styles.json`—no LLM calls
- Development includes tools for styling new words via Claude
- Dev-only routes gated with `NODE_ENV === "production"` check

## Patterns

- Zod schemas in `lib/schemas/hapax.ts` define all data types
- Components use "use client" for interactivity, server components for data fetching
- Multi-tier caching in dev (in-memory, vetted JSON, Vercel KV)
