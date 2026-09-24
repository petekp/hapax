"use client"

import { useEffect, useCallback, useLayoutEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useOverlay, type OverlayHistoryState } from "./overlay-context"
import { OverlayContent } from "./overlay-content"
import { BackButton } from "@/components/back-button"
import { useActiveColor } from "@/lib/active-color-context"
import { useTuning } from "@/components/gallery/masonry/tuning-context"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { deriveInkVariables, deriveTintedMutedColorHex } from "@/lib/color"
import { getFontLoader } from "@/lib/font-loader"
import { getPerformance } from "@/components/performances"

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

export function WordOverlay() {
  const { isOpen, isClosing, selectedWord, variant, content, isLoading, depth, followWord, resetOverlay } = useOverlay()
  const { setActiveColor, tintColors } = useActiveColor()
  const tuning = useTuning()
  const prefersReducedMotion = useReducedMotion()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    if (isOpen && variant) {
      setActiveColor(variant.colorIntent, "deep")
    }
  }, [isOpen, variant, setActiveColor])

  useEffect(() => {
    if (!isOpen || !variant || !selectedWord) return

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset font state when word changes
    setFontLoaded(false)
    const fontLoader = getFontLoader()
    fontLoader.requestFont(variant, selectedWord, () => setFontLoaded(true))
  }, [isOpen, variant, selectedWord])

  // Unwind every word visited in the overlay, back to the gallery
  const handleClose = useCallback(() => {
    const entry = window.history.state as Partial<OverlayHistoryState> | null
    window.history.go(-(entry?.depth ?? 1))
  }, [])

  // Each new word starts at the top of the page
  useLayoutEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 })
  }, [selectedWord])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleClose])


  const backdropDuration = prefersReducedMotion ? 0 : tuning.overlayBackdropDuration / 1000
  const contentFadeOutDuration = prefersReducedMotion ? 0 : tuning.overlayContentFadeOut / 1000

  const backArrowColor = variant ? deriveTintedMutedColorHex(variant.colorIntent) : "#71717a"

  // Only a word opened from the gallery flies in from its spot there; words reached
  // from a related-word link make their own entrance
  const fromGallery = depth <= 1
  const layoutId = selectedWord && fromGallery ? `word-${selectedWord.toLowerCase()}` : undefined
  // Words that act out their meaning bring their own entrance and weather
  const wordPerformance = selectedWord ? getPerformance(selectedWord) : undefined
  const entrance = fromGallery || prefersReducedMotion || wordPerformance
    ? undefined
    : { initial: { opacity: 0, y: 18, filter: "blur(8px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" } }
  const inkVariables = variant ? deriveInkVariables(variant.colorIntent) : undefined
  const fontSize = selectedWord ? calculateOverlayFontSize(selectedWord.length) : "3rem"

  return (
    <AnimatePresence mode="wait" onExitComplete={resetOverlay}>
      {isOpen && !isClosing && selectedWord && variant && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            initial={{ opacity: 0, backgroundColor: tintColors.bg, pointerEvents: "none" as const }}
            animate={{
              opacity: 1,
              backgroundColor: tintColors.bg,
              transition: {
                opacity: { duration: backdropDuration },
                // Drift between hues when moving from word to word
                backgroundColor: { duration: prefersReducedMotion ? 0 : 0.9, ease: "easeInOut" },
              },
            }}
            exit={{ opacity: 0, pointerEvents: "none" as const, transition: { duration: contentFadeOutDuration } }}
            onClick={handleClose}
          />

          <motion.div
            key="overlay-container"
            ref={scrollContainerRef}
            className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden"
            initial={{ opacity: 1, pointerEvents: "auto" as const }}
            animate={{ opacity: 1, pointerEvents: "auto" as const }}
            exit={{ opacity: 0, pointerEvents: "none" as const, transition: { duration: contentFadeOutDuration } }}
          >
            {wordPerformance?.Atmosphere && !prefersReducedMotion && (
              <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
                <wordPerformance.Atmosphere key={selectedWord} variant={variant} />
              </div>
            )}

            <BackButton
              onClick={handleClose}
              color={backArrowColor}
              fadeIn
              fadeInDuration={backdropDuration}
              fadeInDelay={backdropDuration * 0.5}
              fadeOutDuration={contentFadeOutDuration * 0.5}
            />

            <div className="flex flex-col items-center pt-32 pb-48 min-h-screen">
              <div className="text-center mb-4" style={inkVariables}>
                <motion.span
                  key={fromGallery ? "from-gallery" : selectedWord}
                  layoutId={layoutId}
                  // A custom flight keeps the word fully visible while it travels
                  layoutCrossfade={!wordPerformance?.flight}
                  className="ink"
                  initial={entrance?.initial}
                  animate={entrance?.animate}
                  style={{
                    display: "inline-block",
                    color: fontLoaded ? undefined : "transparent",
                    fontFamily: `"${variant.family}", sans-serif`,
                    fontWeight: variant.weight,
                    fontStyle: variant.style,
                    fontSize,
                    lineHeight: 1.1,
                  }}
                  transition={{
                    layout: wordPerformance?.flight ?? {
                      type: "spring",
                      stiffness: tuning.overlaySpringStiffness,
                      damping: tuning.overlaySpringDamping,
                      mass: tuning.overlaySpringMass,
                    },
                    opacity: entrance ? { duration: 0.7, ease: "easeOut" } : { duration: 0 },
                    y: { type: "spring", stiffness: 70, damping: 18 },
                    filter: { duration: 0.7, ease: "easeOut" },
                  }}
                >
                  {wordPerformance ? (
                    <wordPerformance.Title
                      key={selectedWord}
                      word={selectedWord}
                      variant={variant}
                      ready={fontLoaded}
                      origin={fromGallery ? "gallery" : "entrance"}
                      reducedMotion={prefersReducedMotion}
                    />
                  ) : (
                    selectedWord
                  )}
                </motion.span>
              </div>

              <OverlayContent
                variant={variant}
                content={content}
                isLoading={isLoading}
                onNavigate={followWord}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
