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
}

interface OverlayContextValue extends OverlayState {
  openWord: (word: string, variant: FontVariant) => void
  closeWord: () => void
  resetOverlay: () => void
}

const OverlayContext = createContext<OverlayContextValue | null>(null)

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OverlayState>({
    isOpen: false,
    isClosing: false,
    selectedWord: null,
    variant: null,
    content: null,
    isLoading: false,
  })

  const openWord = useCallback((word: string, variant: FontVariant) => {
    setState({
      isOpen: true,
      isClosing: false,
      selectedWord: word,
      variant,
      content: null,
      isLoading: true,
    })

    window.history.pushState(
      { overlay: true, word },
      "",
      `/word/${encodeURIComponent(word.toLowerCase())}`
    )

    fetch(`/api/word/${encodeURIComponent(word.toLowerCase())}`)
      .then((res) => res.json())
      .then((data: WordResponse) => {
        setState((prev) => ({
          ...prev,
          content: data.content,
          isLoading: false,
        }))
      })
      .catch(() => {
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }))
      })
  }, [])

  const closeWord = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isClosing: true,
    }))
  }, [])

  const resetOverlay = useCallback(() => {
    setState({
      isOpen: false,
      isClosing: false,
      selectedWord: null,
      variant: null,
      content: null,
      isLoading: false,
    })
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      openWord,
      closeWord,
      resetOverlay,
    }),
    [state, openWord, closeWord, resetOverlay]
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
