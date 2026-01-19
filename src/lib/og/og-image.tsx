import { ImageResponse } from "next/og"
import type { FontVariant } from "../schemas"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

// Convert OKLCH to hex for Satori (which doesn't support OKLCH)
function oklchToHex(l: number, c: number, h: number): string {
  if (c < 0.001) {
    const gray = Math.round(l * 2.55)
    return `#${gray.toString(16).padStart(2, "0").repeat(3)}`
  }

  const hRad = (h * Math.PI) / 180
  const a = c * Math.cos(hRad)
  const b = c * Math.sin(hRad)

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

  const toSRGB = (x: number) => {
    x = Math.max(0, Math.min(1, x))
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  }

  r = Math.round(Math.max(0, Math.min(255, toSRGB(r) * 255)))
  g = Math.round(Math.max(0, Math.min(255, toSRGB(g) * 255)))
  bl = Math.round(Math.max(0, Math.min(255, toSRGB(bl) * 255)))

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`
}

function deriveColorHex(hue: number, chroma: number, lightness: number): string {
  const l = Math.max(50, Math.min(90, lightness))
  return oklchToHex(l, chroma, hue)
}

function deriveBackgroundHex(hue: number, chroma: number): string {
  // Match word page: 12% lightness, 60% chroma
  return oklchToHex(12, chroma * 0.6, hue)
}

function calculateFontSize(word: string): number {
  const maxSize = 220
  const minSize = 72
  const availableWidth = 1080 // 1200 - 2*60 padding

  // Average character width as proportion of font size (varies by font, ~0.5-0.6)
  const avgCharWidthRatio = 0.55

  // Calculate size that would fit the word
  const fittedSize = availableWidth / (word.length * avgCharWidthRatio)

  return Math.round(Math.max(minSize, Math.min(maxSize, fittedSize)))
}

async function fetchGoogleFont(
  family: string,
  weight: number,
  text: string,
  style: "normal" | "italic" = "normal"
): Promise<ArrayBuffer | null> {
  const familyParam = style === "italic"
    ? `${family}:ital,wght@1,${weight}`
    : `${family}:wght@${weight}`

  const params = new URLSearchParams({
    family: familyParam,
    text,
  })

  const cssUrl = `https://fonts.googleapis.com/css2?${params}`

  try {
    // Use a User-Agent that requests TTF (not WOFF2) - next/og only supports TTF/OTF
    const cssResponse = await fetch(cssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10+ (KHTML, like Gecko) Version/10.0.9.2372 Mobile Safari/537.10+",
      },
    })

    if (!cssResponse.ok) return null

    const css = await cssResponse.text()
    const fontUrlMatch = css.match(/src:\s*url\(([^)]+)\)/)

    if (!fontUrlMatch?.[1]) return null

    const fontResponse = await fetch(fontUrlMatch[1])
    if (!fontResponse.ok) return null

    return fontResponse.arrayBuffer()
  } catch {
    return null
  }
}

export async function generateWordOgImage(
  word: string,
  variant: FontVariant
): Promise<ImageResponse> {
  const { hue, chroma, lightness } = variant.colorIntent
  const color = deriveColorHex(hue, chroma, lightness)
  const bgColor = deriveBackgroundHex(hue, chroma)
  const fontSize = calculateFontSize(word)

  const [fontData, brandFontData] = await Promise.all([
    fetchGoogleFont(variant.family, variant.weight, word, variant.style as "normal" | "italic"),
    fetchGoogleFont("IM Fell DW Pica", 400, "hapax.ink", "italic"),
  ])

  const fonts: Array<{
    name: string
    data: ArrayBuffer
    style: "normal" | "italic"
    weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  }> = []

  if (fontData) {
    fonts.push({
      name: variant.family,
      data: fontData,
      style: variant.style as "normal" | "italic",
      weight: variant.weight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
    })
  }

  if (brandFontData) {
    fonts.push({
      name: "IM Fell DW Pica",
      data: brandFontData,
      style: "italic",
      weight: 400,
    })
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bgColor,
        padding: "60px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: `${fontSize}px`,
          fontFamily: fontData ? variant.family : "serif",
          fontWeight: variant.weight,
          fontStyle: variant.style,
          color,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        {word}
      </div>

      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: "40px",
          right: "50px",
          fontSize: "32px",
          fontFamily: brandFontData ? "IM Fell DW Pica" : "Georgia",
          fontStyle: "italic",
          fontWeight: 400,
          color: "rgba(255, 255, 255, 0.5)",
        }}
      >
        hapax.ink
      </div>
    </div>,
    {
      ...size,
      fonts,
    }
  )
}
