import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { z } from "zod/v4"
import { FontVariant } from "./schemas"

const CONTENT_DIR = path.join(process.cwd(), "src/content/words")

export const WordStatus = z.enum(["style-only", "draft", "published"])
export type WordStatus = z.infer<typeof WordStatus>

export const WordFrontmatter = z.object({
  word: z.string(),
  phonetic: z.string().optional(),
  status: WordStatus,
  style: FontVariant,
})
export type WordFrontmatter = z.infer<typeof WordFrontmatter>

export interface WordContent {
  frontmatter: WordFrontmatter
  content: string
}

export function getWordFilePath(word: string): string {
  return path.join(CONTENT_DIR, `${word.toLowerCase()}.mdx`)
}

export function wordExists(word: string): boolean {
  return fs.existsSync(getWordFilePath(word))
}

export function getWordContent(word: string): WordContent | null {
  const filepath = getWordFilePath(word)

  if (!fs.existsSync(filepath)) {
    return null
  }

  const fileContent = fs.readFileSync(filepath, "utf-8")
  const { data, content } = matter(fileContent)

  const parsed = WordFrontmatter.safeParse(data)
  if (!parsed.success) {
    console.error(`Invalid frontmatter for word "${word}":`, parsed.error)
    return null
  }

  return {
    frontmatter: parsed.data,
    content: content.trim(),
  }
}

export function getAllWords(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return []
  }

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(".mdx", ""))
}

export function getPublishedWords(): WordFrontmatter[] {
  const words = getAllWords()
  const published: WordFrontmatter[] = []

  for (const word of words) {
    const content = getWordContent(word)
    if (content && content.frontmatter.status === "published") {
      published.push(content.frontmatter)
    }
  }

  return published
}

export function getWordsByStatus(status: WordStatus): WordFrontmatter[] {
  const words = getAllWords()
  const result: WordFrontmatter[] = []

  for (const word of words) {
    const content = getWordContent(word)
    if (content && content.frontmatter.status === status) {
      result.push(content.frontmatter)
    }
  }

  return result
}
