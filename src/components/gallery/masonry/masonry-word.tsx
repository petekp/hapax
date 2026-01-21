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
import { useMousePosition } from "./mouse-context"

interface MasonryWordProps {
  word: string
  variant: FontVariant
  fontSize: string
  colorMode?: "light" | "dark"
  parallaxDepth?: number
}

export const MasonryWord = memo(function MasonryWord({
  word,
  variant,
  fontSize,
  colorMode = "dark",
  parallaxDepth = 1,
}: MasonryWordProps) {
  const [fontLoaded, setFontLoaded] = useState(false)
  const isVisibleRef = useRef(false)
  const { setActiveColor } = useActiveColor()
  const isNavigatingRef = useRef(false)
  const elementRef = useRef<HTMLSpanElement>(null)
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const wordUrl = `/word/${encodeURIComponent(word.toLowerCase())}`
  const { subscribe } = useMousePosition()

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting },
      { rootMargin: "100px" }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return

    return subscribe((x, y) => {
      if (!elementRef.current || !isVisibleRef.current) return
      const offsetX = (x - 0.5) * 30 * parallaxDepth
      const offsetY = (y - 0.5) * 30 * parallaxDepth
      elementRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`
    })
  }, [prefersReducedMotion, parallaxDepth, subscribe])

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
        ref={elementRef}
        style={{
          display: "block",
          color: fontLoaded ? color : "transparent",
          fontFamily: `"${variant.family}", sans-serif`,
          fontWeight: variant.weight,
          fontStyle: variant.style,
          fontSize,
          lineHeight: 1.1,
          cursor: "pointer",
          transition: "transform 0.15s ease-out",
          willChange: "transform",
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
