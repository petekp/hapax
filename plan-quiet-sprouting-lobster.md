# Middle-Out Ripple Entrance Animation

## Goal
Replace the current linear stagger (index-based) with a middle-out ripple effect where words closest to the viewport center animate first, creating concentric ripples outward.

## Animation Spec
- **Fade**: opacity 0 → depthOpacity
- **Scale**: 0.9 → 1.0 with spring physics
- **Stagger**: Based on Euclidean distance from viewport center
- **Effect**: Words in center of screen animate first, outer words follow like ripples

## Approach: Per-Component Calculation

Use `useLayoutEffect` in `MasonryWord` to calculate each word's distance from viewport center at mount time. This is simpler than a context-based approach and sufficient since entrance animation only runs once.

```typescript
// Distance formula (Euclidean)
const viewportCenterX = window.innerWidth / 2
const viewportCenterY = window.innerHeight / 2
const rect = element.getBoundingClientRect()
const elementCenterX = rect.left + rect.width / 2
const elementCenterY = rect.top + rect.height / 2
const distance = Math.sqrt(
  (elementCenterX - viewportCenterX) ** 2 +
  (elementCenterY - viewportCenterY) ** 2
)

// Normalize to 0-1 and convert to delay
const maxDistance = Math.sqrt(viewportCenterX ** 2 + viewportCenterY ** 2)
const normalizedDistance = Math.min(distance / maxDistance, 1)
const delay = rippleBaseDelay + normalizedDistance * rippleDelayRange
```

## Files to Modify

### 1. `src/components/gallery/masonry/tuning-context.tsx`
Add to `TuningValues` interface and `tuningDefaults`:
```typescript
// Ripple Animation
rippleEnabled: boolean          // true - toggle ripple vs linear stagger
rippleBaseDelay: number         // 0 - min delay for center words (seconds)
rippleDelayRange: number        // 0.5 - max additional delay for edge words
rippleScaleFrom: number         // 0.92 - initial scale before animation
rippleSpringStiffness: number   // 100 - spring stiffness
rippleSpringDamping: number     // 12 - spring damping
```

### 2. `src/components/gallery/masonry/tuning-provider-dev.tsx`
Add Leva controls in "Entrance Animation" folder for all new parameters.

### 3. `src/components/gallery/masonry/masonry-word.tsx`
- Add `useLayoutEffect` to calculate ripple delay based on distance from viewport center
- Update `initial` to include `scale: tuning.rippleScaleFrom`
- Update `animate` to include `scale: 1`
- Update `transition` to use spring for scale and calculated ripple delay
- Fall back to `index * staggerDelay` when `rippleEnabled: false`

## Key Implementation Details

### Delay Calculation Timing
- Use `useLayoutEffect` (not `useEffect`) to calculate before paint
- Only calculate once at mount (entrance animation is one-time)
- Store delay in state to trigger re-render with correct value

### Handling Edge Cases
- **Reduced motion**: Skip animation entirely (already handled)
- **Off-screen words**: Will have large distances → long delays, but IntersectionObserver already prevents animation until visible
- **Scroll restoration**: Delays calculated after DOM is ready, so restored scroll position is factored in

### Spring Animation
```typescript
transition={{
  opacity: { duration: tuning.fadeInDuration, delay: rippleDelay },
  scale: {
    type: "spring",
    stiffness: tuning.rippleSpringStiffness,
    damping: tuning.rippleSpringDamping,
    delay: rippleDelay,
  },
  filter: { duration: tuning.fadeInDuration, delay: rippleDelay },
}}
```

## Suggested Default Values
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| rippleEnabled | true | Enable by default |
| rippleBaseDelay | 0 | Center words animate immediately |
| rippleDelayRange | 0.5 | Half second spread feels natural |
| rippleScaleFrom | 0.92 | Subtle scale-up, not too dramatic |
| rippleSpringStiffness | 100 | Snappy but not jarring |
| rippleSpringDamping | 12 | Slight overshoot for life |

## Verification
1. Run `pnpm dev` and observe gallery entrance
2. Words in center of viewport should animate first
3. Scroll to middle of page, refresh → center words still animate first
4. Use Leva panel to tune parameters in real-time
5. Toggle `rippleEnabled` off → should fall back to linear stagger
6. Test with `prefers-reduced-motion` → no animation
7. Run `pnpm build` to verify no errors
