"use client"

import { useState, useEffect, useRef } from "react"
import type { FontVariant } from "@/lib/schemas"
import { GalleryWord } from "./gallery-word"

interface LazyGalleryWordProps {
  word: string
  variant: FontVariant
  colorMode?: "light" | "dark"
}

export function LazyGalleryWord({ word, variant, colorMode = "dark" }: LazyGalleryWordProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before visible
        threshold: 0
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  if (!isVisible) {
    return (
      <span
        ref={ref}
        className="text-zinc-700"
        style={{ fontFamily: "inherit" }}
      >
        {word}
      </span>
    )
  }

  return <GalleryWord word={word} variant={variant} colorMode={colorMode} />
}
