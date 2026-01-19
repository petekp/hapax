"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "motion/react"
import type { FontVariant } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"
import { getFontLoader } from "@/lib/font-loader"
import { useActiveColor } from "@/lib/active-color-context"
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

  const handleFontLoaded = useCallback(() => {
    setFontLoaded(true)
  }, [])

  const handleMouseEnter = useCallback(() => {
    setActiveColor(variant.colorIntent)
  }, [setActiveColor, variant.colorIntent])

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

  if (!fontLoaded) {
    return <span style={{ visibility: "hidden" }}>{word}</span>
  }

  return (
    <Link href={`/word/${encodeURIComponent(word.toLowerCase())}`} onClick={handleClick}>
      <motion.span
        style={{
          color,
          fontFamily: `"${variant.family}", sans-serif`,
          fontWeight: variant.weight,
          fontStyle: variant.style,
          cursor: "pointer",
        }}
        initial={{ opacity: 0, filter: "blur(6px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.05 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {word}
      </motion.span>
    </Link>
  )
}
