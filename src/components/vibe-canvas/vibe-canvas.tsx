"use client"

import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useVibeInput, type WordResolver, type PhraseResolver } from "@/hooks/use-vibe-input"
import { useFontLoader } from "@/hooks/use-font-loader"
import { VibeWord } from "./vibe-word"

interface VibeCanvasProps {
  resolver?: WordResolver
  phraseResolver?: PhraseResolver
}

interface PhraseContext {
  phraseText: string
  wordIds: string[]
}

function useColorMode(): "light" | "dark" {
  return "dark"
}

function useViewportSize() {
  const [size, setSize] = useState({ width: 1024, height: 768 })

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return size
}

function useDynamicFontSize(charCount: number, viewport: { width: number; height: number }): number {
  return useMemo(() => {
    const vwFactor = Math.min(viewport.width / 1440, 1.2)
    const vhFactor = Math.min(viewport.height / 900, 1.1)
    const viewportScale = Math.min(vwFactor, vhFactor)

    const MAX_SIZE = Math.round(72 * viewportScale)
    const MIN_SIZE = Math.round(32 * viewportScale)  // higher floor

    const viewportArea = viewport.width * viewport.height
    const areaFactor = Math.sqrt(viewportArea / (1440 * 900))

    const CHAR_THRESHOLD_START = Math.round(50 * areaFactor)   // stay big longer
    const CHAR_THRESHOLD_END = Math.round(800 * areaFactor)    // very gradual

    if (charCount <= CHAR_THRESHOLD_START) {
      return MAX_SIZE
    }

    if (charCount >= CHAR_THRESHOLD_END) {
      return MIN_SIZE
    }

    // Very gentle logarithmic-ish curve
    const progress = (charCount - CHAR_THRESHOLD_START) / (CHAR_THRESHOLD_END - CHAR_THRESHOLD_START)
    const eased = Math.pow(progress, 0.6)  // flattens the curve significantly
    return Math.round(MAX_SIZE - (MAX_SIZE - MIN_SIZE) * eased)
  }, [charCount, viewport.width, viewport.height])
}

export function VibeCanvas({ resolver, phraseResolver }: VibeCanvasProps) {
  const colorMode = useColorMode()
  const searchParams = useSearchParams()
  const isAdmin = searchParams.has("admin")
  const { state, setText, markFontLoaded, updateVariant, setWordLoading, setPhraseLoading, updatePhraseVariant } = useVibeInput({ resolver, phraseResolver })
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const viewport = useViewportSize()
  const fontSize = useDynamicFontSize(state.rawText.length, viewport)

  const phraseContextMap = useMemo(() => {
    const map = new Map<string, PhraseContext>()
    const groupedByPhrase = new Map<string, typeof state.words>()

    for (const word of state.words) {
      if (word.phraseGroupId) {
        const existing = groupedByPhrase.get(word.phraseGroupId) || []
        existing.push(word)
        groupedByPhrase.set(word.phraseGroupId, existing)
      }
    }

    for (const [phraseGroupId, words] of groupedByPhrase) {
      const phraseText = words.map(w => w.token.raw).join(" ")
      const wordIds = words.map(w => w.token.id)
      for (const word of words) {
        map.set(word.token.id, { phraseText, wordIds })
      }
    }

    return map
  }, [state.words])

  useFontLoader({
    words: state.words,
    onFontLoaded: markFontLoaded,
  })

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value)
    },
    [setText]
  )

  const handleCanvasClick = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const handleFocus = useCallback(() => setIsFocused(true), [])
  const handleBlur = useCallback(() => setIsFocused(false), [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center cursor-text bg-zinc-50 dark:bg-zinc-950"
      onClick={handleCanvasClick}
    >
      <textarea
        ref={inputRef}
        value={state.rawText}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text resize-none"
        aria-label="Type here"
        autoFocus
      />

      <div className="w-full max-w-4xl px-8 md:px-16">
        <div
          className="font-normal leading-relaxed tracking-wide text-center text-zinc-800 dark:text-zinc-100 transition-[font-size] duration-300 ease-out"
          style={{ fontSize: `${fontSize}px` }}
        >
          {state.rawText ? (
            <>
              {state.words.map((word, index) => (
                <span key={word.token.id}>
                  {index > 0 && " "}
                  <VibeWord
                    word={word}
                    colorMode={colorMode}
                    onVariantChange={updateVariant}
                    onSetLoading={setWordLoading}
                    onPhraseVariantChange={updatePhraseVariant}
                    onSetPhraseLoading={setPhraseLoading}
                    phraseContext={phraseContextMap.get(word.token.id)}
                    showVettedIndicator={isAdmin}
                  />
                </span>
              ))}
              {isFocused && (
                <span className="caret-blink text-zinc-400 dark:text-zinc-500 ml-1">|</span>
              )}
            </>
          ) : (
            <span className="text-zinc-300 dark:text-zinc-700 select-none">
              {isFocused ? (
                <span className="caret-blink">|</span>
              ) : (
                "start typing..."
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
