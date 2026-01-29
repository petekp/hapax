import type { GalleryWordEntry } from "@/app/api/gallery/route"

export function orderByComplementaryHues(
  words: GalleryWordEntry[]
): GalleryWordEntry[] {
  if (words.length === 0) return []

  const byHue = [...words].sort(
    (a, b) => a.variant.colorIntent.hue - b.variant.colorIntent.hue
  )

  const warmHalf = byHue.filter((w) => w.variant.colorIntent.hue < 180)
  const coolHalf = byHue.filter((w) => w.variant.colorIntent.hue >= 180)

  const result: GalleryWordEntry[] = []
  const maxLen = Math.max(warmHalf.length, coolHalf.length)

  for (let i = 0; i < maxLen; i++) {
    if (warmHalf[i]) result.push(warmHalf[i])
    if (coolHalf[i]) result.push(coolHalf[i])
  }

  return result
}
