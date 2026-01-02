"use client"

import { useCallback, useEffect, useRef } from "react"
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

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const renderWords = () => {
    if (state.words.length === 0) {
      return null
    }

    const result: React.ReactNode[] = []
    let lastIndex = 0
    const wordRegex = /\S+/g
    let match: RegExpExecArray | null
    let wordIndex = 0

    while ((match = wordRegex.exec(state.rawText)) !== null) {
      if (match.index > lastIndex) {
        const whitespace = state.rawText.slice(lastIndex, match.index)
        result.push(
          <span key={`space-${lastIndex}`} className="whitespace-pre-wrap">
            {whitespace}
          </span>
        )
      }

      const word = state.words[wordIndex]
      if (word) {
        result.push(
          <VibeWord key={word.token.id} word={word} colorMode={colorMode} />
        )
        wordIndex++
      }

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < state.rawText.length) {
      result.push(
        <span key={`trailing-${lastIndex}`} className="whitespace-pre-wrap">
          {state.rawText.slice(lastIndex)}
        </span>
      )
    }

    return result
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
        className="sr-only"
        aria-label="Type here"
        autoFocus
      />

      <div className="w-full max-w-4xl px-8 md:px-16">
        <div className="text-3xl md:text-5xl lg:text-6xl font-normal leading-relaxed md:leading-relaxed lg:leading-relaxed tracking-wide text-center">
          {state.words.length === 0 ? (
            <span className="text-zinc-300 dark:text-zinc-700 select-none">
              start typing...
            </span>
          ) : (
            renderWords()
          )}
        </div>
      </div>
    </div>
  )
}
