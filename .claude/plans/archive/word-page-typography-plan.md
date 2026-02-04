# Word Page Typography & Styling Refinement

## Vision

Transform the word page into a museum placard experience—the word is the art, everything else is quiet context. Supporting typography stays neutral and minimal so the word's unique font remains the undisputed star.

## Design Decisions

### Color Suffusion (Selective Emphasis)

The word's color appears in specific UI elements at low opacity, creating a cohesive tint without distraction:

- **Metadata line** — Pronunciation and part-of-speech in soft tinted color
- **Divider rules** — Faint horizontal rules between meaning groups carry the tint
- **Example quotes** — Italic example sentences pick up the color
- **Back link** — Hover state transitions to the word's color

### Metadata Presentation

Combine pronunciation and part-of-speech into a single inline metadata line:

```
noun · /ˈsɛr.ən.dɪp.ɪ.ti/
```

Treatment:
- Small size, generous letterspacing
- Word's color at low opacity (soft tint)
- Positioned directly below the word
- Small caps for part-of-speech, regular weight for phonetic

### Section Labels

**Remove them entirely.**

- Single part-of-speech: Already shown in the metadata line
- Multiple parts of speech: Separated by visual breaks (whitespace + faint tinted horizontal rule)

No headers, no "noun" / "verb" labels as separate elements. Trust context and visual rhythm.

### Typography System

"Let the word lead" — Keep supporting type neutral and minimal:

- **Word**: Its unique curated font (unchanged, the star)
- **Metadata**: A quiet, neutral sans-serif (system or Inter) in small caps + regular
- **Body definitions**: Clean serif (keep Georgia or upgrade to something equally neutral)
- **Examples**: Same serif, italic

The goal is museum placard typography—unobtrusive, refined, receding.

## Implementation Checklist

1. [ ] Create metadata line component combining part-of-speech + pronunciation
2. [ ] Style metadata with small caps, letterspacing, and tinted color
3. [ ] Remove section headers (`<h2>` elements for noun/verb)
4. [ ] Add visual breaks between meaning groups (whitespace + tinted rule)
5. [ ] Apply tinted color to example quotes
6. [ ] Update back link with tinted hover state
7. [ ] Audit typography for consistency—ensure supporting type is neutral
8. [ ] Test with various words to ensure color tinting works across hues

## Open Questions

- Should the divider rules be visible by default or only appear when there are multiple parts of speech?
- How much whitespace between meaning groups feels right? (Tune through iteration)

## Reference

Current file: `src/app/word/[word]/word-page.tsx`
