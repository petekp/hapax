import type { Performance } from "./types"
import { petrichor } from "./petrichor"

export type { Performance, PerformanceTitleProps, AtmosphereProps } from "./types"

// Words that act out their meaning, keyed by lowercase word
const performances: Record<string, Performance> = {
  petrichor,
}

export function getPerformance(word: string): Performance | undefined {
  return performances[word.toLowerCase()]
}
