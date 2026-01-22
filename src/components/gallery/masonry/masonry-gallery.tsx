"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { GalleryWordEntry } from "@/app/api/gallery/route"
import { MasonryWord } from "./masonry-word"
import { MouseProvider } from "./mouse-context"
import { useTuning } from "./tuning-context"

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

function getParallaxDepth(word: string, min: number, max: number): number {
  const hash = hashString(word + "depth")
  const random = seededRandom(hash)
  return min + random * (max - min)
}

const SCROLL_KEY = "gallery-scroll-position"

function MasonryGalleryInner({ colorMode = "dark" }: MasonryGalleryProps) {
  const [words, setWords] = useState<GalleryWordEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const tuning = useTuning()
  const [{ skipEntrance, visitedWord }] = useState(() => {
    if (typeof window === "undefined") return { skipEntrance: false, visitedWord: null as string | null }
    const wasOnWordPage = sessionStorage.getItem("navigated-to-word") === "true"
    const visited = sessionStorage.getItem("visited-word")
    sessionStorage.removeItem("navigated-to-word")
    sessionStorage.removeItem("visited-word")
    return { skipEntrance: wasOnWordPage, visitedWord: wasOnWordPage ? visited : null }
  })

  useEffect(() => {
    if (isLoading || words.length === 0) return

    const savedPosition = sessionStorage.getItem(SCROLL_KEY)
    if (!savedPosition || !scrollRef.current) return

    const targetScroll = parseInt(savedPosition, 10)
    if (targetScroll === 0) return

    let attempts = 0
    const maxAttempts = 20

    const tryRestore = () => {
      const container = scrollRef.current
      if (!container) return

      if (container.scrollHeight > container.clientHeight && container.scrollHeight >= targetScroll) {
        container.scrollTop = targetScroll
        return
      }

      attempts++
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryRestore)
      }
    }

    requestAnimationFrame(tryRestore)
  }, [isLoading, words.length])

  useEffect(() => {
    const container = scrollRef.current
    if (!container || isLoading) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      if (scrollTop > 0) {
        sessionStorage.setItem(SCROLL_KEY, String(scrollTop))
      }
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [isLoading])

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

  const maskImage = `linear-gradient(to bottom, transparent, black ${tuning.maskFadeStart}%, black ${tuning.maskFadeEnd}%, transparent)`

  return (
    <MouseProvider>
      <div
        ref={scrollRef}
        className="h-screen w-full overflow-y-auto overflow-x-hidden"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      >
        <main
          role="main"
          aria-label="Gallery of rare words"
          className="flex flex-wrap justify-center items-baseline"
          style={{
            gap: `${tuning.gapY}px ${tuning.gapX}px`,
            padding: `${tuning.paddingY}px ${tuning.paddingX}px`,
          }}
        >
          {shuffledWords.map((entry, index) => (
            <MasonryWord
              key={entry.normalized}
              word={entry.word}
              variant={entry.variant}
              fontSize={getFontSize(entry.normalized)}
              colorMode={colorMode}
              parallaxDepth={getParallaxDepth(entry.normalized, tuning.parallaxDepthMin, tuning.parallaxDepthMax)}
              tuning={tuning}
              index={index}
              skipEntrance={skipEntrance}
              isReturningWord={visitedWord === entry.word.toLowerCase()}
            />
          ))}
        </main>
      </div>
    </MouseProvider>
  )
}

export function MasonryGallery({ colorMode = "dark" }: MasonryGalleryProps) {
  return <MasonryGalleryInner colorMode={colorMode} />
}
