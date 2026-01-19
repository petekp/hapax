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
        style={{ willChange: "background-color" }}
        animate={{ backgroundColor: tintColors.bg }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
      >
        <header className="flex-shrink-0 flex flex-col items-center justify-center pt-16 pb-8 px-4 z-10">
          <motion.h1
            className="text-4xl md:text-5xl font-light mb-8 tracking-tight"
            animate={{ color: tintColors.text }}
            transition={{ type: "spring", stiffness: 100, damping: 30 }}
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
