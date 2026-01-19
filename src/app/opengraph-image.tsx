import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const alt = "Hapax - A collection of rare words"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

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

export default async function Image() {
  const brandFontData = await fetchGoogleFont("IM Fell DW Pica", 400, "hapax.ink", "italic")

  const fonts: Array<{
    name: string
    data: ArrayBuffer
    style: "normal" | "italic"
    weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  }> = []

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
        backgroundColor: "#09090b",
        padding: "60px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: "180px",
          fontFamily: brandFontData ? "IM Fell DW Pica" : "Georgia",
          fontStyle: "italic",
          fontWeight: 400,
          color: "#e4e4e7",
        }}
      >
        hapax.ink
      </div>

      <div
        style={{
          display: "flex",
          fontSize: "36px",
          fontFamily: "system-ui",
          fontWeight: 400,
          color: "#71717a",
          marginTop: "24px",
        }}
      >
        a collection of rare words
      </div>
    </div>,
    {
      ...size,
      fonts,
    }
  )
}
