"use client"

import { useEffect, useState } from "react"
import { ViewTransition } from "react"
import { MasonryGallery } from "@/components/gallery"
import { useActiveColor } from "@/lib/active-color-context"
import type { ColorIntent } from "@/lib/schemas"

export default function Home() {
  const { tintColors, setActiveColor } = useActiveColor()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) return

    const colorJson = sessionStorage.getItem("visited-word-color")
    if (colorJson) {
      try {
        const color = JSON.parse(colorJson) as ColorIntent
        setActiveColor(color)
        sessionStorage.removeItem("visited-word-color")

        const timer = setTimeout(() => {
          setActiveColor(null)
        }, 1500)

        setInitialized(true)
        return () => clearTimeout(timer)
      } catch {
        sessionStorage.removeItem("visited-word-color")
      }
    }
    setInitialized(true)
  }, [initialized, setActiveColor])

  return (
    <ViewTransition name="page-background">
      <div
        className="fixed inset-0 transition-colors duration-200 ease-out"
        style={{ backgroundColor: tintColors.bg }}
      >
        <MasonryGallery colorMode="dark" />
      </div>
    </ViewTransition>
  )
}
