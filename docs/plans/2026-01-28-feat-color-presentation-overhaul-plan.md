---
title: "feat: Color & Presentation Overhaul"
type: feat
date: 2026-01-28
---

# Color & Presentation Overhaul

## Overview

A comprehensive visual refresh of the Hapax gallery addressing color harmony, semantic fit, spatial composition, and typographic breathing. The target aesthetic is **celestial and mysterious**—deep, luminous, otherworldly.

## Problem Statement

The current gallery has several visual issues:

1. **Hue imbalance**: 48% of words concentrated in purple (270-299°) and amber (30-59°)
2. **Semantic mismatch**: Some word colors don't reflect their meaning
3. **No visual rhythm**: Colors feel randomly assigned; no sense of curated composition
4. **Lacks cohesion**: Collection doesn't feel harmonious as a whole

## Proposed Solution

### Phase 1: Color Restyling Infrastructure

Build tooling to propose and curate new colors for all 205 words.

**1.1 Create semantic color proposal system**

Extend the existing LLM resolver to batch-propose colors with semantic rationale.

```typescript
// src/lib/batch-color-proposer.ts

interface ColorProposal {
  word: string
  currentIntent: ColorIntent
  proposedIntent: ColorIntent
  semanticRationale: string  // Why this color fits the meaning
  hueCategory: string        // "celestial-blue" | "deep-violet" | etc.
}

export async function proposeColors(
  words: string[],
  constraints: {
    chromaCeiling: number      // 0.22 default
    hueTargets: HueTarget[]    // Distribution goals
    aesthetic: "celestial"     // Palette constraint
  }
): Promise<ColorProposal[]>
```

**1.2 Create curation review interface**

Add a dev-only page to review proposals side-by-side.

```
/dev/color-review (dev-only)
├── Shows current vs proposed color
├── Displays semantic rationale
├── Approve / Reject / Edit controls
├── Hue distribution visualization
└── Batch approve/reject by category
```

**1.3 Create sync script**

Automate synchronization between `vetted-styles.json` and MDX frontmatter.

```typescript
// scripts/sync-styles.ts

// Reads vetted-styles.json as source of truth
// Updates all MDX frontmatter to match
// Reports any inconsistencies
// Can run as pre-commit validation
```

### Phase 2: Color Redistribution

Restyle all 205 words following these constraints:

**Hue distribution targets:**

| Hue Range | Current | Target | Color Family |
|-----------|---------|--------|--------------|
| 0-29° (red/orange) | 14 (7%) | 12-15 (6-7%) | Warm accents |
| 30-59° (amber/gold) | 50 (24%) | 20-25 (10-12%) | Reduce significantly |
| 60-89° (yellow-green) | 7 (3%) | 10-15 (5-7%) | Nature tones |
| 90-119° (green) | 5 (2%) | 10-15 (5-7%) | Growth/nature |
| 120-149° (green-teal) | 9 (4%) | 15-20 (7-10%) | Forest/moss |
| 150-179° (cyan-green) | 6 (3%) | 15-20 (7-10%) | Teal expansion |
| 180-209° (cyan/teal) | 4 (2%) | 20-25 (10-12%) | Celestial core |
| 210-239° (blue) | 22 (11%) | 25-30 (12-15%) | Sky/night |
| 240-269° (indigo) | 18 (9%) | 20-25 (10-12%) | Deep night |
| 270-299° (violet/purple) | 50 (24%) | 25-30 (12-15%) | Reduce significantly |
| 300-329° (magenta/rose) | 10 (5%) | 15-20 (7-10%) | Twilight |
| 330-359° (pink/red) | 10 (5%) | 10-15 (5-7%) | Rare warmth |

**Chroma guidelines:**
- Default ceiling: 0.18-0.22 for cohesion
- Semantic exceptions: Words with inherent luminosity (phosphorescent, vermillion, effulgent) may exceed to ~0.28-0.32
- Document each exception in styling-guide.md

