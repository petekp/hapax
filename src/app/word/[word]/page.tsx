import { notFound } from "next/navigation"
import { hasVettedStyle } from "@/lib/vetted-cache"
import WordPage from "./word-page"

interface PageProps {
  params: Promise<{ word: string }>
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
