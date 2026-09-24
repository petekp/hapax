import type { ColorIntent } from "./schemas"

export type ColorMode = "light" | "dark"

export type Gamut = "srgb" | "p3"

// Intent lightness runs 30–90, but below ~40 a word sinks into the near-black
// page. Flooring everything under 50 at 50 kept words legible but erased the
// difference between tenebrous (32) and a mid-tone word (48), so the dark end
// is compressed instead: 30–50 maps onto 40–50, keeping every word's order.
const DARK_FLOOR = 40
const DARK_KNEE = 50

export function displayLightness(lightness: number): number {
  const l = Math.min(90, lightness)
  if (l >= DARK_KNEE) return l
  const t = Math.max(0, (l - 30) / (DARK_KNEE - 30))
  return round(DARK_FLOOR + t * (DARK_KNEE - DARK_FLOOR), 2)
}

type Rgb = [number, number, number]
type Lab = [number, number, number]

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

// OKLCH (lightness in percent) to OKLab
function oklchToOklab(l: number, c: number, h: number): Lab {
  const hRad = (h * Math.PI) / 180
  return [l / 100, c * Math.cos(hRad), c * Math.sin(hRad)]
}

function oklabToLinearSrgb([L, a, b]: Lab): Rgb {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3,
  ]
}

function linearSrgbToOklab([r, g, b]: Rgb): Lab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ]
}

// Linear sRGB to and from the target gamut's own linear RGB
function toGamutRgb([r, g, b]: Rgb, gamut: Gamut): Rgb {
  if (gamut === "srgb") return [r, g, b]
  return [
    0.8224621 * r + 0.177538 * g,
    0.0331941 * r + 0.9668058 * g,
    0.0170827 * r + 0.0723974 * g + 0.9105199 * b,
  ]
}

function fromGamutRgb([r, g, b]: Rgb, gamut: Gamut): Rgb {
  if (gamut === "srgb") return [r, g, b]
  return [
    1.2249401 * r - 0.2249404 * g,
    -0.0420569 * r + 1.0420571 * g,
    -0.0196376 * r - 0.0786361 * g + 1.0982735 * b,
  ]
}

const GAMUT_EPSILON = 1e-4

function inGamut(lab: Lab, gamut: Gamut): boolean {
  return toGamutRgb(oklabToLinearSrgb(lab), gamut).every(
    (x) => x >= -GAMUT_EPSILON && x <= 1 + GAMUT_EPSILON
  )
}

function clipToGamut(lab: Lab, gamut: Gamut): Lab {
  const rgb = toGamutRgb(oklabToLinearSrgb(lab), gamut)
  const clipped = rgb.map((x) => Math.max(0, Math.min(1, x))) as Rgb
  return linearSrgbToOklab(fromGamutRgb(clipped, gamut))
}

function deltaEOK(a: Lab, b: Lab): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

// Browsers clip out-of-gamut colors channel by channel, which shifts hue: a gold
// page background came out pure red, and on sRGB screens some words drifted by
// 30°. This is the CSS Color 4 gamut mapping algorithm: lower chroma (keeping
// lightness and hue) until clipping the rest is imperceptible.
// https://www.w3.org/TR/css-color-4/#binsearch
function gamutMap(l: number, c: number, h: number, gamut: Gamut): Lab {
  const JND = 0.02
  const EPSILON = 0.0001

  const origin = oklchToOklab(l, c, h)
  if (inGamut(origin, gamut)) return origin

  let clipped = clipToGamut(origin, gamut)
  if (deltaEOK(clipped, origin) < JND) return clipped

  let min = 0
  let max = c
  let minInGamut = true
  while (max - min > EPSILON) {
    const chroma = (min + max) / 2
    const current = oklchToOklab(l, chroma, h)
    if (minInGamut && inGamut(current, gamut)) {
      min = chroma
      continue
    }
    clipped = clipToGamut(current, gamut)
    const e = deltaEOK(clipped, current)
    if (e < JND) {
      if (JND - e < EPSILON) return clipped
      minInGamut = false
      min = chroma
    } else {
      max = chroma
    }
  }
  return clipped
}

