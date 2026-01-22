import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { hasVettedStyle } from "@/lib/vetted-cache"
import { getWordContent } from "@/lib/words"
import WordPage from "./word-page"

interface PageProps {
  params: Promise<{ word: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { word } = await params
  const decodedWord = decodeURIComponent(word).toLowerCase()
  const content = getWordContent(decodedWord)

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  if (!content) {
    return {
      title: `${capitalize(decodedWord)} - Hapax`,
    }
  }

  const { frontmatter, content: definition } = content
  const displayWord = capitalize(frontmatter.word)
  const firstSentence = definition.split(/[.!?]/)[0]?.trim() || ""
  const description = firstSentence.length > 160
    ? firstSentence.slice(0, 157) + "..."
    : firstSentence

  return {
    title: `${displayWord} - Hapax`,
    description: description || `Discover the rare word "${displayWord}"`,
    openGraph: {
      title: displayWord,
      description,
      type: "article",
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { word } = await params
  const decodedWord = decodeURIComponent(word).toLowerCase()

  // Only allow vetted words in production
  if (process.env.NODE_ENV === "production" && !hasVettedStyle(decodedWord)) {
    notFound()
  }

  // In development, allow any word for testing
  // In production, we've already verified the word is vetted
  return <WordPage params={params} />
}
