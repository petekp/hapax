"use client"

import { useMemo } from "react"
import type { WordState } from "@/lib/schemas"
import { VibeWord } from "./vibe-word"

interface VibeDisplayProps {
  rawText: string
  words: WordState[]
  colorMode: "light" | "dark"
}

export function VibeDisplay({ rawText, words, colorMode }: VibeDisplayProps) {
  const elements = useMemo(() => {
    if (words.length === 0) {
      return null
    }

    const result: React.ReactNode[] = []
    let lastIndex = 0
    const wordRegex = /\S+/g
    let match: RegExpExecArray | null
    let wordIndex = 0

    while ((match = wordRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        result.push(
          <span key={`space-${lastIndex}`} className="whitespace-pre">
            {rawText.slice(lastIndex, match.index)}
          </span>
        )
      }

      const word = words[wordIndex]
      if (word) {
        result.push(
          <VibeWord key={word.token.id} word={word} colorMode={colorMode} />
        )
        wordIndex++
      }

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < rawText.length) {
      result.push(
        <span key={`trailing-${lastIndex}`} className="whitespace-pre">
          {rawText.slice(lastIndex)}
        </span>
      )
    }

    return result
  }, [rawText, words, colorMode])

  return (
    <div className="pointer-events-none">
      <span className="whitespace-pre-wrap break-words leading-relaxed">
        {elements}
      </span>
    </div>
  )
}
