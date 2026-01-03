"use client"

import { useMemo } from "react"
import type { WordState } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"

interface VibeWordProps {
  word: WordState
  colorMode: "light" | "dark"
}

export function VibeWord({ word, colorMode }: VibeWordProps) {
  const style = useMemo((): React.CSSProperties => {
    const status = word.resolution.status

    if (status === "pending") {
      return { color: "#22c55e" }
    }

    if (status === "loading") {
      return {
        color: "#f97316",
        opacity: 0.6,
        filter: "blur(1px)",
      }
    }

    if (status === "resolved") {
      const { variant } = word.resolution
      const color = deriveColor(variant.colorIntent, colorMode)
      return {
        fontFamily: `"${variant.family}", sans-serif`,
        fontWeight: variant.weight,
        fontStyle: variant.style,
        color,
      }
    }

    return { color: "red" }
  }, [word.resolution, colorMode])

  return (
    <span style={style}>
      {word.token.raw}
    </span>
  )
}
