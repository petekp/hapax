"use client"

import { createContext, useContext, useState, useCallback, useMemo } from "react"
import type { ReactNode } from "react"
import type { FontVariant } from "@/lib/schemas"
import type { WordContent } from "@/lib/words"
import type { WordResponse } from "@/app/api/word/[word]/route"

interface OverlayState {
  isOpen: boolean
  isClosing: boolean
  selectedWord: string | null
  variant: FontVariant | null
  content: WordContent | null
  isLoading: boolean
  // How many words deep into the overlay's history this word is; 1 was opened from the gallery
  depth: number
}

// Shape of the history entries the overlay pushes
export interface OverlayHistoryState {
  overlay: true
  word: string
  variant: FontVariant
  depth: number
}

interface OverlayContextValue extends OverlayState {
  // Open a word from the gallery
  openWord: (word: string, variant: FontVariant) => void
  // Go from the open word to another one, as a new history entry
  followWord: (word: string, variant: FontVariant) => void
  // Show a word the browser navigated back or forward to
  restoreWord: (entry: OverlayHistoryState) => void
  closeWord: () => void
  resetOverlay: () => void
}

const OverlayContext = createContext<OverlayContextValue | null>(null)

const CLOSED_STATE: OverlayState = {
  isOpen: false,
  isClosing: false,
  selectedWord: null,
  variant: null,
  content: null,
  isLoading: false,
  depth: 0,
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverlayState>(CLOSED_STATE)

  const showWord = useCallback((word: string, variant: FontVariant, depth: number) => {
    setState({
      isOpen: true,
      isClosing: false,
      selectedWord: word,
      variant,
      content: null,
      isLoading: true,
      depth,
    })

    fetch(`/api/word/${encodeURIComponent(word.toLowerCase())}`)
      .then((res) => res.json())
      .then((data: WordResponse) => {
        // Ignore responses for a word we've already moved away from
        setState((prev) => prev.selectedWord === word ? {
          ...prev,
          content: data.content,
          isLoading: false,
        } : prev)
      })
      .catch(() => {
        setState((prev) => prev.selectedWord === word ? {
          ...prev,
          isLoading: false,
        } : prev)
      })
  }, [])

  const pushWord = useCallback((word: string, variant: FontVariant, depth: number) => {
    const entry: OverlayHistoryState = { overlay: true, word, variant, depth }
    window.history.pushState(entry, "", `/word/${encodeURIComponent(word.toLowerCase())}`)
    showWord(word, variant, depth)
  }, [showWord])

  const openWord = useCallback((word: string, variant: FontVariant) => {
    pushWord(word, variant, 1)
  }, [pushWord])

  const followWord = useCallback((word: string, variant: FontVariant) => {
    const current = window.history.state as Partial<OverlayHistoryState> | null
    pushWord(word, variant, (current?.depth ?? 1) + 1)
  }, [pushWord])

  const restoreWord = useCallback((entry: OverlayHistoryState) => {
    showWord(entry.word, entry.variant, entry.depth)
  }, [showWord])

  const closeWord = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isClosing: true,
    }))
  }, [])

  const resetOverlay = useCallback(() => {
    setState(CLOSED_STATE)
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      openWord,
      followWord,
      restoreWord,
      closeWord,
      resetOverlay,
    }),
    [state, openWord, followWord, restoreWord, closeWord, resetOverlay]
  )

  return (
    <OverlayContext.Provider value={value}>
      {children}
    </OverlayContext.Provider>
  )
}

export function useOverlay() {
  const context = useContext(OverlayContext)
  if (!context) {
    throw new Error("useOverlay must be used within OverlayProvider")
  }
  return context
}
