"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useOverlay } from "./overlay-context"
import { OverlayContent } from "./overlay-content"
import { useActiveColor } from "@/lib/active-color-context"
import { useTuning } from "@/components/gallery/masonry/tuning-context"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { deriveColor, deriveTintedMutedColorHex, deriveHoverColorHex } from "@/lib/color"
import { getFontLoader } from "@/lib/font-loader"

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
  const { isOpen, isClosing, selectedWord, variant, content, isLoading, resetOverlay } = useOverlay()
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

  const handleClose = useCallback(() => {
    window.history.back()
  }, [])

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
  const hoverColorHex = variant ? deriveHoverColorHex(variant.colorIntent) : "#a1a1aa"

  const layoutId = selectedWord ? `word-${selectedWord.toLowerCase()}` : undefined
  const color = variant ? deriveColor(variant.colorIntent, "dark") : "transparent"
  const fontSize = selectedWord ? calculateOverlayFontSize(selectedWord.length) : "3rem"

  return (
    <AnimatePresence mode="wait" onExitComplete={resetOverlay}>
      {isOpen && !isClosing && selectedWord && variant && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40"
            style={{ backgroundColor: tintColors.bg }}
            initial={{ opacity: 0, pointerEvents: "none" as const }}
            animate={{ opacity: 1, transition: { duration: backdropDuration } }}
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
            <header className="fixed top-0 left-0 p-4 z-10">
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-12 h-12 transition-colors duration-200"
                style={{ color: backArrowColor }}
                onMouseEnter={(e) => (e.currentTarget.style.color = hoverColorHex)}
                onMouseLeave={(e) => (e.currentTarget.style.color = backArrowColor)}
                aria-label="Close"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            </header>

            <div className="flex flex-col items-center pt-32 pb-48 min-h-screen">
              <div className="text-center mb-4">
                <motion.span
                  layoutId={layoutId}
                  style={{
                    display: "inline-block",
                    color: fontLoaded ? color : "transparent",
                    fontFamily: `"${variant.family}", sans-serif`,
                    fontWeight: variant.weight,
                    fontStyle: variant.style,
                    fontSize,
                    lineHeight: 1.1,
                  }}
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: tuning.overlaySpringStiffness,
                      damping: tuning.overlaySpringDamping,
                      mass: tuning.overlaySpringMass,
                    },
                    opacity: { duration: 0 },
                  }}
                >
                  {selectedWord}
                </motion.span>
              </div>

              <OverlayContent
                word={selectedWord}
                variant={variant}
                content={content}
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
