"use client"

import { useEffect, useState } from "react"
import type { GalleryWordEntry } from "@/app/api/gallery/route"
import { LazyGalleryWord } from "@/components/gallery"

export default function DebugPage() {
  const [words, setWords] = useState<GalleryWordEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAllWords() {
      try {
        let allWords: GalleryWordEntry[] = []
        let cursor: string | null = "0"

        while (cursor !== null) {
          const res: Response = await fetch(`/api/gallery?limit=100&cursor=${cursor}`)
          if (!res.ok) break
          const data: { words: GalleryWordEntry[]; cursor: string | null } = await res.json()
          allWords = [...allWords, ...data.words]
          cursor = data.cursor
        }

        setWords(allWords)
      } catch (error) {
        console.error("Failed to fetch words:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAllWords()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-light mb-2">Word Gallery Debug</h1>
        <p className="text-zinc-400">
          Total words: <span className="text-white font-mono">{words.length}</span>
        </p>
      </header>

      {isLoading ? (
        <p className="text-zinc-500 animate-pulse">Loading...</p>
      ) : (
        <div className="space-y-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="py-2 px-4 text-zinc-500 font-normal">#</th>
                <th className="py-2 px-4 text-zinc-500 font-normal">Word</th>
                <th className="py-2 px-4 text-zinc-500 font-normal">Font</th>
                <th className="py-2 px-4 text-zinc-500 font-normal">Weight</th>
                <th className="py-2 px-4 text-zinc-500 font-normal">Color</th>
              </tr>
            </thead>
            <tbody>
              {words.map((entry, index) => (
                <tr key={entry.normalized} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                  <td className="py-3 px-4 text-zinc-600 font-mono text-sm">{index + 1}</td>
                  <td className="py-3 px-4 text-2xl">
                    <LazyGalleryWord
                      word={entry.word}
                      variant={entry.variant}
                      colorMode="dark"
                    />
                  </td>
                  <td className="py-3 px-4 text-zinc-400 text-sm">{entry.variant.family}</td>
                  <td className="py-3 px-4 text-zinc-400 text-sm">{entry.variant.weight}</td>
                  <td className="py-3 px-4 text-zinc-400 text-sm font-mono">
                    H:{entry.variant.colorIntent.hue} C:{entry.variant.colorIntent.chroma.toFixed(2)} L:{entry.variant.colorIntent.lightness}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
