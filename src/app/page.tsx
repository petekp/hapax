"use client"

import { ViewTransition } from "react"
import { motion } from "motion/react"
import { MasonryGallery } from "@/components/gallery"
import { useActiveColor } from "@/lib/active-color-context"

export default function Home() {
  const { tintColors } = useActiveColor()

  return (
    <ViewTransition name="page-background">
      <motion.div
        className="fixed inset-0"
        style={{ willChange: "background-color" }}
        animate={{ backgroundColor: tintColors.bg }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
      >
        <MasonryGallery colorMode="dark" />
      </motion.div>
    </ViewTransition>
  )
}
