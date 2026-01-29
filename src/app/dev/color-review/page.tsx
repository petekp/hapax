"use client"

import { useState, useEffect, useMemo } from "react"
import { GalleryWord } from "@/components/gallery"
import type { FontVariant, ColorIntent } from "@/lib/schemas/hapax"
import { deriveColor } from "@/lib/color"

interface WordStyle {
  word: string
  variant: FontVariant
}

interface HueRange {
  min: number
  max: number
  name: string
  target: string
}

const HUE_RANGES: HueRange[] = [
  { min: 0, max: 29, name: "red/orange", target: "6-7%" },
  { min: 30, max: 59, name: "amber/gold", target: "10-12%" },
  { min: 60, max: 89, name: "yellow-green", target: "5-7%" },
  { min: 90, max: 119, name: "green", target: "5-7%" },
  { min: 120, max: 149, name: "green-teal", target: "7-10%" },
  { min: 150, max: 179, name: "cyan-green", target: "7-10%" },
  { min: 180, max: 209, name: "cyan/teal", target: "10-12%" },
  { min: 210, max: 239, name: "blue", target: "12-15%" },
  { min: 240, max: 269, name: "indigo", target: "10-12%" },
  { min: 270, max: 299, name: "violet/purple", target: "12-15%" },
  { min: 300, max: 329, name: "magenta/rose", target: "7-10%" },
  { min: 330, max: 359, name: "pink/red", target: "5-7%" },
]

function getHueRange(hue: number): HueRange {
  return HUE_RANGES.find((r) => hue >= r.min && hue <= r.max) ?? HUE_RANGES[0]
}

function HueDistribution({ words }: { words: WordStyle[] }) {
  const distribution = useMemo(() => {
    const counts = new Map<string, number>()
    for (const range of HUE_RANGES) {
      counts.set(range.name, 0)
    }
    for (const w of words) {
      const range = getHueRange(w.variant.colorIntent.hue)
      counts.set(range.name, (counts.get(range.name) ?? 0) + 1)
    }
    return counts
  }, [words])

  const total = words.length

  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      {HUE_RANGES.map((range) => {
        const count = distribution.get(range.name) ?? 0
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0"
        return (
          <div
            key={range.name}
            className="flex items-center gap-2 p-2 rounded bg-zinc-900"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: deriveColor(
                  { hue: (range.min + range.max) / 2, chroma: 0.2, lightness: 60 },
                  "dark"
                ),
              }}
            />
            <span className="text-zinc-400">{range.name}</span>
            <span className="ml-auto font-mono">
              {count} ({pct}%)
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ColorSwatch({ intent }: { intent: ColorIntent }) {
  return (
    <div
      className="w-6 h-6 rounded border border-zinc-700"
      style={{ backgroundColor: deriveColor(intent, "dark") }}
      title={`H:${intent.hue} C:${intent.chroma} L:${intent.lightness}`}
    />
  )
}

export default function ColorReviewPage() {
  const [words, setWords] = useState<WordStyle[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"word" | "hue" | "chroma" | "lightness">("hue")

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return
    }

    fetch("/api/gallery?limit=500")
      .then((res) => res.json())
      .then((data) => {
        const wordStyles: WordStyle[] = data.words.map(
          (w: { word: string; variant: FontVariant }) => ({
            word: w.word,
            variant: w.variant,
          })
        )
        setWords(wordStyles)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load words:", err)
        setLoading(false)
      })
  }, [])

  const filteredWords = useMemo(() => {
    let result = [...words]

    if (filter) {
      const range = HUE_RANGES.find((r) => r.name === filter)
      if (range) {
        result = result.filter(
          (w) =>
            w.variant.colorIntent.hue >= range.min &&
            w.variant.colorIntent.hue <= range.max
        )
      }
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "word":
          return a.word.localeCompare(b.word)
        case "hue":
          return a.variant.colorIntent.hue - b.variant.colorIntent.hue
        case "chroma":
          return b.variant.colorIntent.chroma - a.variant.colorIntent.chroma
        case "lightness":
          return b.variant.colorIntent.lightness - a.variant.colorIntent.lightness
        default:
          return 0
      }
    })

    return result
  }, [words, filter, sortBy])

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center">
        <p className="text-zinc-500">This page is only available in development.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center">
        <p className="text-zinc-500">Loading words...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8">
      <header className="mb-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-light mb-2">Color Review Dashboard</h1>
        <p className="text-zinc-400 mb-6">
          Review and analyze the color distribution of {words.length} words.
        </p>

        <div className="mb-6">
          <h2 className="text-sm text-zinc-500 mb-2 uppercase tracking-wide">
            Hue Distribution
          </h2>
          <HueDistribution words={words} />
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Filter by hue</label>
            <select
              value={filter ?? ""}
              onChange={(e) => setFilter(e.target.value || null)}
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm"
            >
              <option value="">All hues</option>
              {HUE_RANGES.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} ({r.min}-{r.max}°)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm"
            >
              <option value="hue">Hue</option>
              <option value="word">Word (A-Z)</option>
              <option value="chroma">Chroma (high first)</option>
              <option value="lightness">Lightness (bright first)</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-zinc-500">
            Showing {filteredWords.length} of {words.length} words
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredWords.map((w) => (
            <div
              key={w.word}
              className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="text-2xl mb-3 min-h-[3rem] flex items-center">
                <GalleryWord word={w.word} variant={w.variant} colorMode="dark" />
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <ColorSwatch intent={w.variant.colorIntent} />
                <span>
                  H:{w.variant.colorIntent.hue} C:
                  {w.variant.colorIntent.chroma.toFixed(2)} L:
                  {w.variant.colorIntent.lightness}
                </span>
              </div>

              <div className="text-xs text-zinc-600 mt-1">
                {w.variant.family} {w.variant.weight}
                {w.variant.style === "italic" ? " italic" : ""}
              </div>

              <div className="text-xs text-zinc-700 mt-1">
                {getHueRange(w.variant.colorIntent.hue).name}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
