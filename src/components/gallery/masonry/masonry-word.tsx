"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import Link from "next/link"
import type { FontVariant } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"
import { getFontLoader } from "@/lib/font-loader"
import { useActiveColor } from "@/lib/active-color-context"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface MasonryWordProps {
  word: string
  variant: FontVariant
  fontSize: string
  colorMode?: "light" | "dark"
}

export const MasonryWord = memo(function MasonryWord({
  word,
  variant,
  fontSize,
  colorMode = "dark",
}: MasonryWordProps) {
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
    setActiveColor(variant.colorIntent, "deep")
  }, [setActiveColor, variant.colorIntent])

  useEffect(() => {
    const fontLoader = getFontLoader()
    fontLoader.requestFont(variant, word, handleFontLoaded)
  }, [variant, word, handleFontLoaded])

  const color = deriveColor(variant.colorIntent, colorMode)

  return (
    <Link
      href={wordUrl}
      onClick={handleClick}
      className="block"
    >
      <motion.span
        style={{
          display: "block",
          color: fontLoaded ? color : "transparent",
          fontFamily: `"${variant.family}", sans-serif`,
          fontWeight: variant.weight,
          fontStyle: variant.style,
          fontSize,
          lineHeight: 1.1,
          cursor: "pointer",
        }}
        initial={{ opacity: 0, filter: "blur(6px)" }}
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
})
