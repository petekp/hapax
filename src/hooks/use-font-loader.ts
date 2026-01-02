"use client"

import { useEffect, useRef, useCallback } from "react"
import type { WordState, FontVariant } from "@/lib/schemas"
import { getFontLoader } from "@/lib/font-loader"

interface UseFontLoaderOptions {
  words: WordState[]
  onFontLoaded: (wordId: string) => void
}

export function useFontLoader({ words, onFontLoaded }: UseFontLoaderOptions) {
  const fontLoader = useRef(getFontLoader())
  const onFontLoadedRef = useRef(onFontLoaded)
  onFontLoadedRef.current = onFontLoaded

  useEffect(() => {
    const loader = fontLoader.current

    for (const word of words) {
      if (word.resolution.status !== "resolved") continue
      if (word.fontLoaded) continue

      const { variant } = word.resolution
      const text = word.token.raw
      const wordId = word.token.id

      loader.requestFont(variant, text, () => {
        onFontLoadedRef.current(wordId)
      })
    }
  }, [words])

  const preloadFont = useCallback(
    (variant: FontVariant, text: string): Promise<void> => {
      return new Promise((resolve) => {
        fontLoader.current.requestFont(variant, text, resolve)
      })
    },
    []
  )

  return { preloadFont }
}
