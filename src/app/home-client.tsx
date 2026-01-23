"use client"

import { useEffect, useRef } from "react"
import { LayoutGroup } from "motion/react"
import { MasonryGallery } from "@/components/gallery"
import { OverlayProvider, WordOverlay, useOverlay } from "@/components/word-overlay"
import { useActiveColor } from "@/lib/active-color-context"
import { useTuning } from "@/components/gallery/masonry/tuning-context"

function HomeContent() {
  const { tintColors, setActiveColor } = useActiveColor()
  const { isOpen, closeWord } = useOverlay()
  const tuning = useTuning()
  const initializedRef = useRef(false)

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (!e.state?.overlay && isOpen) {
        closeWord()
        setActiveColor(null)
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [isOpen, closeWord, setActiveColor])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    if (!window.history.state?.overlay) {
      setActiveColor(null)
    }
  }, [setActiveColor])

  return (
    <LayoutGroup>
      <div
        className="fixed inset-0 transition-colors ease-out"
        style={{
          backgroundColor: tintColors.bg,
          transitionDuration: `${tuning.bgColorFadeDuration}ms`,
        }}
      >
        <MasonryGallery colorMode="dark" />
      </div>
      <WordOverlay />
    </LayoutGroup>
  )
}

export function HomeClient() {
  return (
    <OverlayProvider>
      <HomeContent />
    </OverlayProvider>
  )
}
