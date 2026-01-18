"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react"
import type { ReactNode } from "react"
import type { ColorIntent } from "./schemas"
import { deriveTintVariables } from "./color"

interface ActiveColorContextValue {
  activeColor: ColorIntent | null
  setActiveColor: (color: ColorIntent | null) => void
}

const ActiveColorContext = createContext<ActiveColorContextValue | null>(null)

export function ActiveColorProvider({ children }: { children: ReactNode }) {
  const [activeColor, setActiveColorState] = useState<ColorIntent | null>(null)

  const setActiveColor = useCallback((color: ColorIntent | null) => {
    setActiveColorState(color)
  }, [])

  const contextValue = useMemo(
    () => ({ activeColor, setActiveColor }),
    [activeColor, setActiveColor]
  )

  useEffect(() => {
    const tintVars = deriveTintVariables(activeColor)
    const root = document.documentElement

    Object.entries(tintVars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [activeColor])

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
