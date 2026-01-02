"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { useVibeInput, type WordResolver } from "@/hooks/use-vibe-input"
import { useFontLoader } from "@/hooks/use-font-loader"
import { VibeDisplay } from "./vibe-display"

interface VibeInputProps {
  placeholder?: string
  resolver?: WordResolver
  className?: string
  onTextChange?: (text: string) => void
}

function useColorMode(): "light" | "dark" {
  const [mode, setMode] = useState<"light" | "dark">("light")

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setMode(mediaQuery.matches ? "dark" : "light")

    const handler = (e: MediaQueryListEvent) => {
      setMode(e.matches ? "dark" : "light")
    }

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return mode
}

export function VibeInput({
  placeholder = "Type something...",
  resolver,
  className,
  onTextChange,
}: VibeInputProps) {
  const colorMode = useColorMode()
  const { state, setText, markFontLoaded } = useVibeInput({ resolver })
  const inputRef = useRef<HTMLInputElement>(null)

  useFontLoader({
    words: state.words,
    onFontLoaded: markFontLoaded,
  })

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value
      setText(text)
      onTextChange?.(text)
    },
    [setText, onTextChange]
  )

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const showPlaceholder = state.rawText.length === 0

  return (
    <div
      className={cn(
        "relative cursor-text rounded-xl border border-input bg-transparent px-4 py-3",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        "min-h-[52px]",
        className
      )}
      onClick={handleContainerClick}
    >
      <input
        ref={inputRef}
        type="text"
        value={state.rawText}
        onChange={handleChange}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent outline-none"
        aria-label="Vibetype input"
      />

      {showPlaceholder ? (
        <span className="pointer-events-none text-muted-foreground">
          {placeholder}
        </span>
      ) : (
        <VibeDisplay
          rawText={state.rawText}
          words={state.words}
          colorMode={colorMode}
        />
      )}
    </div>
  )
}
