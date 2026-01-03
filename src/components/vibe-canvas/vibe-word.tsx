"use client"

import { useMemo, useEffect, useState, useRef, useCallback, useLayoutEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import type { WordState, FontVariant } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"
import { getCapHeightScale } from "@/lib/font-metrics"

type AnimationPhase = "unformed" | "breathing" | "revealing" | "settled"

interface VibeWordProps {
  word: WordState
  colorMode: "light" | "dark"
}

interface VariantSnapshot {
  key: string
  variant: FontVariant
  color: string
  scale: number
}

const CROSSFADE_TRANSITION = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1] as const,
}

const BREATHING_TRANSITION = {
  duration: 1.2,
  ease: "easeInOut" as const,
  repeat: Infinity,
  repeatType: "mirror" as const,
}

export function VibeWord({ word, colorMode }: VibeWordProps) {
  const [phase, setPhase] = useState<AnimationPhase>("unformed")
  const [revealingFrom, setRevealingFrom] = useState<VariantSnapshot | null>(null)
  const [targetWidth, setTargetWidth] = useState<number>(0)

  const measureRef = useRef<HTMLSpanElement>(null)
  const currentVariantRef = useRef<VariantSnapshot | null>(null)
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mutedColor = colorMode === "dark" ? "hsl(0, 0%, 45%)" : "hsl(0, 0%, 55%)"

  const variantKey = word.resolution.status === "resolved"
    ? `${word.resolution.variant.family}:${word.resolution.variant.weight}:${word.phraseGroupId}`
    : null

  const resolvedVariant = useMemo((): VariantSnapshot | null => {
    if (word.resolution.status !== "resolved" || !word.fontLoaded) {
      return null
    }
    const { variant } = word.resolution
    const scale = getCapHeightScale(variant.family, variant.weight, variant.style)
    return {
      key: variantKey!,
      variant,
      color: deriveColor(variant.colorIntent, colorMode),
      scale,
    }
  }, [word.resolution, word.fontLoaded, variantKey, colorMode])

  const fontStyleFor = useCallback((variant: FontVariant, scale: number = 1): React.CSSProperties => {
    return {
      fontFamily: `"${variant.family}", sans-serif`,
      fontWeight: variant.weight,
      fontStyle: variant.style,
      fontSize: `${scale}em`,
    }
  }, [])

  const measureStyle = useMemo((): React.CSSProperties => {
    if (resolvedVariant) {
      return fontStyleFor(resolvedVariant.variant, resolvedVariant.scale)
    }
    return {}
  }, [resolvedVariant, fontStyleFor])

  useEffect(() => {
    let cancelled = false

    const measure = () => {
      if (cancelled || !measureRef.current) return
      const rect = measureRef.current.getBoundingClientRect()
      setTargetWidth(rect.width + 2)
    }

    // Double RAF ensures font is fully rendered before measuring
    requestAnimationFrame(() => {
      requestAnimationFrame(measure)
    })

    return () => { cancelled = true }
  }, [measureStyle, word.token.raw])

  useEffect(() => {
    const prev = currentVariantRef.current
    if (resolvedVariant && resolvedVariant.key !== prev?.key) {
      if (prev) {
        setRevealingFrom(prev)
      }
    }
    currentVariantRef.current = resolvedVariant
  }, [resolvedVariant])

  useEffect(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current)
      phaseTimerRef.current = null
    }
    if (layoutTimerRef.current) {
      clearTimeout(layoutTimerRef.current)
      layoutTimerRef.current = null
    }

    const { status } = word.resolution

    if (status === "pending") {
      setPhase("unformed")
    } else if (status === "loading" || (status === "resolved" && !word.fontLoaded)) {
      setPhase("breathing")
    } else if (status === "resolved" && word.fontLoaded) {
      layoutTimerRef.current = setTimeout(() => {
        setPhase("revealing")
        phaseTimerRef.current = setTimeout(() => {
          setPhase("settled")
        }, 500)
      }, 50)
    }

    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current)
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current)
    }
  }, [word.resolution.status, word.fontLoaded])

  const handleFadeOutComplete = useCallback(() => {
    setRevealingFrom(null)
  }, [])

  const isRevealed = phase === "revealing" || phase === "settled"
  const showDefaultLayer = !isRevealed
  const showFinalLayer = isRevealed && resolvedVariant !== null
  const showPreviousVariantFade = isRevealed && revealingFrom !== null

  return (
    <span
      style={{ position: "relative", display: "inline-block", verticalAlign: "baseline" }}
      data-word-id={word.token.id}
      data-phase={phase}
    >
      <AnimatePresence mode="sync">
        {showDefaultLayer && (
          <motion.span
            key="default"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: "inline-block",
              color: mutedColor,
              whiteSpace: "nowrap",
              transformOrigin: "left baseline",
            }}
            initial={{ opacity: 0.4, filter: "blur(4px)" }}
            animate={
              phase === "breathing"
                ? { opacity: [0.4, 0.55], filter: ["blur(4px)", "blur(8px)"] }
                : { opacity: 0.4, filter: "blur(4px)" }
            }
            exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={phase === "breathing" ? BREATHING_TRANSITION : CROSSFADE_TRANSITION}
          >
            {word.token.raw}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence mode="sync">
        {showPreviousVariantFade && revealingFrom && (
          <motion.span
            key={revealingFrom.key}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: "inline-block",
              color: revealingFrom.color,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              ...fontStyleFor(revealingFrom.variant, revealingFrom.scale),
            }}
            initial={{ opacity: 1, filter: "blur(0px)" }}
            animate={{ opacity: 0, filter: "blur(4px)" }}
            exit={{ opacity: 0 }}
            transition={CROSSFADE_TRANSITION}
            onAnimationComplete={handleFadeOutComplete}
          >
            {word.token.raw}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence mode="sync">
        {showFinalLayer && resolvedVariant && (
          <motion.span
            key={resolvedVariant.key}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: "inline-block",
              color: resolvedVariant.color,
              whiteSpace: "nowrap",
              ...fontStyleFor(resolvedVariant.variant, resolvedVariant.scale),
            }}
            initial={{ opacity: 0, filter: "blur(6px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={CROSSFADE_TRANSITION}
          >
            {word.token.raw}
          </motion.span>
        )}
      </AnimatePresence>

      <span
        ref={measureRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "nowrap",
          ...measureStyle,
        }}
        aria-hidden="true"
      >
        {word.token.raw}
      </span>

      <span
        style={{
          display: "inline-block",
          visibility: "hidden",
          whiteSpace: "nowrap",
          width: targetWidth || "auto",
          height: resolvedVariant ? `${resolvedVariant.scale}em` : "1em",
        }}
        aria-hidden="true"
      >
        {word.token.raw}
      </span>
    </span>
  )
}
