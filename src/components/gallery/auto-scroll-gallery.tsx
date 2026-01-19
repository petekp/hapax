"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { GalleryWord } from "./gallery-word"
import type { GalleryWordEntry } from "@/app/api/gallery/route"

interface AutoScrollGalleryProps {
  colorMode?: "light" | "dark"
}

interface ScrollingRowProps {
  words: GalleryWordEntry[]
  speed: number
  direction: "left" | "right"
  colorMode: "light" | "dark"
}

function ScrollingRow({ words, speed, direction, colorMode }: ScrollingRowProps) {
  const [isPaused, setIsPaused] = useState(false)

  if (words.length === 0) return null

  return (
    <div
      className="-my-2 overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex items-baseline whitespace-nowrap"
        style={{
          fontSize: "clamp(3rem, 8vw, 6rem)",
          animationName: direction === "left" ? "marquee-left" : "marquee-right",
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationDuration: `${speed}s`,
          animationPlayState: isPaused ? "paused" : "running",
        }}
      >
        {[0, 1].map((setIndex) => (
          <div
            key={setIndex}
            className="flex items-baseline gap-[0.4em] px-[0.2em]"
            style={{ flexShrink: 0 }}
          >
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
    </div>
  )
}

const ALPHABET_RANGES = [
  ["a", "b"],
  ["c", "d"],
  ["e", "f"],
  ["g", "i"],
  ["j", "m"],
  ["n", "p"],
  ["q", "s"],
  ["t", "z"],
] as const

export function AutoScrollGallery({ colorMode = "dark" }: AutoScrollGalleryProps) {
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

  const rows = useMemo(() => {
    if (words.length === 0) return []

    const result: GalleryWordEntry[][] = []

    for (const [start, end] of ALPHABET_RANGES) {
      const rangeWords = words.filter((w) => {
        const firstChar = w.normalized.charAt(0).toLowerCase()
        return firstChar >= start && firstChar <= end
      })

      if (rangeWords.length > 0) {
        result.push(rangeWords)
      }
    }

    return result
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

  const speeds = [45, 55, 40, 50, 48, 52, 38, 58]
  const directions: Array<"left" | "right"> = ["left", "right", "left", "right", "right", "left", "right", "left"]

  return (
    <div
      className="h-screen w-full flex flex-col justify-around py-8"
      style={{
        maskImage: "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent), linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent), linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    >
      {rows.map((rowWords, index) => (
        <ScrollingRow
          key={index}
          words={rowWords}
          speed={speeds[index % speeds.length]}
          direction={directions[index % directions.length]}
          colorMode={colorMode}
        />
      ))}
    </div>
  )
}
