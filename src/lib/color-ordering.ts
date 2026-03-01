import type { GalleryWordEntry } from "@/app/api/gallery/route"

function gcd(a: number, b: number): number {
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a
}

/**
 * Orders words so adjacent entries have maximally different hues.
 *
 * Sorts by hue, then walks the sorted list with a golden-ratio stride.
 * Because φ is the most irrational number, this produces the largest
 * possible hue gap between any two neighbors — the same principle
 * that governs sunflower seed packing (phyllotaxis).
 */
export function orderByComplementaryHues(
  words: GalleryWordEntry[]
): GalleryWordEntry[] {
  if (words.length <= 1) return words

  const byHue = [...words].sort(
    (a, b) => a.variant.colorIntent.hue - b.variant.colorIntent.hue
  )

  const n = byHue.length

  // Golden-ratio stride maximizes hue spread between neighbors.
  // Ensure stride is coprime with n for complete coverage.
  let stride = Math.round(n * (Math.sqrt(5) - 1) / 2)
  while (gcd(stride, n) !== 1) stride++

  const result: GalleryWordEntry[] = []
  let idx = 0
  for (let i = 0; i < n; i++) {
    result.push(byHue[idx])
    idx = (idx + stride) % n
  }

  return result
}
