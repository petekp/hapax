"use client"

import { useEffect, useRef } from "react"
import { ViewTransition } from "react"
import { MasonryGallery } from "@/components/gallery"
import { useActiveColor } from "@/lib/active-color-context"
import { useTuning } from "@/components/gallery/masonry/tuning-context"
import type { ColorIntent } from "@/lib/schemas"

export default function Home() {
  const { tintColors, setActiveColor } = useActiveColor()
  const tuning = useTuning()
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const colorJson = sessionStorage.getItem("visited-word-color")
    if (colorJson) {
      try {
        const color = JSON.parse(colorJson) as ColorIntent
        setActiveColor(color)
        sessionStorage.removeItem("visited-word-color")

        const timer = setTimeout(() => {
          setActiveColor(null)
        }, tuning.bgColorHoldDuration)

        return () => clearTimeout(timer)
      } catch {
        sessionStorage.removeItem("visited-word-color")
      }
    }
  }, [setActiveColor, tuning.bgColorHoldDuration])

  return (
    <ViewTransition name="page-background">
      <div
        className="fixed inset-0 transition-colors ease-out"
        style={{
          backgroundColor: tintColors.bg,
          transitionDuration: `${tuning.bgColorFadeDuration}ms`,
        }}
      >
        <MasonryGallery colorMode="dark" />
      </div>
    </ViewTransition>
  )
}
