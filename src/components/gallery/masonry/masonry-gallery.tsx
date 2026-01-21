"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { GalleryWordEntry } from "@/app/api/gallery/route"
import { MasonryWord } from "./masonry-word"

interface MasonryGalleryProps {
  colorMode?: "light" | "dark"
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function seededRandom(seed: number): number {
  const state = (seed * 1103515245 + 12345) & 0x7fffffff
  return state / 0x7fffffff
}

const FONT_SIZES = [
  "var(--text-gallery-sm)",
  "var(--text-gallery-md)",
  "var(--text-gallery-lg)",
  "var(--text-gallery-xl)",
]

function getFontSize(word: string): string {
  const hash = hashString(word)
  const random = seededRandom(hash)
  const index = Math.floor(random * FONT_SIZES.length)
  return FONT_SIZES[index]
}

export function MasonryGallery({ colorMode = "dark" }: MasonryGalleryProps) {
  const [words, setWords] = useState<GalleryWordEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAllWords = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/gallery?limit=500`)
      if (response.ok) {
        const data = await response.json()
        setWords(data.words)
      }
    } catch (error) {
      console.error("Failed to fetch gallery words:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllWords()
  }, [fetchAllWords])

  const shuffledWords = useMemo(() => {
    const sorted = [...words].sort((a, b) => a.normalized.localeCompare(b.normalized))
    const shuffled: GalleryWordEntry[] = []
    const groups: Record<string, GalleryWordEntry[]> = {}

    for (const word of sorted) {
      const letter = word.normalized.charAt(0).toLowerCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(word)
    }

    const letters = Object.keys(groups).sort()
    const maxLen = Math.max(...Object.values(groups).map(g => g.length))

    for (let i = 0; i < maxLen; i++) {
      for (const letter of letters) {
        if (groups[letter][i]) {
          shuffled.push(groups[letter][i])
        }
      }
    }

    return shuffled
  }, [words])

  if (words.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        No words yet. Run the seed script to populate the gallery.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 animate-pulse">
        Loading...
      </div>
    )
  }

  return (
    <div
      className="h-screen w-full overflow-y-auto overflow-x-hidden"
      style={{
        maskImage: "linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)",
      }}
    >
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-4 px-8 md:px-12 lg:px-16 py-16">
        {shuffledWords.map((entry) => (
          <MasonryWord
            key={entry.normalized}
            word={entry.word}
            variant={entry.variant}
            fontSize={getFontSize(entry.normalized)}
            colorMode={colorMode}
          />
        ))}
      </div>
    </div>
  )
}
