import fs from "fs"
import path from "path"
import matter from "gray-matter"

const VETTED_STYLES_PATH = path.join(process.cwd(), "src/data/vetted-styles.json")
const CONTENT_DIR = path.join(process.cwd(), "src/content/words")

interface ColorIntent {
  hue: number
  chroma: number
  lightness: number
}

interface StyleEntry {
  family: string
  weight: number
  style: string
  colorIntent: ColorIntent
}

interface VettedStyles {
  version: number
  words: Record<string, StyleEntry>
}

interface HueRange {
  min: number
  max: number
  name: string
  targetMin: number
  targetMax: number
}

const HUE_RANGES: HueRange[] = [
  { min: 0, max: 29, name: "red/orange", targetMin: 6, targetMax: 7 },
  { min: 30, max: 59, name: "amber/gold", targetMin: 10, targetMax: 12 },
  { min: 60, max: 89, name: "yellow-green", targetMin: 5, targetMax: 7 },
  { min: 90, max: 119, name: "green", targetMin: 5, targetMax: 7 },
  { min: 120, max: 149, name: "green-teal", targetMin: 7, targetMax: 10 },
  { min: 150, max: 179, name: "cyan-green", targetMin: 7, targetMax: 10 },
  { min: 180, max: 209, name: "cyan/teal", targetMin: 10, targetMax: 12 },
  { min: 210, max: 239, name: "blue", targetMin: 12, targetMax: 15 },
  { min: 240, max: 269, name: "indigo", targetMin: 10, targetMax: 12 },
  { min: 270, max: 299, name: "violet/purple", targetMin: 12, targetMax: 15 },
  { min: 300, max: 329, name: "magenta/rose", targetMin: 7, targetMax: 10 },
  { min: 330, max: 359, name: "pink/red", targetMin: 5, targetMax: 7 },
]

const CHROMA_CEILING = 0.22
const CHROMA_EXCEPTIONS = new Set([
  "vermillion",
  "effulgent",
  "phosphorescent",
  "noctilucent",
  "coruscate",
  "incandescent",
  "surreptitious",
  "carbuncle",
  "caldera",
])

function getHueRange(hue: number): HueRange {
  return HUE_RANGES.find((r) => hue >= r.min && hue <= r.max) ?? HUE_RANGES[0]
}

function stylesMatch(a: StyleEntry, b: StyleEntry): boolean {
  return (
    a.family === b.family &&
    a.weight === b.weight &&
    a.style === b.style &&
    a.colorIntent.hue === b.colorIntent.hue &&
    a.colorIntent.chroma === b.colorIntent.chroma &&
    a.colorIntent.lightness === b.colorIntent.lightness
  )
}

async function lint() {
  const errors: string[] = []
  const warnings: string[] = []

  if (!fs.existsSync(VETTED_STYLES_PATH)) {
    console.error("vetted-styles.json not found:", VETTED_STYLES_PATH)
    process.exit(1)
  }

  const data = JSON.parse(
    fs.readFileSync(VETTED_STYLES_PATH, "utf-8")
  ) as VettedStyles

  const wordCount = Object.keys(data.words).length

  console.log(`Linting ${wordCount} words...\n`)

  const jsonWords = new Map<string, StyleEntry>()
  for (const [word, style] of Object.entries(data.words)) {
    jsonWords.set(word.toLowerCase(), style)
  }

  const mdxFiles = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))

  for (const file of mdxFiles) {
    const word = file.replace(".mdx", "")
    const filepath = path.join(CONTENT_DIR, file)
    const content = fs.readFileSync(filepath, "utf-8")
    const { data: frontmatter } = matter(content)

    if (!frontmatter.style) {
      errors.push(`${word}: MDX missing style frontmatter`)
      continue
    }

    const jsonStyle = jsonWords.get(word)
    if (!jsonStyle) {
      warnings.push(`${word}: In MDX but not in vetted-styles.json`)
      continue
    }

    const mdxStyle = frontmatter.style as StyleEntry
    if (!stylesMatch(jsonStyle, mdxStyle)) {
      errors.push(`${word}: Style mismatch between JSON and MDX`)
    }
  }

  for (const word of jsonWords.keys()) {
    const filepath = path.join(CONTENT_DIR, `${word}.mdx`)
    if (!fs.existsSync(filepath)) {
      errors.push(`${word}: In JSON but no MDX file exists`)
    }
  }

  const hueDistribution = new Map<string, string[]>()
  for (const range of HUE_RANGES) {
    hueDistribution.set(range.name, [])
  }

  for (const [word, style] of Object.entries(data.words)) {
    const range = getHueRange(style.colorIntent.hue)
    hueDistribution.get(range.name)?.push(word)
  }

  console.log("=== Hue Distribution ===")
  for (const range of HUE_RANGES) {
    const words = hueDistribution.get(range.name) ?? []
    const count = words.length
    const pct = ((count / wordCount) * 100).toFixed(1)
    const targetPct = `${range.targetMin}-${range.targetMax}%`
    const status =
      count / wordCount > range.targetMax / 100
        ? "⚠️  HIGH"
        : count / wordCount < range.targetMin / 100
          ? "⚠️  LOW"
          : "✓"

    console.log(
      `${range.min.toString().padStart(3)}-${range.max}° ${range.name.padEnd(14)} ${count.toString().padStart(3)} (${pct.padStart(5)}%) target: ${targetPct.padStart(7)} ${status}`
    )
  }

  console.log("\n=== Chroma Analysis ===")
  const highChroma: Array<{ word: string; chroma: number }> = []
  for (const [word, style] of Object.entries(data.words)) {
    if (style.colorIntent.chroma > CHROMA_CEILING) {
      highChroma.push({ word, chroma: style.colorIntent.chroma })
    }
  }

  if (highChroma.length > 0) {
    console.log(`Words exceeding chroma ceiling (${CHROMA_CEILING}):`)
    for (const { word, chroma } of highChroma.sort((a, b) => b.chroma - a.chroma)) {
      const isException = CHROMA_EXCEPTIONS.has(word.toLowerCase())
      const status = isException ? "(exception)" : "⚠️"
      console.log(`  ${word}: ${chroma} ${status}`)

      if (!isException) {
        warnings.push(`${word}: Chroma ${chroma} exceeds ceiling ${CHROMA_CEILING}`)
      }
    }
  } else {
    console.log(`All words within chroma ceiling (${CHROMA_CEILING})`)
  }

  console.log("")
  if (errors.length > 0) {
    console.log("=== Errors ===")
    for (const err of errors) {
      console.log(`  ❌ ${err}`)
    }
  }

  if (warnings.length > 0) {
    console.log("\n=== Warnings ===")
    for (const warn of warnings) {
      console.log(`  ⚠️  ${warn}`)
    }
  }

  console.log("\n=== Summary ===")
  console.log(`Errors:   ${errors.length}`)
  console.log(`Warnings: ${warnings.length}`)

  if (errors.length > 0) {
    process.exit(1)
  }
}

lint().catch(console.error)
