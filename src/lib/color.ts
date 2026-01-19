import type { ColorIntent } from "./schemas"

export type ColorMode = "light" | "dark"

export function deriveColor(intent: ColorIntent, mode: ColorMode): string {
  const { hue } = intent

  // Handle both old (saturation) and new (chroma/lightness) formats
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  const lightness = "lightness" in intent ? intent.lightness : 70

  if (mode === "dark") {
    // Dark mode: ensure readable on dark background (min 50% lightness)
    const l = Math.max(50, Math.min(90, lightness))
    return `oklch(${l}% ${chroma} ${hue})`
  } else {
    // Light mode: invert lightness for dark text on light background
    const l = Math.max(20, Math.min(45, 100 - lightness))
    return `oklch(${l}% ${chroma} ${hue})`
  }
}

// Generate color with P3 fallback for wider gamut displays
export function deriveColorWithFallback(intent: ColorIntent, mode: ColorMode): {
  base: string
  p3: string
} {
  const { hue } = intent

  // Handle both old (saturation) and new (chroma/lightness) formats
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  const lightness = "lightness" in intent ? intent.lightness : 70

  const l = mode === "dark"
    ? Math.max(50, Math.min(90, lightness))
    : Math.max(20, Math.min(45, 100 - lightness))

  // Base OKLCH (works in all modern browsers, auto-gamut-maps)
  const base = `oklch(${l}% ${chroma} ${hue})`

  // P3 version with slightly boosted chroma for wider gamut displays
  const p3Chroma = Math.min(0.45, chroma * 1.15)
  const p3 = `oklch(${l}% ${p3Chroma} ${hue})`

  return { base, p3 }
}

export function deriveCssVariables(intent: ColorIntent): Record<string, string> {
  return {
    "--vibe-color-light": deriveColor(intent, "light"),
    "--vibe-color-dark": deriveColor(intent, "dark"),
    "--vibe-hue": String(intent.hue),
    "--vibe-chroma": String(intent.chroma),
    "--vibe-lightness": `${intent.lightness}%`,
  }
}

export function deriveBackgroundColor(intent: ColorIntent): string {
  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  // Dark tinted background: 12% lightness, 60% chroma
  return `oklch(12% ${chroma * 0.6} ${hue})`
}

export function deriveTintedTextColor(intent: ColorIntent): string {
  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  // Light tinted text: high lightness, subtle chroma
  return `oklch(88% ${chroma * 0.25} ${hue})`
}

export function deriveTintedMutedColor(intent: ColorIntent): string {
  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  // Muted tinted text for secondary content
  return `oklch(65% ${chroma * 0.2} ${hue})`
}

const NEUTRAL_TINT_VARS = {
  "--tint-bg": "#09090b",
  "--tint-text": "#e4e4e7",
  "--tint-muted": "#71717a",
  "--tint-border": "#27272a",
}

export type ColorDepth = "shallow" | "deep"

export function deriveTintVariables(intent: ColorIntent | null, depth: ColorDepth = "shallow"): Record<string, string> {
  if (!intent) {
    return NEUTRAL_TINT_VARS
  }

  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2

  // Shallow: subtle gallery tint (5% lightness)
  // Deep: word page background (12% lightness, matching deriveBackgroundColor)
  const bgLightness = depth === "deep" ? 12 : 5
  const bgChroma = depth === "deep" ? chroma * 0.6 : chroma * 0.3

  return {
    "--tint-bg": `oklch(${bgLightness}% ${bgChroma.toFixed(3)} ${hue})`,
    "--tint-text": `oklch(80% ${(chroma * 0.15).toFixed(3)} ${hue})`,
    "--tint-muted": `oklch(55% ${(chroma * 0.1).toFixed(3)} ${hue})`,
    "--tint-border": `oklch(25% ${(chroma * 0.15).toFixed(3)} ${hue})`,
  }
}
