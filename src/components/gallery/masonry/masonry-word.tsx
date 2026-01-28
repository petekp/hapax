"use client"

import { useState, useEffect, useLayoutEffect, useCallback, useRef, memo } from "react"
import { motion } from "motion/react"
import type { FontVariant } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"
import { getFontLoader } from "@/lib/font-loader"
import { useActiveColor } from "@/lib/active-color-context"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useOverlay } from "@/components/word-overlay"
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
}

export const MasonryWord = memo(function MasonryWord({
  word,
  variant,
  fontSize,
  colorMode = "dark",
  parallaxDepth = 1,
  tuning = tuningDefaults,
  index = 0,
}: MasonryWordProps) {
  const [fontLoaded, setFontLoaded] = useState(false)
  const isVisibleRef = useRef(false)
  const { setActiveColor } = useActiveColor()
  const { openWord, isOpen, isClosing, selectedWord } = useOverlay()
  const elementRef = useRef<HTMLSpanElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { subscribe } = useMousePosition()
  const layoutId = `word-${word.toLowerCase()}`
  const isThisWordSelected = selectedWord?.toLowerCase() === word.toLowerCase()
  const shouldHide = isOpen && !isClosing && isThisWordSelected

  const [rippleDelay, setRippleDelay] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!tuning.rippleEnabled || prefersReducedMotion) {
      setRippleDelay(index * tuning.staggerDelay)
      return
    }

    const element = elementRef.current
    if (!element) {
      setRippleDelay(index * tuning.staggerDelay)
      return
    }

    const calculateDelay = () => {
      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2
      const rect = element.getBoundingClientRect()
      const elementCenterX = rect.left + rect.width / 2
      const elementCenterY = rect.top + rect.height / 2
      const distance = Math.sqrt(
        (elementCenterX - viewportCenterX) ** 2 +
        (elementCenterY - viewportCenterY) ** 2
      )

      const maxDistance = Math.sqrt(viewportCenterX ** 2 + viewportCenterY ** 2)
      const normalizedDistance = Math.min(distance / maxDistance, 1)
      return tuning.rippleBaseDelay + normalizedDistance * tuning.rippleDelayRange
    }

    // Defer calculation to ensure scroll restoration has completed
    const rafId = requestAnimationFrame(() => {
      setRippleDelay(calculateDelay())
    })

    return () => cancelAnimationFrame(rafId)
  }, [tuning.rippleEnabled, tuning.rippleBaseDelay, tuning.rippleDelayRange, tuning.staggerDelay, index, prefersReducedMotion])

  const entranceDelay = rippleDelay ?? index * tuning.staggerDelay

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
    if (!isOpen) {
      setActiveColor(variant.colorIntent)
    }
  }, [setActiveColor, variant.colorIntent, isOpen])

  const handleMouseLeave = useCallback(() => {
    if (!isOpen) {
      setActiveColor(null)
    }
  }, [setActiveColor, isOpen])

  const handleClick = useCallback(() => {
    openWord(word, variant)
  }, [openWord, word, variant])

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
      <button
        onClick={handleClick}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded bg-transparent border-none p-0"
        aria-label={`View definition of ${word}`}
        disabled={isOpen}
      >
        <motion.span
          ref={elementRef}
          layoutId={layoutId}
          style={{
            display: "block",
            color: fontLoaded ? color : "transparent",
            fontFamily: `"${variant.family}", sans-serif`,
            fontWeight: variant.weight,
            fontStyle: variant.style,
            fontSize,
            lineHeight: 1.1,
            cursor: isOpen ? "default" : "pointer",
            transition: `translate ${tuning.mouseTransitionDuration}s ${mouseTransitionEasing}`,
            willChange: "translate",
            visibility: shouldHide ? "hidden" : "visible",
          }}
          initial={{
            opacity: 0,
            scale: tuning.rippleEnabled ? tuning.rippleScaleFrom : 1,
          }}
          animate={{
            opacity: fontLoaded ? depthOpacity : 0,
            scale: fontLoaded ? 1 : (tuning.rippleEnabled ? tuning.rippleScaleFrom : 1),
            filter: fontLoaded ? "blur(0px)" : `blur(${tuning.initialBlur}px)`,
          }}
          transition={{
            opacity: prefersReducedMotion ? { duration: 0 } : {
              type: "spring",
              stiffness: tuning.rippleSpringStiffness,
              damping: tuning.rippleSpringDamping,
              delay: entranceDelay,
              restDelta: 0.0005,
            },
            scale: tuning.rippleEnabled && !prefersReducedMotion ? {
              type: "spring",
              stiffness: tuning.rippleSpringStiffness,
              damping: tuning.rippleSpringDamping,
              delay: entranceDelay,
              restDelta: 0.0005,
            } : { duration: 0 },
            filter: prefersReducedMotion ? { duration: 0 } : {
              type: "spring",
              stiffness: tuning.rippleSpringStiffness,
              damping: tuning.rippleSpringDamping,
              delay: entranceDelay,
              restDelta: 0.0005,
            },
            layout: {
              type: "spring",
              stiffness: tuning.overlaySpringStiffness,
              damping: tuning.overlaySpringDamping,
              mass: tuning.overlaySpringMass,
            },
          }}
          whileHover={fontLoaded && !prefersReducedMotion && !isOpen ? { scale: tuning.hoverScale } : undefined}
          whileTap={fontLoaded && !prefersReducedMotion && !isOpen ? { scale: tuning.tapScale } : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {word}
        </motion.span>
      </button>
    </div>
  )
})
