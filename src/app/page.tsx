"use client"

import { ViewTransition } from "react"
import { MasonryGallery } from "@/components/gallery"
import { useActiveColor } from "@/lib/active-color-context"

export default function Home() {
  const { tintColors } = useActiveColor()

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
