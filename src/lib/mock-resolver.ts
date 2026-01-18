import type { FontVariant } from "./schemas"

const MOCK_FONTS: Record<string, FontVariant> = {
  fire: {
    family: "Bebas Neue",
    weight: 700,
    style: "normal",
    colorIntent: { hue: 15, chroma: 0.35, lightness: 55 },
  },
  ocean: {
    family: "Playfair Display",
    weight: 400,
    style: "italic",
    colorIntent: { hue: 210, chroma: 0.25, lightness: 50 },
  },
  whisper: {
    family: "Cormorant Garamond",
    weight: 300,
    style: "italic",
    colorIntent: { hue: 270, chroma: 0.08, lightness: 75 },
  },
  love: {
    family: "Dancing Script",
    weight: 500,
    style: "normal",
    colorIntent: { hue: 340, chroma: 0.28, lightness: 65 },
  },
  thunder: {
    family: "Anton",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 45, chroma: 0.32, lightness: 70 },
  },
  calm: {
    family: "Lora",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 180, chroma: 0.12, lightness: 65 },
  },
  wild: {
    family: "Permanent Marker",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 120, chroma: 0.28, lightness: 60 },
  },
  elegant: {
    family: "Cinzel",
    weight: 500,
    style: "normal",
    colorIntent: { hue: 280, chroma: 0.15, lightness: 70 },
  },
  strong: {
    family: "Oswald",
    weight: 700,
    style: "normal",
    colorIntent: { hue: 0, chroma: 0.22, lightness: 55 },
  },
  dream: {
    family: "Sacramento",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 260, chroma: 0.18, lightness: 75 },
  },
}

function generateRandomVariant(word: string): FontVariant {
  const hash = word.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

  const fonts = [
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Raleway",
    "Source Sans Pro",
    "Ubuntu",
  ]

  const weights = [300, 400, 500, 600, 700] as const

  return {
    family: fonts[hash % fonts.length],
    weight: weights[hash % weights.length],
    style: hash % 5 === 0 ? "italic" : "normal",
    colorIntent: {
      hue: hash % 360,
      chroma: 0.15 + (hash % 20) / 100,
      lightness: 55 + (hash % 30),
    },
  }
}

export async function mockResolver(word: string): Promise<{
  variant: FontVariant
  source: "cache" | "llm"
}> {
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400))

  const normalized = word.toLowerCase()
  const cached = MOCK_FONTS[normalized]

  if (cached) {
    return { variant: cached, source: "cache" }
  }

  return { variant: generateRandomVariant(normalized), source: "llm" }
}
