"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react"
import type { ReactNode } from "react"
import type { ColorIntent } from "./schemas"
import { deriveTintVariables, type ColorDepth } from "./color"

export interface TintColors {
  bg: string
  text: string
  muted: string
  border: string
}

interface ActiveColorContextValue {
  activeColor: ColorIntent | null
  tintColors: TintColors
  setActiveColor: (color: ColorIntent | null, depth?: ColorDepth) => void
}

const ActiveColorContext = createContext<ActiveColorContextValue | null>(null)

export function ActiveColorProvider({ children }: { children: ReactNode }) {
  const [activeColor, setActiveColorState] = useState<ColorIntent | null>(null)
  const [depth, setDepth] = useState<ColorDepth>("shallow")

  const setActiveColor = useCallback((color: ColorIntent | null, newDepth: ColorDepth = "shallow") => {
    setActiveColorState(color)
    setDepth(newDepth)
  }, [])

  const tintColors = useMemo((): TintColors => {
    const vars = deriveTintVariables(activeColor, depth)
    return {
      bg: vars["--tint-bg"],
      text: vars["--tint-text"],
      muted: vars["--tint-muted"],
      border: vars["--tint-border"],
    }
  }, [activeColor, depth])

  const contextValue = useMemo(
    () => ({ activeColor, tintColors, setActiveColor }),
    [activeColor, tintColors, setActiveColor]
  )

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--tint-bg", tintColors.bg)
    root.style.setProperty("--tint-text", tintColors.text)
    root.style.setProperty("--tint-muted", tintColors.muted)
    root.style.setProperty("--tint-border", tintColors.border)
  }, [tintColors])

  return (
    <ActiveColorContext.Provider value={contextValue}>
      {children}
    </ActiveColorContext.Provider>
  )
}

export function useActiveColor() {
  const context = useContext(ActiveColorContext)
  if (!context) {
    throw new Error("useActiveColor must be used within ActiveColorProvider")
  }
  return context
}
