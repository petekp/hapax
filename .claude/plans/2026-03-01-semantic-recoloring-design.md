---
date: 2026-03-01
topic: semantic-recoloring
status: approved
---

# Semantic Recoloring — Full Pass

## Goal
Recolor all 205 words so each word's color evokes its meaning/character in isolation.
No top-down palette distribution — pure semantic intent per word.

## Color Philosophy
The color should feel inevitable when you read the word. Not category-driven
(purple-because-mysterious) but meaning-driven (surreptitious = dark cool gray-green
because it slinks through shadows).

## OKLCh Parameters
- **Hue (0-360):** Chosen from semantic reasoning about the word's meaning
- **Chroma baseline: 0.15-0.25** (jewel-toned, rich & saturated)
  - Lower (0.05-0.12): words demanding desaturation (eigengrau, grisaille, moribund)
  - Higher (0.25-0.35): words with inherent radiance (phosphorescent, coruscate)
- **Lightness: 38-78** for dark background readability
  - Dark/heavy words: 38-50
  - Luminous words: 65-78
  - Most words: 48-62

## Process
1. Claude authors all 205 color assignments with semantic rationale
2. Update vetted-styles.json + words-index.json
3. Run pnpm sync-styles for MDX
4. Push, review on production

## Approach
Approach A: Claude-authored assignments. Reasoning from each word's definition,
etymology, and connotation in the MDX files.
