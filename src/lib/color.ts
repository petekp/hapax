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

export function deriveTintedMutedColorHex(intent: ColorIntent): string {
  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  // Muted tinted text for secondary content, in hex for animation
  return oklchToHex(65, chroma * 0.2, hue)
}

export function deriveHoverColorHex(intent: ColorIntent): string {
  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  // Brighter, more saturated color for hover states
  return oklchToHex(70, Math.max(chroma * 0.5, 0.08), hue)
}

const NEUTRAL_TINT_VARS = {
  "--tint-bg": "#000000",
  "--tint-text": "#e4e4e7",
  "--tint-muted": "#71717a",
  "--tint-border": "#27272a",
}

export type ColorDepth = "shallow" | "deep"

// Convert OKLCH to RGB for smooth Motion interpolation
// Uses CSS color parsing via a temporary element
function oklchToHex(l: number, c: number, h: number): string {
  // For very low chroma or neutral colors, return grayscale
  if (c < 0.001) {
    const gray = Math.round(l * 2.55)
    return `#${gray.toString(16).padStart(2, "0").repeat(3)}`
  }

  // Convert OKLCH to approximate RGB
  // This is a simplified conversion that works well for UI colors
  const hRad = (h * Math.PI) / 180

  // OKLCH to OKLab
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)

  // OKLab to linear RGB (simplified)
  const L = l / 100
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3

  // Clamp and convert to sRGB
  const toSRGB = (x: number) => {
    x = Math.max(0, Math.min(1, x))
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  }

  r = Math.round(toSRGB(r) * 255)
  g = Math.round(toSRGB(g) * 255)
  bl = Math.round(toSRGB(bl) * 255)

  r = Math.max(0, Math.min(255, r))
  g = Math.max(0, Math.min(255, g))
  bl = Math.max(0, Math.min(255, bl))

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`
}

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
    "--tint-bg": oklchToHex(bgLightness, bgChroma, hue),
    "--tint-text": oklchToHex(80, chroma * 0.15, hue),
    "--tint-muted": oklchToHex(55, chroma * 0.1, hue),
    "--tint-border": oklchToHex(25, chroma * 0.15, hue),
  }
}
