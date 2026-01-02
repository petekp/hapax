import type { FontVariant } from "./schemas"

const MOCK_FONTS: Record<string, FontVariant> = {
  fire: {
    family: "Bebas Neue",
    weight: 700,
    style: "normal",
    colorIntent: { hue: 15, saturation: 90 },
  },
  ocean: {
    family: "Playfair Display",
    weight: 400,
    style: "italic",
    colorIntent: { hue: 210, saturation: 80 },
  },
  whisper: {
    family: "Cormorant Garamond",
    weight: 300,
    style: "italic",
    colorIntent: { hue: 270, saturation: 20 },
  },
  love: {
    family: "Dancing Script",
    weight: 500,
    style: "normal",
    colorIntent: { hue: 340, saturation: 75 },
  },
  thunder: {
    family: "Anton",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 45, saturation: 85 },
  },
  calm: {
    family: "Lora",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 180, saturation: 30 },
  },
  wild: {
    family: "Permanent Marker",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 120, saturation: 70 },
  },
  elegant: {
    family: "Cinzel",
    weight: 500,
    style: "normal",
    colorIntent: { hue: 280, saturation: 40 },
  },
  strong: {
    family: "Oswald",
    weight: 700,
    style: "normal",
    colorIntent: { hue: 0, saturation: 60 },
  },
  dream: {
    family: "Sacramento",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 260, saturation: 50 },
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
      saturation: 40 + (hash % 50),
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
