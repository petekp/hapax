"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import type { FontVariant } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"
import { getFontLoader } from "@/lib/font-loader"
import { useActiveColor } from "@/lib/active-color-context"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import Link from "next/link"

interface GalleryWordProps {
  word: string
  variant: FontVariant
  colorMode?: "light" | "dark"
}

export function GalleryWord({ word, variant, colorMode = "dark" }: GalleryWordProps) {
  const [fontLoaded, setFontLoaded] = useState(false)
  const { setActiveColor } = useActiveColor()
  const isNavigatingRef = useRef(false)
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const wordUrl = `/word/${encodeURIComponent(word.toLowerCase())}`

  const handleFontLoaded = useCallback(() => {
    setFontLoaded(true)
  }, [])

  const handleMouseEnter = useCallback(() => {
    setActiveColor(variant.colorIntent)
    router.prefetch(wordUrl)
  }, [setActiveColor, variant.colorIntent, router, wordUrl])

  const handleMouseLeave = useCallback(() => {
    if (!isNavigatingRef.current) {
      setActiveColor(null)
    }
  }, [setActiveColor])

  const handleClick = useCallback(() => {
    isNavigatingRef.current = true
    // Set deep color immediately on click so the View Transition captures it
    setActiveColor(variant.colorIntent, "deep")
  }, [setActiveColor, variant.colorIntent])

  useEffect(() => {
    const fontLoader = getFontLoader()
    fontLoader.requestFont(variant, word, handleFontLoaded)
  }, [variant, word, handleFontLoaded])

  const color = deriveColor(variant.colorIntent, colorMode)

  return (
    <Link href={wordUrl} onClick={handleClick}>
      <motion.span
        style={{
          color: fontLoaded ? color : "transparent",
          fontFamily: `"${variant.family}", sans-serif`,
          fontWeight: variant.weight,
          fontStyle: variant.style,
          cursor: "pointer",
        }}
        animate={{
          opacity: fontLoaded ? 1 : 0,
          filter: fontLoaded ? "blur(0px)" : "blur(6px)",
        }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
        whileHover={fontLoaded && !prefersReducedMotion ? { scale: 1.02 } : undefined}
        whileTap={fontLoaded && !prefersReducedMotion ? { scale: 0.98 } : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {word}
      </motion.span>
    </Link>
  )
}
