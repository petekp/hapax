import { ImageResponse } from "next/og"
import type { FontVariant } from "../schemas"
import { deriveBackgroundColor, deriveColorHex } from "../color"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

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
  // Hex, since Satori doesn't take oklch(); matches the word page
  const color = deriveColorHex(variant.colorIntent)
  const bgColor = deriveBackgroundColor(variant.colorIntent)
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
