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
import { type TuningValues, tuningDefaults } from "./tuning-context"

interface MasonryWordProps {
  word: string
  variant: FontVariant
  fontSize: string
  colorMode?: "light" | "dark"
  parallaxDepth?: number
  tuning?: TuningValues
  index?: number
  skipEntrance?: boolean
  isReturningWord?: boolean
}

export const MasonryWord = memo(function MasonryWord({
  word,
  variant,
  fontSize,
  colorMode = "dark",
  parallaxDepth = 1,
  tuning = tuningDefaults,
  index = 0,
  skipEntrance = false,
  isReturningWord = false,
}: MasonryWordProps) {
  const [fontLoaded, setFontLoaded] = useState(false)
  const [entranceReady, setEntranceReady] = useState(!skipEntrance)
  const [entranceDelay, setEntranceDelay] = useState(0)
  const isVisibleRef = useRef(false)
  const { setActiveColor } = useActiveColor()
  const isNavigatingRef = useRef(false)
  const elementRef = useRef<HTMLSpanElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const wordUrl = `/word/${encodeURIComponent(word.toLowerCase())}`
  const { subscribe } = useMousePosition()

  useEffect(() => {
    if (!skipEntrance || entranceReady) return

    // Wait for scroll restoration to complete before measuring
    const timer = setTimeout(() => {
      const el = wrapperRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const viewportCenter = window.innerHeight / 2
      const elementCenter = rect.top + rect.height / 2
      const distanceFromCenter = Math.abs(elementCenter - viewportCenter)

      if (isReturningWord) {
        setEntranceDelay(0)
      } else {
        const delay = tuning.returnStaggerBase + distanceFromCenter * tuning.returnStaggerPerPx
        setEntranceDelay(Math.min(delay, 1.5))
      }
      setEntranceReady(true)
    }, 50)

    return () => clearTimeout(timer)
  }, [skipEntrance, isReturningWord, entranceReady, tuning.returnStaggerBase, tuning.returnStaggerPerPx])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting },
      { rootMargin: `${tuning.visibilityMargin}px` }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [tuning.visibilityMargin])

  useEffect(() => {
    if (prefersReducedMotion || !tuning.mouseParallaxEnabled) return

    return subscribe((x, y) => {
      if (!elementRef.current || !isVisibleRef.current) return
      const offsetX = (x - 0.5) * tuning.mouseParallaxMultiplier * parallaxDepth
      const offsetY = (y - 0.5) * tuning.mouseParallaxMultiplier * parallaxDepth
      elementRef.current.style.translate = `${offsetX}px ${offsetY}px`
    })
  }, [prefersReducedMotion, parallaxDepth, subscribe, tuning.mouseParallaxEnabled, tuning.mouseParallaxMultiplier])

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
    sessionStorage.setItem("navigated-to-word", "true")
    sessionStorage.setItem("visited-word", word.toLowerCase())
    sessionStorage.setItem("visited-word-color", JSON.stringify(variant.colorIntent))
  }, [word, variant.colorIntent])

  useEffect(() => {
    const fontLoader = getFontLoader()
    fontLoader.requestFont(variant, word, handleFontLoaded)
  }, [variant, word, handleFontLoaded])

  const color = deriveColor(variant.colorIntent, colorMode)

  const depthRange = tuning.parallaxDepthMax - tuning.parallaxDepthMin
  const normalizedDepth = depthRange > 0 ? (parallaxDepth - tuning.parallaxDepthMin) / depthRange : 0
  const depthOpacity = tuning.depthOpacityFar + (tuning.depthOpacityNear - tuning.depthOpacityFar) * normalizedDepth

  const scrollParallaxStyle = (prefersReducedMotion || !tuning.scrollParallaxEnabled) ? {} : {
    "--parallax-offset": `${parallaxDepth * tuning.scrollParallaxMultiplier}px`,
    animation: "scrollParallax linear",
    animationTimeline: "view()",
    animationRange: `cover ${tuning.scrollRangeStart}% cover ${tuning.scrollRangeEnd}%`,
  } as React.CSSProperties

  const mouseTransitionEasing = `cubic-bezier(${tuning.mouseEasingX1}, ${tuning.mouseEasingY1}, ${tuning.mouseEasingX2}, ${tuning.mouseEasingY2})`

  return (
    <div ref={wrapperRef} style={scrollParallaxStyle}>
      <Link
        href={wordUrl}
        onClick={handleClick}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded"
        aria-label={`View definition of ${word}`}
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
            transition: `translate ${tuning.mouseTransitionDuration}s ${mouseTransitionEasing}`,
            willChange: "translate",
          }}
          initial={{
            opacity: 0,
            scale: skipEntrance && isReturningWord ? tuning.returnWordScale : 1,
          }}
          animate={{
            opacity: entranceReady && fontLoaded ? depthOpacity : 0,
            filter: fontLoaded ? "blur(0px)" : `blur(${tuning.initialBlur}px)`,
            scale: 1,
          }}
          transition={skipEntrance ? {
            opacity: { duration: isReturningWord ? tuning.returnWordDuration : tuning.returnOtherDuration, delay: entranceDelay },
            filter: { duration: isReturningWord ? tuning.returnWordDuration : tuning.returnOtherDuration, delay: entranceDelay },
            scale: isReturningWord
              ? { type: "spring", stiffness: tuning.returnWordSpringStiffness, damping: tuning.returnWordSpringDamping, mass: tuning.returnWordSpringMass, delay: entranceDelay }
              : { duration: 0 },
          } : {
            duration: prefersReducedMotion ? 0 : tuning.fadeInDuration,
            delay: prefersReducedMotion ? 0 : index * tuning.staggerDelay,
          }}
          whileHover={fontLoaded && !prefersReducedMotion ? { scale: tuning.hoverScale } : undefined}
          whileTap={fontLoaded && !prefersReducedMotion ? { scale: tuning.tapScale } : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {word}
        </motion.span>
      </Link>
    </div>
  )
})
