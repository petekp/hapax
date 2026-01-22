# Infinite Canvas Gallery Implementation Plan

Replace the marquee-based `AutoScrollGallery` with a pannable/zoomable canvas showing all ~150 words.

## Approach

**Pan:** Motion's `drag` with momentum and elastic bounds
**Zoom:** Native `wheel` event + touch pinch (no new dependencies)
**Virtualization:** Only render words in/near viewport
**Font loading:** Request fonts as words enter viewport, fade in when ready

## New Files

```
src/components/gallery/
  infinite-canvas/
    infinite-canvas-gallery.tsx   # Main component
    canvas-word.tsx               # Positioned word with font loading
    use-canvas-transform.ts       # Pan/zoom state management
    use-pinch-zoom.ts             # Touch gesture handling
    canvas-utils.ts               # Position calculation, viewport culling
    index.ts                      # Exports
```

## Implementation Steps

### 1. Canvas utilities (`canvas-utils.ts`)

- `positionWord(word, index, total, canvasSize)` - Deterministic positioning using word hash as seed
- `getVisibleWords(words, transform, viewport)` - AABB intersection test for virtualization
- `zoomAtPoint(transform, delta, cursorX, cursorY)` - Zoom math keeping cursor point stable
- Canvas config constants (6000x4000px, scale limits 0.3-2.5)

### 2. Transform hook (`use-canvas-transform.ts`)

```typescript
interface CanvasTransform {
  x: number      // Pan offset
  y: number
  scale: number  // Zoom level (1 = 100%)
}
```

- Initialize centered in viewport
- `clampTransform()` enforces bounds with 10% overscroll allowance
- Expose `transform`, `setTransform`, `clampTransform`

### 3. Pinch zoom hook (`use-pinch-zoom.ts`)

- Track two-finger touch distance and center point
- Calculate scale ratio from initial distance
- Update transform keeping pinch center stable
- Native touch events with `{ passive: false }`

### 4. Canvas word component (`canvas-word.tsx`)

Simplified from `GalleryWord`:
- Absolute positioned at `(x, y)` from bounds
- Request font on mount via existing `FontLoader`
- Invisible until font loads, then fade in (Motion animation)
- Hover: set active color for background tinting
- Click: navigate to word page

### 5. Main gallery component (`infinite-canvas-gallery.tsx`)

```
<div ref={containerRef}>           # Viewport, captures wheel
  <motion.div drag>                # Canvas layer with transform
    {visibleWords.map(word =>
      <CanvasWord key={word.normalized} {...word} />
    )}
  </motion.div>
</div>
```

- Fetch words from `/api/gallery`
- Compute positions once with `useMemo`
- Filter to visible words on transform change
- Wheel handler: zoom-to-cursor or pan (trackpad scroll)
- Motion drag with `dragMomentum` and `dragElastic`

### 6. Integration (`src/app/page.tsx`)

Replace `<AutoScrollGallery />` with `<InfiniteCanvasGallery />`.

## Word Positioning & Sizing Strategy

**Seeded random scatter with letter-based clustering:**
- Use word hash as random seed (deterministic)
- Cluster by first letter (A words near each other, etc.)
- Add jitter for organic feel
- Collision avoidance not needed (sparse enough)

**Random size variation:**
- Font size varies within range (e.g., 1.5rem to 4rem)
- Size determined by word hash (deterministic, consistent across sessions)
- Creates organic, curiosity-cabinet feel
- Word bounds calculated with actual size for accurate culling

## Key Implementation Details

**Zoom-to-cursor math:**
```typescript
// Point under cursor stays under cursor after zoom
const canvasX = (cursorX - transform.x) / transform.scale
const canvasY = (cursorY - transform.y) / transform.scale
const newX = cursorX - canvasX * newScale
const newY = cursorY - canvasY * newScale
```

**Wheel event detection:**
- `e.ctrlKey` or small `deltaY` → pinch gesture on trackpad → zoom
- Large `deltaY` without ctrl → scroll → pan

**Viewport culling:**
```typescript
const viewportInCanvas = {
  x: -transform.x / transform.scale,
  y: -transform.y / transform.scale,
  width: viewportWidth / transform.scale,
  height: viewportHeight / transform.scale,
}
// Filter words whose bounds intersect viewportInCanvas
```

## Files to Modify

- `src/app/page.tsx` - Swap gallery component
- `src/components/gallery/index.ts` - Add export

## Preserved Behavior

- Background tinting on hover (via `useActiveColor`)
- Click navigation to word pages
- Font loading with fade-in animation
- View transitions to word page

## Verification

1. `npm run dev` - Start dev server
2. Verify pan works (drag canvas)
3. Verify zoom works (scroll wheel, pinch on trackpad/touch)
4. Verify words fade in as they enter viewport
5. Verify hover tints background
6. Verify click navigates to word page
7. Test on mobile (touch pan and pinch zoom)
8. `npm run build` - Ensure no type errors
