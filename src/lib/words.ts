import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { z } from "zod/v4"
import { FontVariant } from "./schemas"
import { extractRelatedWords } from "./markdown"
import { getVettedStyle } from "./vetted-cache"
import fontDesigners from "@/data/font-designers.json"

const CONTENT_DIR = path.join(process.cwd(), "src/content/words")

export const WordStatus = z.enum(["style-only", "draft", "published"])
export type WordStatus = z.infer<typeof WordStatus>

export const PartOfSpeech = z.enum(["noun", "verb", "adjective", "adverb", "preposition", "conjunction", "interjection", "pronoun", "determiner", "exclamation"])
export type PartOfSpeech = z.infer<typeof PartOfSpeech>

export const WordFrontmatter = z.object({
  word: z.string(),
  phonetic: z.string().optional(),
  partOfSpeech: PartOfSpeech.optional(),
  status: WordStatus,
  style: FontVariant,
  // Curator's note on why this typeface and color, shown in the colophon
  note: z.string().optional(),
})
export type WordFrontmatter = z.infer<typeof WordFrontmatter>

export interface WordContent {
  frontmatter: WordFrontmatter
  content: string
  // Styles of the related words that are in the collection, keyed by lowercase word
  relatedStyles: Record<string, FontVariant>
  // Who designed the word's typeface, from Google Fonts metadata
  designer: string | null
}

function getRelatedStyles(content: string): Record<string, FontVariant> {
  const styles: Record<string, FontVariant> = {}
  for (const word of extractRelatedWords(content)) {
    const style = getVettedStyle(word)
    if (style) styles[word.toLowerCase()] = style
  }
  return styles
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
    relatedStyles: getRelatedStyles(content),
    designer: (fontDesigners as Record<string, string>)[parsed.data.style.family] ?? null,
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
