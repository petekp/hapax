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

function updateMdxFrontmatter(filepath: string, style: StyleEntry): void {
  const content = fs.readFileSync(filepath, "utf-8")
  const { data, content: body } = matter(content)

  data.style = {
    family: style.family,
    weight: style.weight,
    style: style.style,
    colorIntent: {
      hue: style.colorIntent.hue,
      chroma: style.colorIntent.chroma,
      lightness: style.colorIntent.lightness,
    },
  }

  const updated = matter.stringify(body, data)
  fs.writeFileSync(filepath, updated)
}

async function sync() {
  const dryRun = process.argv.includes("--dry-run")

  if (!fs.existsSync(VETTED_STYLES_PATH)) {
    console.error("vetted-styles.json not found:", VETTED_STYLES_PATH)
    process.exit(1)
  }

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error("Content directory not found:", CONTENT_DIR)
    process.exit(1)
  }

  const data = JSON.parse(
    fs.readFileSync(VETTED_STYLES_PATH, "utf-8")
  ) as VettedStyles

  let updated = 0
  let inSync = 0
  const missingMdx: string[] = []
  const missingJson: string[] = []

  const jsonWords = new Set(Object.keys(data.words).map((w) => w.toLowerCase()))
  const mdxFiles = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))

  for (const file of mdxFiles) {
    const word = file.replace(".mdx", "")
    if (!jsonWords.has(word)) {
      missingJson.push(word)
    }
  }

  for (const [word, style] of Object.entries(data.words)) {
    const filename = `${word.toLowerCase()}.mdx`
    const filepath = path.join(CONTENT_DIR, filename)

    if (!fs.existsSync(filepath)) {
      missingMdx.push(word)
      continue
    }

    const content = fs.readFileSync(filepath, "utf-8")
    const { data: frontmatter } = matter(content)
    const mdxStyle = frontmatter.style as StyleEntry | undefined

    if (!mdxStyle || !stylesMatch(style, mdxStyle)) {
      if (dryRun) {
        console.log(`Would update: ${word}`)
        if (mdxStyle) {
          console.log(`  JSON: hue=${style.colorIntent.hue}, chroma=${style.colorIntent.chroma}`)
          console.log(`  MDX:  hue=${mdxStyle.colorIntent.hue}, chroma=${mdxStyle.colorIntent.chroma}`)
        } else {
          console.log(`  MDX has no style`)
        }
      } else {
        updateMdxFrontmatter(filepath, style)
        console.log(`Updated: ${word}`)
      }
      updated++
    } else {
      inSync++
    }
  }

  console.log("")
  console.log("=== Sync Summary ===")
  console.log(`In sync:     ${inSync}`)
  console.log(`${dryRun ? "Would update" : "Updated"}:     ${updated}`)

  if (missingMdx.length > 0) {
    console.log(`Missing MDX: ${missingMdx.length}`)
    console.log(`  Words: ${missingMdx.slice(0, 10).join(", ")}${missingMdx.length > 10 ? "..." : ""}`)
  }

  if (missingJson.length > 0) {
    console.log(`In MDX but not JSON: ${missingJson.length}`)
    console.log(`  Words: ${missingJson.slice(0, 10).join(", ")}${missingJson.length > 10 ? "..." : ""}`)
  }

  if (dryRun && updated > 0) {
    console.log("\nRun without --dry-run to apply changes.")
  }
}

sync().catch(console.error)
