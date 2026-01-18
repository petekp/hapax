"use client"

import { useState, useCallback, useEffect } from "react"
import { GalleryWord } from "./gallery-word"
import type { GalleryWordEntry } from "@/app/api/gallery/route"

interface AutoScrollGalleryProps {
  colorMode?: "light" | "dark"
}

interface ScrollingRowProps {
  words: GalleryWordEntry[]
  duration: number
  direction: "left" | "right"
  colorMode: "light" | "dark"
}

function ScrollingRow({ words, duration, direction, colorMode }: ScrollingRowProps) {
  const [isPaused, setIsPaused] = useState(false)

  if (words.length === 0) return null

  const animationName = direction === "left" ? "scroll-left" : "scroll-right"

  return (
    <div
      className="overflow-hidden py-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex items-baseline whitespace-nowrap"
        style={{
          fontSize: "clamp(3rem, 8vw, 6rem)",
          animation: `${animationName} ${duration}s linear infinite`,
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {[0, 1].map((setIndex) => (
          <div key={setIndex} className="flex items-baseline gap-[0.4em] px-[0.2em]">
            {words.map((entry, index) => (
              <GalleryWord
                key={`${entry.normalized}-${index}-${setIndex}`}
                word={entry.word}
                variant={entry.variant}
                colorMode={colorMode}
              />
            ))}
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

export function AutoScrollGallery({ colorMode = "dark" }: AutoScrollGalleryProps) {
  const [words, setWords] = useState<GalleryWordEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAllWords = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/gallery?limit=100`)
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

  const rowCount = 4
  const minWordsPerRow = 8
  const rows: GalleryWordEntry[][] = []

  for (let i = 0; i < rowCount; i++) {
    const rowWords: GalleryWordEntry[] = []
    let wordIndex = i
    while (rowWords.length < minWordsPerRow) {
      rowWords.push(words[wordIndex % words.length])
      wordIndex += rowCount
    }
    rows.push(rowWords)
  }

  const durations = [60, 75, 55, 70]
  const directions: Array<"left" | "right"> = ["left", "right", "left", "right"]

  return (
    <div
      className="h-full flex flex-col justify-center gap-2 overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
      }}
    >
      {rows.map((rowWords, index) => (
        <ScrollingRow
          key={index}
          words={rowWords}
          duration={durations[index % durations.length]}
          direction={directions[index % directions.length]}
          colorMode={colorMode}
        />
      ))}
    </div>
  )
}