function oklchCss(l: number, c: number, h: number, gamut: Gamut = "srgb"): string {
  const [L, a, b] = gamutMap(l, c, h, gamut)
  const chroma = Math.hypot(a, b)
  // Keep the authored hue when mapping leaves too little chroma to define one
  const hue = chroma < 0.002 ? h : (Math.atan2(b, a) * 180) / Math.PI
  return `oklch(${round(L * 100, 2)}% ${round(chroma, 4)} ${round((hue + 360) % 360, 2)})`
}

// Hex output for Motion interpolation and Satori, which don't take oklch()
export function oklchToHex(l: number, c: number, h: number): string {
  const rgb = oklabToLinearSrgb(gamutMap(l, c, h, "srgb"))

  const toHexChannel = (x: number) => {
    const v = Math.max(0, Math.min(1, x))
    const encoded = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
    return Math.round(encoded * 255).toString(16).padStart(2, "0")
  }

  return `#${rgb.map(toHexChannel).join("")}`
}

export function deriveColor(intent: ColorIntent, mode: ColorMode): string {
  const { hue } = intent

  // Handle both old (saturation) and new (chroma/lightness) formats
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  const lightness = "lightness" in intent ? intent.lightness : 70

  if (mode === "dark") {
    return oklchCss(displayLightness(lightness), chroma, hue)
  } else {
    // Light mode: invert lightness for dark text on light background
    const l = Math.max(20, Math.min(45, 100 - lightness))
    return `oklch(${l}% ${chroma} ${hue})`
  }
}

const inkCache = new Map<string, Record<string, string>>()

// A word's color mapped separately into sRGB and Display P3. Pair with the
// `.ink` class (globals.css), which picks the one matching the screen, so hues
// hold on sRGB displays and stay vivid on wide-gamut ones.
export function deriveInkVariables(intent: ColorIntent): Record<string, string> {
  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  const lightness = "lightness" in intent ? intent.lightness : 70

  const key = `${hue}:${chroma}:${lightness}`
  const cached = inkCache.get(key)
  if (cached) return cached

  const l = displayLightness(lightness)
  const vars = {
    "--ink-srgb": oklchCss(l, chroma, hue, "srgb"),
    "--ink-p3": oklchCss(l, chroma, hue, "p3"),
  }
  inkCache.set(key, vars)
  return vars
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
    ? displayLightness(lightness)
    : Math.max(20, Math.min(45, 100 - lightness))

  // Base OKLCH (works in all modern browsers, which clip it to the display gamut)
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

// The word's color as sRGB hex, for share images
export function deriveColorHex(intent: ColorIntent): string {
  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  const lightness = "lightness" in intent ? intent.lightness : 70
  return oklchToHex(displayLightness(lightness), chroma, hue)
}

export type ColorDepth = "shallow" | "deep"

// Chroma is scaled past what sRGB can show this dark, so gamut mapping settles
// each tint at the richest in-gamut color of the word's hue.
const TINT_BACKGROUND: Record<ColorDepth, { lightness: number; chromaScale: number }> = {
  // Gallery hover wash
  shallow: { lightness: 10, chromaScale: 0.6 },
  // Word page, overlay, and share image
  deep: { lightness: 14, chromaScale: 0.6 },
}

export function deriveBackgroundColor(intent: ColorIntent, depth: ColorDepth = "deep"): string {
  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  const { lightness, chromaScale } = TINT_BACKGROUND[depth]
  return oklchToHex(lightness, chroma * chromaScale, hue)
}

export function deriveTintedTextColor(intent: ColorIntent): string {
  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  // Light tinted text: high lightness, subtle chroma
  return oklchCss(88, chroma * 0.25, hue)
}

export function deriveTintedMutedColor(intent: ColorIntent): string {
  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2
  // Muted tinted text for secondary content
  return oklchCss(65, chroma * 0.2, hue)
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

export function deriveTintVariables(intent: ColorIntent | null, depth: ColorDepth = "shallow"): Record<string, string> {
  if (!intent) {
    return NEUTRAL_TINT_VARS
  }

  const { hue } = intent
  const chroma = "chroma" in intent ? intent.chroma : 0.2

  return {
    "--tint-bg": deriveBackgroundColor(intent, depth),
    "--tint-text": oklchToHex(80, chroma * 0.15, hue),
    "--tint-muted": oklchToHex(55, chroma * 0.1, hue),
    "--tint-border": oklchToHex(25, chroma * 0.15, hue),
  }
}
