"use client"

import { VibeCanvas } from "@/components/vibe-canvas"
import { resolveFont, resolvePhrases } from "@/lib/resolver"

export default function Home() {
  return <VibeCanvas resolver={resolveFont} phraseResolver={resolvePhrases} />
}
