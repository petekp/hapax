"use client"

import { useEffect, useMemo, useRef } from "react"
import useSWR from "swr"
import type { GalleryResponse } from "@/app/api/gallery/route"
import { hashString, seededRandom } from "@/lib/hash"
import { orderByComplementaryHues } from "@/lib/color-ordering"
import { MasonryWord } from "./masonry-word"
import { MouseProvider } from "./mouse-context"
import { useTuning } from "./tuning-context"

interface MasonryGalleryProps {
  colorMode?: "light" | "dark"
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

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function MasonryGalleryInner({ colorMode = "dark" }: MasonryGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const tuning = useTuning()

  const { data, isLoading } = useSWR<GalleryResponse>(
    "/api/gallery?limit=500",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  const words = useMemo(() => data?.words ?? [], [data?.words])

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

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastSavedPosition = 0

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      if (scrollTop > 0 && Math.abs(scrollTop - lastSavedPosition) > 50) {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          sessionStorage.setItem(SCROLL_KEY, String(scrollTop))
          lastSavedPosition = scrollTop
        }, 150)
      }
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      container.removeEventListener("scroll", handleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isLoading])

  const orderedWords = useMemo(() => {
    if (words.length === 0) return []
    return orderByComplementaryHues(words)
  }, [words])

  if (words.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        No words yet. Run the seed script to populate the gallery.
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
          {orderedWords.map((entry, index) => (
            <MasonryWord
              key={entry.normalized}
              word={entry.word}
              variant={entry.variant}
              fontSize={getFontSize(entry.normalized)}
              colorMode={colorMode}
              parallaxDepth={getParallaxDepth(entry.normalized, tuning.parallaxDepthMin, tuning.parallaxDepthMax)}
              tuning={tuning}
              index={index}
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
