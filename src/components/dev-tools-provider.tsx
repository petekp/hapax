"use client"

import dynamic from "next/dynamic"
import type { ReactNode } from "react"

interface DevToolsProviderProps {
  children: ReactNode
}

const TuningProviderDev = dynamic(
  () => import("./gallery/masonry/tuning-provider-dev").then((mod) => mod.TuningProviderDev),
  { ssr: false }
)

export function DevToolsProvider({ children }: DevToolsProviderProps) {
  if (process.env.NODE_ENV !== "development") {
    return <>{children}</>
  }

  return <TuningProviderDev>{children}</TuningProviderDev>
}
