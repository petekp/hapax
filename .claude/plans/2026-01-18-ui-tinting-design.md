# UI Tinting with Active Word Color

## Overview

The entire UI takes on a subtle color tint based on the "active" word — either the word being hovered in the gallery, or the word being viewed on the detail page. When no word is active, the UI returns to neutral zinc colors.

## Behavior

- **Gallery page:** Hovering a word tints the entire page (background, header, other words) with that word's color
- **Word detail page:** The page is tinted with the viewed word's color (already partially implemented)
- **No active word:** UI returns to neutral zinc (`bg-zinc-950`, etc.)
- **Transition:** Smooth 700ms crossfade between colors

## Tint Intensity

The gallery uses a subtle wash (~30% intensity) to keep browsing comfortable:
- Background shifts from pure `zinc-950` to a very dark tinted version
- Header title and search bar take on a subtle hue
- Non-hovered words get a gentle tint wash

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ ActiveColorProvider (in layout.tsx)                 │
│ - Holds activeColor: ColorIntent | null             │
│ - Applies CSS variables to wrapper div              │
│ - 700ms transition on color changes                 │
├─────────────────────────────────────────────────────┤
│ Consumers:                                          │
│ - GalleryWord: sets color on hover, clears on leave │
│ - WordPage: sets color when style loads             │
│ - Header elements: read CSS variables for tint      │
└─────────────────────────────────────────────────────┘
```

## CSS Variables

Set on the provider wrapper:
- `--tint-bg` — tinted background color
- `--tint-text` — tinted primary text color
- `--tint-muted` — tinted secondary/muted text color

## File Changes

1. `src/lib/color.ts` — Add `deriveTintVariables(intent: ColorIntent | null)`
2. `src/lib/active-color-context.tsx` (new) — Context provider and hook
3. `src/app/layout.tsx` — Wrap children in provider, apply CSS variables
4. `src/components/gallery/gallery-word.tsx` — Set/clear active color on hover
5. `src/app/page.tsx` — Use tinted CSS variables in header
6. `src/app/word/[word]/page.tsx` — Set active color when style loads

## Color Derivation

For subtle wash (gallery):
- Background: `oklch(5% {chroma * 0.3} {hue})`
- Text: `oklch(80% {chroma * 0.15} {hue})`
- Muted: `oklch(55% {chroma * 0.1} {hue})`

Neutral fallback (no active word):
- Background: `#09090b` (zinc-950)
- Text: `#e4e4e7` (zinc-200)
- Muted: `#71717a` (zinc-500)
