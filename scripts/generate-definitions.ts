import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"

const CONTENT_DIR = path.join(process.cwd(), "src/content/words")

interface WordFrontmatter {
  word: string
  phonetic?: string
  status: string
  style: {
    family: string
    weight: number
    style: string
    colorIntent: {
      hue: number
      chroma: number
      lightness: number
    }
  }
}

const PROMPT_TEMPLATE = `Generate content for the rare/interesting word "{word}".

Provide:
1. A phonetic pronunciation (IPA format, e.g., /ɪˈfem(ə)rəl/)
2. One or more definitions organized by part of speech
3. For each definition, include an evocative example sentence in italics
4. A brief etymology (origin language, literal meaning, when first used in English if known)
5. 2-4 related words

Format your response as Markdown suitable for an MDX file. Use this structure:

## [part of speech]

[Definition text.]

> *[Example sentence using the word in context.]*

## Etymology

[Brief etymology paragraph.]

## Related Words

- [related word 1]
- [related word 2]
- [related word 3]

Keep definitions concise but thoughtful. The example sentences should be evocative and demonstrate the word's meaning in context.`

async function generateDefinition(word: string): Promise<{ phonetic: string; content: string } | null> {
  try {
    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt: PROMPT_TEMPLATE.replace("{word}", word),
    })

    const text = result.text.trim()

    // Try to extract phonetic from the response
    const phoneticMatch = text.match(/\/[^/]+\//)
    const phonetic = phoneticMatch ? phoneticMatch[0] : ""

    // Remove phonetic from content if it appears at the start
    let content = text
    if (phonetic && content.startsWith(phonetic)) {
      content = content.slice(phonetic.length).trim()
    }

    return { phonetic, content }
  } catch (error) {
    console.error(`Error generating definition for "${word}":`, error)
    return null
  }
}

function getStyleOnlyWords(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return []
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"))
  const styleOnlyWords: string[] = []

  for (const file of files) {
    const filepath = path.join(CONTENT_DIR, file)
    const content = fs.readFileSync(filepath, "utf-8")
    const { data } = matter(content)

    if (data.status === "style-only") {
      styleOnlyWords.push(data.word)
    }
  }

  return styleOnlyWords
}

function updateWordFile(word: string, phonetic: string, content: string): void {
  const filepath = path.join(CONTENT_DIR, `${word.toLowerCase()}.mdx`)
  const fileContent = fs.readFileSync(filepath, "utf-8")
  const { data } = matter(fileContent)

  const frontmatter = data as WordFrontmatter
  frontmatter.status = "draft"
  if (phonetic) {
    frontmatter.phonetic = phonetic
  }

  const newFileContent = matter.stringify(content, frontmatter)
  fs.writeFileSync(filepath, newFileContent)
}

async function main() {
  const args = process.argv.slice(2)
  const limitArg = args.find((a) => a.startsWith("--limit="))
  const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 5
  const dryRun = args.includes("--dry-run")

  const styleOnlyWords = getStyleOnlyWords()
  console.log(`Found ${styleOnlyWords.length} words with status: style-only`)

  const wordsToProcess = styleOnlyWords.slice(0, limit)
  console.log(`Processing ${wordsToProcess.length} words${dryRun ? " (dry run)" : ""}...`)

  for (const word of wordsToProcess) {
    console.log(`\nGenerating definition for "${word}"...`)

    if (dryRun) {
      console.log("  [dry run - skipping API call]")
      continue
    }

    const result = await generateDefinition(word)
    if (!result) {
      console.log("  Failed to generate definition")
      continue
    }

    console.log(`  Generated ${result.content.length} chars of content`)
    if (result.phonetic) {
      console.log(`  Phonetic: ${result.phonetic}`)
    }

    updateWordFile(word, result.phonetic, result.content)
    console.log("  Updated file with status: draft")

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  console.log("\nDone!")
}

main().catch(console.error)
