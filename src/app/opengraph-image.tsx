import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const alt = "Hapax - A collection of rare words"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

// Convert OKLCH to hex for Satori
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

async function fetchGoogleFont(
  family: string,
  weight: number,
  style: "normal" | "italic" = "normal"
): Promise<ArrayBuffer | null> {
  const familyParam = style === "italic"
    ? `${family}:ital,wght@1,${weight}`
    : `${family}:wght@${weight}`

  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(familyParam)}`

  try {
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

// Chromatic gradient: warm amber (left) → cool violet (right)
// Vignette effect: words near hapax are brighter, edge words are darker
const CHROMA = 0.12 // Rich but not overwhelming

// Hue gradient: 30 (warm amber) → 280 (violet) across horizontal position
const ROWS = [
  // Top row - darkest (edge)
  [
    { word: "diaphanous", family: "Cormorant", weight: 300, style: "italic" as const, lightness: 24, hue: 30 },
    { word: "penumbra", family: "Cormorant Garamond", weight: 400, style: "italic" as const, lightness: 28, hue: 340 },
    { word: "numinous", family: "EB Garamond", weight: 400, style: "italic" as const, lightness: 26, hue: 280 },
    { word: "lithe", family: "Cormorant", weight: 400, style: "italic" as const, lightness: 22, hue: 250 },
  ],
  // Row with hapax - brightest neighbors
  [
    { word: "incunabula", family: "EB Garamond", weight: 400, style: "italic" as const, lightness: 35, hue: 35 },
    { word: "hapax", family: "IM Fell DW Pica", weight: 400, style: "italic" as const, lightness: 100, hue: 0 },
    { word: "palimpsest", family: "Cormorant", weight: 300, style: "italic" as const, lightness: 35, hue: 270 },
    { word: "dulcet", family: "Cormorant Garamond", weight: 400, style: "italic" as const, lightness: 30, hue: 320 },
  ],
  // Middle row - medium brightness
  [
    { word: "aureate", family: "EB Garamond", weight: 400, style: "italic" as const, lightness: 30, hue: 45 },
    { word: "mellifluous", family: "Cormorant Garamond", weight: 400, style: "italic" as const, lightness: 36, hue: 25 },
    { word: "oneiric", family: "Cormorant", weight: 300, style: "italic" as const, lightness: 32, hue: 220 },
    { word: "revenant", family: "EB Garamond", weight: 400, style: "italic" as const, lightness: 26, hue: 350 },
  ],
  // Bottom row - darkest (edge)
  [
    { word: "sidereal", family: "Cormorant", weight: 400, style: "italic" as const, lightness: 22, hue: 240 },
    { word: "coruscate", family: "Cormorant Garamond", weight: 400, style: "italic" as const, lightness: 26, hue: 160 },
    { word: "susurrus", family: "EB Garamond", weight: 400, style: "italic" as const, lightness: 24, hue: 90 },
    { word: "eventide", family: "Cormorant", weight: 300, style: "italic" as const, lightness: 20, hue: 280 },
  ],
]

const FONT_SIZE = 160

export default async function Image() {
  // Collect unique fonts
  const allWords = ROWS.flat()
  const fontPromises = allWords.map(w =>
    fetchGoogleFont(w.family, w.weight, w.style)
  )
  const fontResults = await Promise.all(fontPromises)

  const fonts: Array<{
    name: string
    data: ArrayBuffer
    style: "normal" | "italic"
    weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  }> = []

  fontResults.forEach((data, i) => {
    if (data) {
      fonts.push({
        name: allWords[i].family,
        data,
        style: allWords[i].style,
        weight: allWords[i].weight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
      })
    }
  })

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: "#09090b",
        overflow: "hidden",
        padding: "0 0 30px 0",
      }}
    >
      {ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: "48px",
            whiteSpace: "nowrap",
            marginLeft: rowIndex === 0 ? "-60%" : rowIndex === 2 ? "-70%" : rowIndex === 3 ? "50%" : "0",
          }}
        >
          {row.map((w) => (
            <span
              key={w.word}
              style={{
                fontFamily: w.family,
                fontWeight: w.weight,
                fontStyle: w.style,
                fontSize: `${FONT_SIZE}px`,
                color: w.word === "hapax"
                  ? "#ffffff"
                  : oklchToHex(w.lightness, CHROMA, w.hue),
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              {w.word}
            </span>
          ))}
        </div>
      ))}
    </div>,
    {
      ...size,
      fonts,
    }
  )
}
