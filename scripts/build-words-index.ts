import fs from "fs"
import path from "path"
import matter from "gray-matter"

const CONTENT_DIR = path.join(process.cwd(), "src/content/words")
const OUTPUT_PATH = path.join(process.cwd(), "src/generated/words-index.json")

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

interface WordsIndex {
  version: number
  generatedAt: string
  words: Record<string, StyleEntry>
}

function buildIndex() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error("Content directory not found:", CONTENT_DIR)
    process.exit(1)
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"))
  console.log(`Processing ${files.length} word files...`)

  const words: Record<string, StyleEntry> = {}
  let included = 0
  let skipped = 0

  for (const file of files) {
    const filepath = path.join(CONTENT_DIR, file)
    const content = fs.readFileSync(filepath, "utf-8")
    const { data } = matter(content)

    const word = data.word as string
    const style = data.style as StyleEntry

    if (!word || !style) {
      console.warn(`Skipping ${file}: missing word or style`)
      skipped++
      continue
    }

    words[word] = {
      family: style.family,
      weight: style.weight,
      style: style.style,
      colorIntent: style.colorIntent,
    }
    included++
  }

  const index: WordsIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    words,
  }

  const outputDir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2))
  console.log(`Done. Included ${included} words, skipped ${skipped} drafts.`)
  console.log(`Output: ${OUTPUT_PATH}`)
}

buildIndex()
