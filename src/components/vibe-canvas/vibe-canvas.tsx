"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useVibeInput, type WordResolver, type PhraseResolver } from "@/hooks/use-vibe-input"
import { useFontLoader } from "@/hooks/use-font-loader"
import { VibeWord } from "./vibe-word"

interface VibeCanvasProps {
  resolver?: WordResolver
  phraseResolver?: PhraseResolver
}

function useColorMode(): "light" | "dark" {
  return "dark"
}

export function VibeCanvas({ resolver, phraseResolver }: VibeCanvasProps) {
  const colorMode = useColorMode()
  const { state, setText, markFontLoaded } = useVibeInput({ resolver, phraseResolver })
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

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

  const renderWords = () => {
    if (state.words.length === 0) {
      return null
    }

    return state.words.map((word, index) => (
      <span key={index}>
        {index > 0 && " "}
        <VibeWord word={word} colorMode={colorMode} />
      </span>
    ))
  }

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
        <div className="text-3xl md:text-5xl lg:text-6xl font-normal leading-relaxed md:leading-relaxed lg:leading-relaxed tracking-wide text-center text-zinc-800 dark:text-zinc-100">
          {state.rawText ? (
            <>
              {state.words.length > 0 ? renderWords() : state.rawText}
              {isFocused && (
                <span className="caret-blink text-zinc-400 dark:text-zinc-500">|</span>
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
