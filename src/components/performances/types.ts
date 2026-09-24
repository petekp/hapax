import type { ComponentType } from "react"
import type { Transition } from "motion/react"
import type { FontVariant } from "@/lib/schemas"

export interface PerformanceTitleProps {
  word: string
  variant: FontVariant
  // The word's font has loaded, so the performance can begin
  ready: boolean
  // "gallery": the word just flew in from the gallery, already showing.
  // "entrance": the word appears in place, as on its own page.
  origin: "gallery" | "entrance"
  reducedMotion: boolean
}

export interface AtmosphereProps {
  variant: FontVariant
}

// A word that acts out its meaning: how the word itself performs, and
// optionally the weather of the page around it. Hosts render Title in place of
// the plain word (inheriting its font, size, and .ink color) and skip
// Atmosphere when the visitor prefers reduced motion.
export interface Performance {
  Title: ComponentType<PerformanceTitleProps>
  Atmosphere?: ComponentType<AtmosphereProps>
  // How the word travels between the gallery and the overlay, in place of the usual spring
  flight?: Transition
}
