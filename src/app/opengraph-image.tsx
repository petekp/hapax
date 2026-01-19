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

// Rows of words mimicking the landing page marquee layout
// Using reliable Google Fonts that render well in Satori
const ROWS = [
  [
    { word: "diaphanous", family: "Cormorant", weight: 300, style: "italic" as const, hue: 190, chroma: 0.18, lightness: 65 },
    { word: "penumbra", family: "Cormorant Garamond", weight: 400, style: "italic" as const, hue: 45, chroma: 0.24, lightness: 65 },
    { word: "numinous", family: "EB Garamond", weight: 400, style: "italic" as const, hue: 320, chroma: 0.18, lightness: 62 },
    { word: "lithe", family: "Cormorant", weight: 400, style: "italic" as const, hue: 130, chroma: 0.20, lightness: 55 },
  ],
  [
    { word: "incunabula", family: "EB Garamond", weight: 400, style: "italic" as const, hue: 35, chroma: 0.22, lightness: 58 },
    { word: "hapax", family: "IM Fell DW Pica", weight: 400, style: "italic" as const, hue: 285, chroma: 0.20, lightness: 58 },
    { word: "palimpsest", family: "Cormorant", weight: 300, style: "italic" as const, hue: 270, chroma: 0.20, lightness: 55 },
    { word: "dulcet", family: "Cormorant Garamond", weight: 400, style: "italic" as const, hue: 355, chroma: 0.22, lightness: 58 },
  ],
  [
    { word: "aureate", family: "EB Garamond", weight: 400, style: "italic" as const, hue: 50, chroma: 0.24, lightness: 68 },
    { word: "mellifluous", family: "Cormorant Garamond", weight: 400, style: "italic" as const, hue: 25, chroma: 0.22, lightness: 62 },
    { word: "oneiric", family: "Cormorant", weight: 300, style: "italic" as const, hue: 200, chroma: 0.18, lightness: 62 },
    { word: "revenant", family: "EB Garamond", weight: 400, style: "italic" as const, hue: 8, chroma: 0.24, lightness: 55 },
  ],
  [
    { word: "sidereal", family: "Cormorant", weight: 400, style: "italic" as const, hue: 235, chroma: 0.20, lightness: 60 },
    { word: "coruscate", family: "Cormorant Garamond", weight: 400, style: "italic" as const, hue: 160, chroma: 0.18, lightness: 55 },
    { word: "susurrus", family: "EB Garamond", weight: 400, style: "italic" as const, hue: 95, chroma: 0.16, lightness: 55 },
    { word: "eventide", family: "Cormorant", weight: 300, style: "italic" as const, hue: 280, chroma: 0.22, lightness: 55 },
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
                color: oklchToHex(w.word === "hapax" ? w.lightness : w.lightness * 0.65, w.chroma, w.hue),
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
