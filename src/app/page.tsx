import { HomeClient } from "./home-client"
import { getAllVettedWords } from "@/lib/vetted-cache"

export default function Home() {
  const wordCount = getAllVettedWords().length

  return (
    <>
      <header className="sr-only">
        <h1>Hapax — A Cabinet of Rare Words</h1>
        <p>
          Explore a curated collection of {wordCount} rare and unusual English words.
          Each word is styled with its own unique font and color palette, creating a
          visual gallery of linguistic curiosities. Discover words like liminal,
          petrichor, saudade, and many more obscure terms from across languages and eras.
        </p>
      </header>
      <HomeClient />
    </>
  )
}
