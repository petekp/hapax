"use client"

import { useMemo, useEffect, useState, useRef } from "react"
import type { WordState } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"

type AnimationPhase = "hidden" | "waiting" | "blooming" | "settled"

interface VibeWordProps {
  word: WordState
  colorMode: "light" | "dark"
}

export function VibeWord({ word, colorMode }: VibeWordProps) {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("hidden")
  const lastVariantKeyRef = useRef<string | null>(null)
  const bloomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const variantKey = word.resolution.status === "resolved"
    ? `${word.resolution.variant.family}:${word.resolution.variant.weight}:${word.phraseGroupId}`
    : null

  useEffect(() => {
    if (bloomTimerRef.current) {
      clearTimeout(bloomTimerRef.current)
      bloomTimerRef.current = null
    }

    if (word.resolution.status === "pending") {
      setAnimationPhase("hidden")
      lastVariantKeyRef.current = null
      return
    }

    if (word.resolution.status === "loading") {
      setAnimationPhase("waiting")
      return
    }

    const variantChanged = variantKey !== lastVariantKeyRef.current

    if (!word.fontLoaded) {
      setAnimationPhase("waiting")
      if (variantChanged && variantKey) {
        lastVariantKeyRef.current = variantKey
      }

      // Failsafe: if stuck in waiting for too long, just show the word
      // The font is likely already loaded, just the callback didn't fire
      bloomTimerRef.current = setTimeout(() => {
        setAnimationPhase((current) => {
          if (current === "waiting") {
            return "settled"
          }
          return current
        })
      }, 1500)
      return
    }

    if (variantChanged || animationPhase === "waiting") {
      lastVariantKeyRef.current = variantKey
      setAnimationPhase("blooming")
      bloomTimerRef.current = setTimeout(() => {
        setAnimationPhase("settled")
      }, 600)
    }

    return () => {
      if (bloomTimerRef.current) {
        clearTimeout(bloomTimerRef.current)
      }
    }
  }, [word.resolution.status, word.fontLoaded, word.phraseGroupId, variantKey, animationPhase])

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
          transform: "scale(0.7) translateY(20px)",
          filter: "blur(12px)",
        }
      case "waiting":
        return {
          ...base,
          opacity: 0.3,
          transform: "scale(0.95)",
          filter: "blur(4px)",
          animation: "pulse 1.2s ease-in-out infinite",
        }
      case "blooming":
        return {
          ...base,
          animation: "word-bloom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
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
