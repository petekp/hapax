"use client"

import { useMemo, useEffect, useState, useRef } from "react"
import type { WordState } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"

type AnimationPhase = "hidden" | "waiting" | "blooming" | "settled"

interface VibeWordProps {
  word: WordState
  colorMode: "light" | "dark"
}

function getInitialPhase(word: WordState): AnimationPhase {
  if (word.resolution.status === "pending") return "hidden"
  if (word.resolution.status === "loading") return "waiting"
  if (word.resolution.status === "resolved" && !word.fontLoaded) return "waiting"
  if (word.resolution.status === "resolved" && word.fontLoaded) return "settled"
  return "hidden"
}

export function VibeWord({ word, colorMode }: VibeWordProps) {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>(() =>
    getInitialPhase(word)
  )
  const hasBloomedRef = useRef(false)

  const isFullyLoaded =
    word.resolution.status === "resolved" && word.fontLoaded

  useEffect(() => {
    if (word.resolution.status === "pending") {
      setAnimationPhase("hidden")
      hasBloomedRef.current = false
    } else if (
      word.resolution.status === "loading" ||
      (word.resolution.status === "resolved" && !word.fontLoaded)
    ) {
      setAnimationPhase("waiting")
    } else if (isFullyLoaded && !hasBloomedRef.current) {
      hasBloomedRef.current = true
      setAnimationPhase("blooming")
      const timer = setTimeout(() => {
        setAnimationPhase("settled")
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [word.resolution.status, word.fontLoaded, isFullyLoaded])

  const fontStyle = useMemo(() => {
    if (word.resolution.status !== "resolved") {
      return {}
    }

    const { variant } = word.resolution
    const color = deriveColor(variant.colorIntent, colorMode)

    return {
      fontFamily: `"${variant.family}", sans-serif`,
      fontWeight: variant.weight,
      fontStyle: variant.style,
      color,
    }
  }, [word.resolution, colorMode])

  const animationStyle = useMemo((): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "inline-block",
      willChange: "transform, opacity, filter",
    }

    switch (animationPhase) {
      case "hidden":
        return {
          ...base,
          opacity: 0,
          transform: "scale(0.7) translateY(10px)",
          filter: "blur(8px)",
        }
      case "waiting":
        return {
          ...base,
          opacity: 0.4,
          transform: "scale(0.95)",
          filter: "blur(3px)",
          animation: "pulse 1.2s ease-in-out infinite",
        }
      case "blooming":
        return {
          ...base,
          animation: "word-bloom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }
      case "settled":
        return {
          ...base,
          opacity: 1,
          transform: "scale(1)",
          filter: "blur(0px)",
        }
      default:
        return base
    }
  }, [animationPhase])

  return (
    <span
      style={{ ...fontStyle, ...animationStyle }}
      data-word-id={word.token.id}
      data-phase={animationPhase}
    >
      {word.token.raw}
    </span>
  )
}
