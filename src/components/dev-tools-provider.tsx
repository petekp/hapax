"use client"

import type { ReactNode } from "react"
import { TuningProvider } from "./gallery/masonry/tuning-context"

interface DevToolsProviderProps {
  children: ReactNode
}

export function DevToolsProvider({ children }: DevToolsProviderProps) {
  if (process.env.NODE_ENV !== "development") {
    return <>{children}</>
  }

  return <TuningProvider>{children}</TuningProvider>
}
