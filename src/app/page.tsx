"use client"

import { ViewTransition } from "react"
import { motion } from "motion/react"
import { AutoScrollGallery, SearchBar } from "@/components/gallery"
import { useActiveColor } from "@/lib/active-color-context"

export default function Home() {
  const { tintColors } = useActiveColor()

  return (
    <ViewTransition name="page-background">
      <motion.div
        className="fixed inset-0 flex flex-col"
        animate={{ backgroundColor: tintColors.bg }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      >
        <header className="flex-shrink-0 flex flex-col items-center justify-center pt-16 pb-8 px-4 z-10">
          <motion.h1
            className="text-4xl md:text-5xl font-light mb-8 tracking-tight"
            animate={{ color: tintColors.text }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          >
            hapax
          </motion.h1>
          <SearchBar />
        </header>

        <main className="flex-1 overflow-hidden">
          <AutoScrollGallery colorMode="dark" />
        </main>
      </motion.div>
    </ViewTransition>
  )
}
