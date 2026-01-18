"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import type { FontVariant } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"
import { getFontLoader } from "@/lib/font-loader"
import Link from "next/link"

interface GalleryWordProps {
  word: string
  variant: FontVariant
  colorMode?: "light" | "dark"
}

export function GalleryWord({ word, variant, colorMode = "dark" }: GalleryWordProps) {
  const [fontLoaded, setFontLoaded] = useState(false)

  const handleFontLoaded = useCallback(() => {
    setFontLoaded(true)
  }, [])

  useEffect(() => {
    const fontLoader = getFontLoader()
    fontLoader.requestFont(variant, word, handleFontLoaded)
  }, [variant, word, handleFontLoaded])

  const color = deriveColor(variant.colorIntent, colorMode)
  const mutedColor = colorMode === "dark" ? "hsl(0, 0%, 45%)" : "hsl(0, 0%, 55%)"

  if (!fontLoaded) {
    return (
      <motion.span
        style={{ color: mutedColor }}
        animate={{ opacity: [0.4, 0.55], filter: ["blur(4px)", "blur(8px)"] }}
        transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
      >
        {word}
      </motion.span>
    )
  }

  return (
    <Link href={`/word/${encodeURIComponent(word.toLowerCase())}`}>
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
      >
        {word}
      </motion.span>
    </Link>
  )
}
