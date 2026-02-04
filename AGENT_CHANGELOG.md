# Agent Changelog

> This file helps coding agents understand project evolution, key decisions,
> and deprecated patterns. Updated: 2026-02-03

## Current State Summary

Hapax is a gallery of rare words where each word has its own unique font and color palette. The architecture uses a masonry grid layout on the homepage with scroll-driven parallax, MDX-based word content, and a UI tinting system that shifts the entire page's color based on the active word. Production serves from static JSON (`vetted-styles.json`) with no runtime LLM calls.

## Stale Information Detected

| Location | States | Reality | Since |
|----------|--------|---------|-------|
| `src/components/gallery/search-bar.tsx` | Unused component | SearchBar is exported but not rendered anywhere | 2026-01-21 |

## Timeline

### 2026-02-03 - Plan File Cleanup

**What changed:** Removed plan files from `.claude/plans/` and repo root. Archived plans moved to `.claude/plans/archive/`.

**Agent impact:** Historical plans are in archive only. Don't reference deleted plan files.

---

### 2026-01-28 - Color Infrastructure & Presentation Overhaul (Phase 1)

**What changed:** Added color ordering infrastructure for gallery presentation improvements:
- `src/lib/color-ordering.ts` - complementary-neighbor hue algorithm
- `src/lib/batch-color-proposer.ts` - LLM-assisted color proposals (dev-only)
- `scripts/sync-styles.ts` - sync JSON to MDX frontmatter
- `scripts/lint-styles.ts` - validate style consistency
- `/dev/color-review` page for reviewing color distribution

Gallery tuning adjusted: increased gapX/gapY for typography breathing, then restored original parallax depth values for visual balance.

**Why:** Color distribution was unbalanced (purple/amber dominated at 48.8%). Infrastructure enables systematic color rebalancing.

**Agent impact:**
- Use `pnpm lint-styles` to check color distribution and JSON/MDX sync status
- Use `pnpm sync-styles` to propagate vetted-styles.json to MDX frontmatter
- Gallery ordering now uses hue-based complementary algorithm, not alphabetic
- Tuning values in `tuning-context.tsx` were partially reverted—check current values

---

### 2026-01-28 - Analytics & Deterministic Ordering

**What changed:** Added analytics tracking and deterministic gallery ordering based on word hash.

**Agent impact:** Gallery word order is now reproducible across builds—don't assume random ordering.

---

### 2026-01-27 - Typography System & Component Extraction

**What changed:** Standardized fluid typography across app, added drop caps, extracted shared components (BackButton, MdxContent, ScrollRevealSection). Domain changed from hapax.app to hapax.ink.

**Agent impact:** Use the shared components in `src/components/` rather than duplicating patterns. Typography uses CSS custom properties (`--text-fluid-*`).

---

### 2026-01-24 - Ripple Animation & Performance

**What changed:** Added middle-out ripple entrance animation to gallery. Applied Vercel React best practices.

**Agent impact:** Gallery uses `tuning-context.tsx` for all animation parameters—modify there, not in individual components.

---

### 2026-01-22 - AI Writing Pattern Removal

**What changed:** Systematically removed AI writing patterns from word definitions (removed phrases like "delves into", "rich tapestry", "it's important to note").

**Why:** Content should read as human-written, not LLM-generated.

**Agent impact:** When generating or editing word content, avoid AI writing patterns. See the humanization work in commits `68b7253`, `a59852b`, `30dbfdb`.

**Deprecated:** AI-sounding phrases in definitions.

---

### 2026-01-21 - Masonry Layout Replaces Auto-Scroll

**What changed:** Replaced the auto-scrolling marquee gallery with a static masonry grid layout. Added mouse parallax (later disabled by default) and scroll-driven parallax.

**Why:** Masonry provides better browsing UX than auto-scroll; users can scan at their own pace.

**Agent impact:** The gallery is now in `src/components/gallery/masonry/`. Animation parameters live in `tuning-context.tsx`. The SearchBar component exists but is not rendered.

**Deprecated:** Auto-scroll gallery pattern, infinite-canvas export.

---

### 2026-01-19 - Production Word Restriction & OG Images

**What changed:** Restricted production to vetted words only (no runtime LLM calls). Added OpenGraph share cards with dynamic font sizing. Added reduced motion accessibility support.

**Why:** Production stability—no external API dependencies for core functionality.

**Agent impact:** Production reads from `vetted-styles.json` only. Dev-only routes are gated with `NODE_ENV` checks.

---

### 2026-01-18 - MDX Content System & UI Tinting

**What changed:** Added MDX-based word content system replacing external Dictionary API as primary source. Implemented UI tinting where the entire page takes on the active word's color.

**Why:** Control over word definitions (human-curated), cohesive visual experience.

**Agent impact:**
- Word content lives in `src/content/words/*.mdx` with frontmatter for style
- `ActiveColorProvider` manages tinting via CSS variables (`--tint-bg`, `--tint-text`, etc.)
- Two data sources must stay in sync: `vetted-styles.json` and MDX frontmatter

---

### 2026-01-18 - Project Rename: vibetype → Hapax

**What changed:** Renamed project from "vibetype" to "Hapax". Updated all internal references.

**Agent impact:** Don't use "vibetype" anywhere. The project is "Hapax".

**Deprecated:** All "vibetype" references.

---

### 2026-01-02 - LLM Font Resolution (Dev-Only)

**What changed:** Added LLM-powered font/color resolution for styling new words.

**Agent impact:** This is dev-only tooling in `src/components/vibe-input/`. Not used in production. Production serves pre-computed styles from `vetted-styles.json`.

---

### 2026-01-01 - Initial Commit

**What changed:** Project bootstrapped with Next.js, React, Tailwind CSS.

---

## Deprecated Patterns

| Don't | Do Instead | Deprecated Since |
|-------|------------|------------------|
| Reference "vibetype" | Use "Hapax" | 2026-01-18 |
| Use auto-scroll gallery | Use masonry grid in `src/components/gallery/masonry/` | 2026-01-21 |
| Call LLM in production | Read from `vetted-styles.json` | 2026-01-19 |
| Use Dictionary API as primary | Use MDX content in `src/content/words/` | 2026-01-18 |
| Hardcode animation values | Use `tuning-context.tsx` | 2026-01-21 |
| Write AI-sounding definitions | Write natural, human prose | 2026-01-22 |
| Import SearchBar | Component exists but is unused | 2026-01-21 |
| Manually edit MDX frontmatter colors | Use `pnpm sync-styles` after updating vetted-styles.json | 2026-01-28 |

## Trajectory

The project is focused on visual polish and content quality. Recent work emphasizes:
- Color distribution rebalancing (infrastructure added, execution pending)
- Typography refinement (fluid sizing, drop caps, OpenType features)
- Animation tuning (parallax, ripple effects, spring physics)
- Content humanization (removing AI patterns from definitions)

Likely future directions: complete color rebalancing, expanded word collection, search functionality (component exists).
