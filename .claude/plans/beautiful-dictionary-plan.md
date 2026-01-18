# Beautiful Dictionary Plan

## Vision

Transform vibetype into a beautiful online dictionary where every word has unique, LLM-generated styling (typography + color). The app becomes a visual experience for exploring language.

## Product

### Landing Page (`/`)

- **Minimal design** - clean, focused
- **Search bar** - primary interaction, prominent placement
- **Auto-scrolling words** - ambient visual showcase flowing across the screen
  - All words are clickable → navigate to that word's page
  - Flowing text layout (prose-like, not grid)
  - Gentle automatic scroll (marquee/credits roll feel)

### Word Page (`/word/{word}`)

- **Styled word** - unique typography (Google Fonts) + OKLCH color
- **Definition** - from Free Dictionary API
- **Nothing else** - minimal, focused on the word itself

### Typing Mode

Hidden/disabled for the public version. May revisit later.

## Technical Approach

### Data Flow

```
Curated word list → Seed script (LLM styling) → Vercel KV
                                                    ↓
Free Dictionary API → Definition ←─── Word Page ←── User
                                                    ↑
                          Landing Page (auto-scroll)
```

### KV Structure

- `gallery:index` - Sorted list of all word keys (alphabetical)
- `gallery:word:{normalized}` - `{ word, variant: FontVariant, createdAt }`
- `gallery:meta` - `{ count, lastUpdated }`

### New Components

1. **Landing page** - Search bar + auto-scrolling word showcase
2. **Word page** (`/word/[word]`) - Styled word + definition display
3. **Gallery API** (`/api/gallery`) - Paginated word fetches from KV
4. **Definition fetcher** - Client-side Free Dictionary API integration
5. **Seed script** (`scripts/seed-gallery.ts`) - Bulk LLM style generation

### Virtualization

- Large pre-load buffer (words rendered ahead of viewport)
- Breathing animation fallback when loading is visible
- Recycle DOM nodes for smooth auto-scroll performance

### Reuse from Existing Code

- `VibeWord` component (styling, animations, breathing state)
- `FontVariant` schema and OKLCH color system
- Font loading system (Google Fonts batching)
- LLM resolution logic (adapt for batch processing)

## Scope

### MVP (Phase 1)

- [ ] Landing page with search bar
- [ ] Auto-scrolling word showcase (20-30 words)
- [ ] Word pages with styled word + definition
- [ ] Seed script to populate KV from word list
- [ ] Hide/disable typing mode

### Future (Phase 2+)

- Admin UI for adding/restyling words
- Expand to hundreds/thousands of words
- Additional dictionary features (pronunciation, etymology, examples)
- Share/social features
- Related words / similar vibes

## Open Questions

- **Word list**: Need your initial 20-30 favorite words to seed the MVP
- **Auto-scroll speed**: Will need to tune through iteration
- **Mobile experience**: Auto-scroll may need different treatment on touch devices
- **Search behavior**: Fuzzy matching? Suggestions as you type?

## Next Steps

1. Get your initial word list (20-30 words)
2. Build the seed script + KV structure
3. Create landing page with auto-scroll
4. Create word pages with definition integration
5. Hide typing mode
6. Iterate on scroll speed and visual polish
