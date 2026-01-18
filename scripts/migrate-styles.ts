import fs from "fs"
import path from "path"

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

function generateMdx(word: string, style: StyleEntry): string {
  return `---
word: ${word}
status: style-only
style:
  family: ${style.family}
  weight: ${style.weight}
  style: ${style.style}
  colorIntent:
    hue: ${style.colorIntent.hue}
    chroma: ${style.colorIntent.chroma}
    lightness: ${style.colorIntent.lightness}
---
`
}

async function migrate() {
  const data = JSON.parse(fs.readFileSync(VETTED_STYLES_PATH, "utf-8")) as VettedStyles

  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true })
  }

  const words = Object.entries(data.words)
  console.log(`Migrating ${words.length} words...`)

  let created = 0
  let skipped = 0

  for (const [word, style] of words) {
    const filename = `${word.toLowerCase()}.mdx`
    const filepath = path.join(CONTENT_DIR, filename)

    if (fs.existsSync(filepath)) {
      skipped++
      continue
    }

    const content = generateMdx(word, style)
    fs.writeFileSync(filepath, content)
    created++
  }

  console.log(`Done. Created ${created} files, skipped ${skipped} existing.`)
}

migrate().catch(console.error)
