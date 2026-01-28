import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { hasVettedStyle } from "@/lib/vetted-cache"
import { getWordContent } from "@/lib/words"
import WordPage from "./word-page"

interface PageProps {
  params: Promise<{ word: string }>
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { word } = await params
  const decodedWord = decodeURIComponent(word).toLowerCase()
  const content = getWordContent(decodedWord)

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

function generateDefinedTermSchema(word: string, description: string, pronunciation?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: word,
    description,
    ...(pronunciation && { termCode: pronunciation }),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Hapax — A Cabinet of Rare Words",
      url: "https://hapax.ink",
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { word } = await params
  const decodedWord = decodeURIComponent(word).toLowerCase()

  if (process.env.NODE_ENV === "production" && !hasVettedStyle(decodedWord)) {
    notFound()
  }

  const wordContent = getWordContent(decodedWord)

  const firstSentence = wordContent?.content.split(/[.!?]/)[0]?.trim() || ""
  const description = firstSentence || `Definition of ${decodedWord}`
  const phonetic = wordContent?.frontmatter.phonetic

  const jsonLd = generateDefinedTermSchema(decodedWord, description, phonetic)

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD from trusted server-side data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WordPage word={decodedWord} initialContent={wordContent} />
    </>
  )
}