**Lightness approach:**
- Bias toward 45-65% for readability
- Dark words (eigengrau, tenebrous) can go to 32-40%
- Light words (alabaster, gossamer) can go to 75-88%

### Phase 3: Gallery Ordering Algorithm

Replace current interleaved-alphabetic ordering with complementary-neighbor ordering.

**Algorithm: Complementary Neighbors**

Adjacent words should have contrasting hues (opposite sides of color wheel) for visual pop while maintaining overall harmony.

```typescript
// src/lib/color-ordering.ts

export function orderByComplementaryHues(words: GalleryWordEntry[]): GalleryWordEntry[] {
  // 1. Sort all words by hue
  const byHue = [...words].sort((a, b) =>
    a.variant.colorIntent.hue - b.variant.colorIntent.hue
  )

  // 2. Split into two halves (0-180° and 180-360°)
  const coolHalf = byHue.filter(w => w.variant.colorIntent.hue < 180)
  const warmHalf = byHue.filter(w => w.variant.colorIntent.hue >= 180)

  // 3. Interleave: cool, warm, cool, warm...
  // Each pair creates contrast; overall creates rhythm
  const result: GalleryWordEntry[] = []
  const maxLen = Math.max(coolHalf.length, warmHalf.length)

  for (let i = 0; i < maxLen; i++) {
    if (coolHalf[i]) result.push(coolHalf[i])
    if (warmHalf[i]) result.push(warmHalf[i])
  }

  return result
}
```

**Update masonry-gallery.tsx:**

```typescript
// Replace shuffledWords memo

const orderedWords = useMemo(() => {
  if (words.length === 0) return []
  return orderByComplementaryHues(words)
}, [words])
```

### Phase 4: Typography Breathing

Refine spacing and rhythm for more intentional composition.

**Tuning adjustments:**

```typescript
// src/components/gallery/masonry/tuning-context.tsx

export const tuningDefaults: TuningValues = {
  // Layout - increase breathing room
  gapX: 40,      // was 32 - more horizontal space
  gapY: 24,      // was 16 - more vertical rhythm
  paddingX: 48,  // was 32 - edge breathing
  paddingY: 144, // was 128 - top/bottom clearance

  // Depth opacity - increase contrast
  depthOpacityNear: 0.4,  // was 0.3 - near words slightly more visible
  depthOpacityFar: 1,     // unchanged

  // ... rest unchanged
}
```

**Font size distribution analysis:**

Current system uses seeded random for deterministic but arbitrary sizes. Consider whether word length or semantic weight should influence size. For now, keep existing system—it's neutral and works.

### Phase 5: Data Synchronization

Ensure all 205 words have consistent styles across data sources.

**Sync workflow:**

1. Make all color changes in `vetted-styles.json` (source of truth)
2. Run `pnpm sync-styles` to propagate to MDX frontmatter
3. Run `pnpm build` which triggers `build-words-index.ts`
4. Verify with `pnpm lint-styles` (new script)

**scripts/sync-styles.ts:**

```typescript
// Read vetted-styles.json
// For each word:
//   - Find corresponding MDX file
//   - Parse frontmatter
//   - Compare style fields
//   - Update if different
//   - Report changes
// Summary: X files updated, Y already in sync, Z missing MDX
```

**scripts/lint-styles.ts:**

```typescript
// Validation checks:
// - All words in JSON have MDX files
// - All MDX files have valid style frontmatter
// - JSON and MDX styles match exactly
// - Hue distribution within targets
// - Chroma within guidelines (flag exceptions)
// Exit non-zero if issues found
```

## Technical Approach

