# Expanding Word Overlay Architecture

Transform word detail from a separate page into an expanding overlay where the word animates from its gallery position to center screen, with content revealing around it.

## The Vision

- Gallery stays mounted underneath (dimmed/blurred)
- Clicking a word expands it in place to center screen
- Definition content fades in around the word
- Back reverses the animation - word contracts to gallery position
- URL updates for shareability, direct access still works
- No page transition, one continuous animation

## Architecture

### New Components

```
src/components/word-overlay/
  overlay-context.tsx      # State: selectedWord, isOpen, wordData
  word-overlay.tsx         # Backdrop + positioned container
  overlay-content.tsx      # Definition content (extracted from word-page.tsx)
  shared-word.tsx          # Word element with layoutId for shared transition
```

### How layoutId Works

The same word exists in two places with matching `layoutId`:
1. **Gallery**: `MasonryWord` renders `SharedWord layoutId={word}`
2. **Overlay**: When open, overlay renders `SharedWord layoutId={word}` at center

Motion automatically animates between positions when one appears/disappears.

## Implementation

### Phase 1: Overlay Infrastructure

**Create `src/components/word-overlay/overlay-context.tsx`**
```typescript
interface OverlayState {
  selectedWord: string | null
  variant: FontVariant | null
  content: WordContent | null
}

// Provides: openWord(word, variant), closeWord(), state
```

**Create `src/components/word-overlay/shared-word.tsx`**
- Accepts `layoutId`, `size` (gallery | overlay), `variant`, `word`
- Handles font loading
- Applies appropriate font size based on context

### Phase 2: Gallery Integration

**Modify `src/components/gallery/masonry/masonry-word.tsx`**
- Replace inline word text with `<SharedWord layoutId={word} size="gallery" />`
- On click: call `openWord()` instead of navigating
- Remove sessionStorage handoff logic (no longer needed)

**Modify `src/app/page.tsx`**
- Wrap with `OverlayProvider`
- Add `<WordOverlay />` component
- Handle `popstate` for browser back/forward

### Phase 3: Overlay UI

**Create `src/components/word-overlay/word-overlay.tsx`**
```tsx
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Content container */}
      <div className="fixed inset-0 flex flex-col items-center pt-32">
        <SharedWord layoutId={word} size="overlay" variant={variant} />
        <OverlayContent word={word} content={content} />
      </div>
    </>
  )}
</AnimatePresence>
```

**Create `src/components/word-overlay/overlay-content.tsx`**
- Extract from `word-page.tsx`: phonetic, part of speech, definitions, MDX content
- Staggered fade-in after word arrives
- Uses existing `ScrollRevealSection` pattern

### Phase 4: Routing

**Shallow routing (no page reload):**
```typescript
// Open
window.history.pushState({ overlay: true, word }, "", `/word/${word}`)

// Close
window.history.back()  // or pushState to "/"

// Handle popstate
useEffect(() => {
  const handler = (e: PopStateEvent) => {
    if (e.state?.overlay) openWord(e.state.word)
    else closeWord()
  }
  window.addEventListener("popstate", handler)
  return () => window.removeEventListener("popstate", handler)
}, [])
```

**Direct URL access**: Keep existing `/word/[word]/page.tsx` as fallback for SSR/SEO.

### Phase 5: Polish

- Add tuning parameters to `tuning-context.tsx` for animation iteration
- Focus management (trap in overlay, restore on close)
- Escape key closes overlay
- Reduced motion support
- Gallery gets `pointer-events: none` when overlay open

## Animation Choreography

### Opening (~600ms total)
| Step | Duration | Element |
|------|----------|---------|
| 1 | 300ms | Backdrop fades in, blur appears |
| 2 | 400ms | Word springs from gallery to center (layoutId) |
| 3 | 300ms | Content fades in with stagger (starts 200ms after word) |

### Closing (~450ms total)
| Step | Duration | Element |
|------|----------|---------|
| 1 | 150ms | Content fades out |
| 2 | 350ms | Word springs back to gallery position |
| 3 | 200ms | Backdrop fades out |

**Spring config**: `{ stiffness: 80, damping: 20, mass: 1 }`

## Files to Modify

| File | Change |
|------|--------|
| `src/app/page.tsx` | Add OverlayProvider, WordOverlay, popstate handler |
| `src/components/gallery/masonry/masonry-word.tsx` | Use SharedWord, click opens overlay |
| `src/components/gallery/masonry/tuning-context.tsx` | Add overlay animation params |

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/word-overlay/overlay-context.tsx` | Overlay state management |
| `src/components/word-overlay/word-overlay.tsx` | Backdrop + container |
| `src/components/word-overlay/overlay-content.tsx` | Definition content |
| `src/components/word-overlay/shared-word.tsx` | Shared element with layoutId |
| `src/components/word-overlay/index.ts` | Exports |

## Files Unchanged

| File | Reason |
|------|--------|
| `src/app/word/[word]/page.tsx` | Keep for direct URL, SSR, metadata |
| `src/app/word/[word]/word-page.tsx` | Keep as standalone fallback |
| `src/lib/active-color-context.tsx` | Already supports depth, works as-is |

## Verification

1. **Gallery behavior unchanged**: Words render, hover tints background, parallax works
2. **Click opens overlay**: Word animates from gallery position to center
3. **Content loads**: Phonetic, definitions appear with stagger
4. **Back closes overlay**: Word animates back to exact gallery position
5. **URL updates**: Browser shows `/word/[word]`, back button works
6. **Direct URL**: Navigating to `/word/[word]` directly shows full page (fallback)
7. **Scroll preserved**: Gallery scroll position unchanged after close
8. **Accessibility**: Focus trapped, Escape closes, screen reader announces

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| layoutId glitches with many fonts | Test thoroughly, fall back to manual animation if needed |
| Gallery re-renders on overlay | Memoize SharedWord, separate context |
| Performance on mobile | Test backdrop blur, reduce/disable if slow |
| Direct URL breaks | Existing server route remains as fallback |
