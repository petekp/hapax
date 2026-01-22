import { MetadataRoute } from "next"
import { getAllVettedWords } from "@/lib/vetted-cache"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hapax.app"
  const words = getAllVettedWords()

  const wordPages = words.map((word) => ({
    url: `${baseUrl}/word/${encodeURIComponent(word)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...wordPages,
  ]
}
