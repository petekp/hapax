import fs from "fs"
import path from "path"
import { MetadataRoute } from "next"
import { getAllVettedWords } from "@/lib/vetted-cache"

const CONTENT_DIR = path.join(process.cwd(), "src/content/words")
const VETTED_STYLES_PATH = path.join(process.cwd(), "src/data/vetted-styles.json")

function getWordModifiedDate(word: string): Date {
  const filepath = path.join(CONTENT_DIR, `${word.toLowerCase()}.mdx`)
  try {
    const stats = fs.statSync(filepath)
    return stats.mtime
  } catch {
    return getVettedStylesModifiedDate()
  }
}

function getVettedStylesModifiedDate(): Date {
  try {
    const stats = fs.statSync(VETTED_STYLES_PATH)
    return stats.mtime
  } catch {
    return new Date("2024-01-01")
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hapax.ink"
  const words = getAllVettedWords()
  const vettedStylesModified = getVettedStylesModifiedDate()

  const wordPages = words.map((word) => ({
    url: `${baseUrl}/word/${encodeURIComponent(word)}`,
    lastModified: getWordModifiedDate(word),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: vettedStylesModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2024-06-01"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...wordPages,
  ]
}
