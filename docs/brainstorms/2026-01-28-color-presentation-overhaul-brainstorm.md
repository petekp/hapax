---
date: 2026-01-28
topic: color-presentation-overhaul
---

# Color & Presentation Overhaul

## What We're Building

A comprehensive visual refresh of the Hapax gallery, addressing four interconnected concerns:

1. **Color harmony** — Redistribute the hue spectrum to eliminate purple/amber dominance (currently 48% of words) while maintaining a celestial/mysterious aesthetic
2. **Semantic fit** — Every word's color should directly reflect its meaning (eigengrau → deep gray, welkin → ethereal blue, carbuncle → ruby glow)
3. **Spatial composition** — Gallery arrangement that creates visual rhythm and prevents adjacent color clashes
4. **Typographic breathing** — More intentional spacing, size relationships, and visual weight distribution

The target aesthetic is **celestial and mysterious**: deep, luminous, otherworldly—like nighttime, stars, bioluminescence. Colors should glow against dark backgrounds with restrained saturation.

## Why This Approach

We chose **Semantic + Spatial Harmony** (Approach C) because:

- Semantic color assignment gives each word intentional meaning
- Spatial awareness prevents the gallery from feeling randomly assembled
- Combines the depth of per-word curation with gallery-level composition
- Addresses both the color problem and the "typographic breathing" priority

Rejected alternatives:
- **Pure semantic palette** — addresses meaning but not spatial harmony
- **Astronomic gradient** — too formulaic, loses per-word semantic depth

## Key Decisions

1. **Celestial aesthetic constraint**: All colors should feel at home in a "night sky" palette. Warm tones (gold, amber) appear as rare accents, not as 24% of the collection.

2. **Strong semantic links**: Color choices should be defensible from word meaning. Document the rationale for each in the styling guide.

3. **Chroma restraint**: Default chroma ceiling of 0.18-0.22 for cohesion. Higher saturation reserved for words with inherent luminosity (phosphorescent, noctilucent).

4. **Hue redistribution targets**:
   - Reduce 270-299° (purple) from 50 words to ~25-30
   - Reduce 30-59° (amber) from 50 words to ~20-25
   - Increase 150-209° (cyan/teal) from 10 words to ~25-30
   - Increase 90-149° (green) from 14 words to ~20-25

5. **Spatial harmony mechanism**: Introduce gallery ordering or spacing logic that considers hue relationships between adjacent words.

6. **Typographic breathing**: Refine the current random size distribution to create more intentional rhythm—perhaps based on word length, semantic weight, or position in layout.

## Open Questions

- **LLM-assisted restyling**: Should we use the existing AI pipeline (dev-only) to propose new colors with semantic rationale, then manually curate? Or is this purely manual work?

- **Gallery ordering algorithm**: The current interleaved-alphabetic approach was chosen for determinism. How do we balance color harmony with predictable ordering?

- **MDX sync**: Restyling 205 words means updating both `vetted-styles.json` and each word's MDX frontmatter. What's the most efficient workflow?

- **Atmospheric enhancements**: Should we add subtle glow effects to words? CSS text-shadow, box-shadow, or backdrop treatments?

- **Rollout strategy**: Big-bang update or incremental? If incremental, how do we handle the transition period where some words have new styles and others don't?

## Next Steps

→ `/workflows:plan` for implementation details

