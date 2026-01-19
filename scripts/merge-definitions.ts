import fs from "fs"
import path from "path"
import matter from "gray-matter"

const CONTENT_DIR = path.join(process.cwd(), "src/content/words")
const INPUT_FILE = process.argv[2] || path.join(process.cwd(), "temp-definitions.md")

interface ParsedDefinition {
  filename: string
  word: string
  phonetic?: string
  content: string
}

function parseDefinitionsFile(filepath: string): ParsedDefinition[] {
  const raw = fs.readFileSync(filepath, "utf-8")
  const definitions: ParsedDefinition[] = []

  // Split by code block markers, looking for ```filename.mdx patterns
  const blocks = raw.split(/```(\S+\.mdx)\n/)

  for (let i = 1; i < blocks.length; i += 2) {
    const filename = blocks[i]
    const blockContent = blocks[i + 1]

    if (!blockContent) continue

    // Remove trailing ``` and any extra whitespace
    const cleanContent = blockContent.replace(/```\s*$/, "").trim()

    // Parse the frontmatter and content
    const { data, content } = matter(cleanContent)

    definitions.push({
      filename,
      word: data.word,
      phonetic: data.phonetic,
      content: content.trim(),
    })
  }

  return definitions
}

function mergeDefinition(def: ParsedDefinition): { success: boolean; message: string } {
  const existingPath = path.join(CONTENT_DIR, def.filename)

  if (!fs.existsSync(existingPath)) {
    return { success: false, message: `File not found: ${def.filename}` }
  }

  const existingContent = fs.readFileSync(existingPath, "utf-8")
  const { data: existingData } = matter(existingContent)

  // Build merged frontmatter
  const mergedFrontmatter: Record<string, unknown> = {
    word: def.word,
  }

  if (def.phonetic) {
    mergedFrontmatter.phonetic = def.phonetic
  }

  mergedFrontmatter.status = "draft"

  // Preserve the style block from the existing file
  if (existingData.style) {
    mergedFrontmatter.style = existingData.style
  }

  // Write merged file
  const newFileContent = matter.stringify(def.content, mergedFrontmatter)
  fs.writeFileSync(existingPath, newFileContent)

  return { success: true, message: `Merged: ${def.filename}` }
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Input file not found: ${INPUT_FILE}`)
    process.exit(1)
  }

  console.log(`Reading definitions from: ${INPUT_FILE}`)
  const definitions = parseDefinitionsFile(INPUT_FILE)
  console.log(`Found ${definitions.length} definitions\n`)

  let merged = 0
  let failed = 0

  for (const def of definitions) {
    const result = mergeDefinition(def)
    console.log(result.message)
    if (result.success) {
      merged++
    } else {
      failed++
    }
  }

  console.log(`\nDone. Merged: ${merged}, Failed: ${failed}`)
}

main()