### Files to Create

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/batch-color-proposer.ts` | LLM-assisted color proposals | ✅ Created |
| `src/lib/color-ordering.ts` | Complementary-neighbor ordering algorithm | ✅ Created |
| `src/app/dev/color-review/page.tsx` | Dev-only curation interface | ✅ Created |
| `scripts/sync-styles.ts` | JSON → MDX synchronization | ✅ Created |
| `scripts/lint-styles.ts` | Style consistency validation | ✅ Created |

### Files to Modify

| File | Changes | Status |
|------|---------|--------|
| `src/data/vetted-styles.json` | Update all 205 word colors | ⏳ Phase 2 |
| `src/content/words/*.mdx` (205 files) | Sync frontmatter via script | ⏳ Phase 2 |
| `src/components/gallery/masonry/masonry-gallery.tsx` | Replace ordering algorithm | ✅ Done |
| `src/components/gallery/masonry/tuning-context.tsx` | Adjust gap/padding values | ✅ Done |
| `.claude/docs/styling-guide.md` | Document new color rules | ⏳ Phase 2 |

### Implementation Order

```
Phase 1: Infrastructure (scripts, review UI)
    |
    v
Phase 2: Color restyling (LLM propose → curate → approve)
    |
    v
Phase 3: Gallery ordering (complementary algorithm)
    |
    v
Phase 4: Typography (tuning adjustments)
    |
    v
Phase 5: Sync & validate (run scripts, verify)
    |
    v
Deploy (big-bang rollout)
```

## Acceptance Criteria

### Functional Requirements

- [ ] All 205 words have semantically-appropriate colors
- [ ] Hue distribution matches targets (no range > 15% of total)
- [ ] Gallery displays words in complementary-neighbor order
- [ ] Typography has improved breathing (visible spacing increase)
- [ ] `vetted-styles.json` and MDX frontmatter are in sync
- [ ] Sync script runs without errors
- [ ] Lint script passes all validations

### Non-Functional Requirements

- [ ] Gallery load time unchanged (no performance regression)
- [ ] Colors maintain WCAG AA contrast ratio (4.5:1) on dark background
- [ ] Ordering is deterministic (same on every load)
- [ ] Dev tooling is gated to `NODE_ENV !== "production"`

### Quality Gates

- [ ] Hue distribution analysis shows targets met
- [ ] Visual review of full gallery scroll
- [ ] Spot-check 20 words for semantic fit
- [ ] Build passes with no TypeScript errors
- [ ] Lint-styles script exits 0

## Success Metrics

- **Hue balance**: No single 30° range exceeds 15% of words
- **Semantic coherence**: Random sample of 20 words pass "does this color match the meaning?" review
- **Visual harmony**: Gallery scroll creates pleasing color rhythm (subjective but reviewable)
- **Data integrity**: Zero mismatches between JSON and MDX

## Dependencies & Prerequisites

- Existing LLM resolver infrastructure (`src/lib/llm-resolver.ts`)
- Anthropic API key for color proposals
- All 205 MDX files exist with valid frontmatter
- Dev environment running (`pnpm dev`)

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM proposals don't match aesthetic | Medium | High | Human curation pass; clear prompt constraints |
| Sync script corrupts MDX files | Low | High | Git backup; dry-run mode; validation step |
| Ordering algorithm creates jarring patterns | Medium | Medium | Test on various viewports; easy to adjust |
| Big-bang rollout introduces bugs | Low | High | Preview in dev; comprehensive lint checks |

## Open Questions (Resolved)

- ~~LLM-assisted restyling vs manual?~~ → LLM-assisted with curation
- ~~Gallery ordering approach?~~ → Complementary neighbors (contrasting hues)
- ~~Glow effects?~~ → No, rely on color alone
- ~~Rollout strategy?~~ → Big-bang
- ~~High-chroma words?~~ → Keep semantic exceptions

## References

### Internal References

- Brainstorm: `docs/brainstorms/2026-01-28-color-presentation-overhaul-brainstorm.md`
- Styling guide: `.claude/docs/styling-guide.md`
- Color derivation: `src/lib/color.ts`
- Gallery layout: `src/components/gallery/masonry/masonry-gallery.tsx`
- Tuning system: `src/components/gallery/masonry/tuning-context.tsx`

### Schema Definitions

- ColorIntent: `src/lib/schemas/hapax.ts:ColorIntent`
- FontVariant: `src/lib/schemas/hapax.ts:FontVariant`
