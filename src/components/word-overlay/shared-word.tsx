"use client"

import { useState, useEffect, forwardRef } from "react"
import { motion } from "motion/react"
import type { FontVariant } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"
import { getFontLoader } from "@/lib/font-loader"
import { useTuning } from "@/components/gallery/masonry/tuning-context"

interface SharedWordProps {
  word: string
  variant: FontVariant
  layoutId: string
  size: "gallery" | "overlay"
  fontSize?: string
  colorMode?: "light" | "dark"
  className?: string
  style?: React.CSSProperties
  onFontLoaded?: () => void
}

function calculateOverlayFontSize(wordLength: number): string {
  const charWidthRatio = 0.55
  const maxSize = 10.5
  const minSize = 3

  const mobileAvailable = 14
  const desktopAvailable = 60

  const mobileMax = Math.min(maxSize, mobileAvailable / (wordLength * charWidthRatio))
  const desktopMax = Math.min(maxSize, desktopAvailable / (wordLength * charWidthRatio))

  const clampedMobile = Math.max(minSize, mobileMax)
  const clampedDesktop = Math.max(minSize, desktopMax)

  const slope = (clampedDesktop - clampedMobile) / 60
  const intercept = clampedMobile - slope * 20

  return `clamp(${clampedMobile.toFixed(2)}rem, ${intercept.toFixed(2)}rem + ${(slope * 100).toFixed(2)}vw, ${clampedDesktop.toFixed(2)}rem)`
}

export const SharedWord = forwardRef<HTMLSpanElement, SharedWordProps>(
  function SharedWord(
    {
      word,
      variant,
      layoutId,
      size,
      fontSize: propFontSize,
      colorMode = "dark",
      className = "",
      style = {},
      onFontLoaded,
    },
    ref
  ) {
    const [fontLoaded, setFontLoaded] = useState(false)
    const tuning = useTuning()
    const color = deriveColor(variant.colorIntent, colorMode)

    const fontSize =
      size === "overlay"
        ? calculateOverlayFontSize(word.length)
        : propFontSize ?? "var(--text-gallery-md)"

    useEffect(() => {
      const fontLoader = getFontLoader()
      fontLoader.requestFont(variant, word, () => {
        setFontLoaded(true)
        onFontLoaded?.()
      })
    }, [variant, word, onFontLoaded])

    return (
      <motion.span
        ref={ref}
        layoutId={layoutId}
        style={{
          display: "inline-block",
          color: fontLoaded ? color : "transparent",
          fontFamily: `"${variant.family}", sans-serif`,
          fontWeight: variant.weight,
          fontStyle: variant.style,
          fontSize,
          lineHeight: 1.1,
          ...style,
        }}
        className={className}
        transition={{
          layout: {
            type: "spring",
            stiffness: tuning.overlaySpringStiffness ?? 80,
            damping: tuning.overlaySpringDamping ?? 20,
            mass: tuning.overlaySpringMass ?? 1,
          },
        }}
      >
        {word}
      </motion.span>
    )
  }
)
