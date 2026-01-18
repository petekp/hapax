"use client"

import { useState } from "react"
import { GalleryWord } from "@/components/gallery"
import type { FontVariant } from "@/lib/schemas/vibetype"

interface Comparison {
  word: string
  issue: string
  rationale: string
  current: FontVariant
  suggested: FontVariant
}

const comparisons: Comparison[] = [
  {
    word: "america",
    issue: "Slab serif and blue feel too generic corporate",
    rationale: "Big Shoulders is expansive, quintessentially American. Warmer red-orange is more energetic.",
    current: {
      family: "Zilla Slab",
      weight: 600,
      style: "normal",
      colorIntent: { hue: 220, chroma: 0.28, lightness: 50 }
    },
    suggested: {
      family: "Big Shoulders Display",
      weight: 700,
      style: "normal",
      colorIntent: { hue: 12, chroma: 0.25, lightness: 55 }
    }
  },
  {
    word: "squeak",
    issue: "Bangers is loud, but squeak is small and high-pitched",
    rationale: "Handwritten Caveat captures the fleeting, small nature. Warmer, softer color.",
    current: {
      family: "Bangers",
      weight: 400,
      style: "normal",
      colorIntent: { hue: 80, chroma: 0.32, lightness: 75 }
    },
    suggested: {
      family: "Caveat",
      weight: 400,
      style: "normal",
      colorIntent: { hue: 45, chroma: 0.18, lightness: 72 }
    }
  },
  {
    word: "ragamuffin",
    issue: "Color is too neutral for a street urchin",
    rationale: "More brownish, weathered, dirty earth-tones fit better.",
    current: {
      family: "Crushed",
      weight: 400,
      style: "normal",
      colorIntent: { hue: 45, chroma: 0.12, lightness: 52 }
    },
    suggested: {
      family: "Crushed",
      weight: 400,
      style: "normal",
      colorIntent: { hue: 28, chroma: 0.15, lightness: 45 }
    }
  },
  {
    word: "borborygmus",
    issue: "Muted green doesn't capture the organic, bodily quality",
    rationale: "Warmer yellow-green feels more gurgly and alive.",
    current: {
      family: "Rubik Beastly",
      weight: 400,
      style: "normal",
      colorIntent: { hue: 92, chroma: 0.12, lightness: 48 }
    },
    suggested: {
      family: "Rubik Beastly",
      weight: 400,
      style: "normal",
      colorIntent: { hue: 78, chroma: 0.18, lightness: 52 }
    }
  },
  {
    word: "tsundere",
    issue: "Anybody is too neutral/modern for this Japanese term",
    rationale: "Shizuru's brush strokes capture cultural context and emotional volatility.",
    current: {
      family: "Anybody",
      weight: 500,
      style: "italic",
      colorIntent: { hue: 350, chroma: 0.28, lightness: 58 }
    },
    suggested: {
      family: "Shizuru",
      weight: 400,
      style: "normal",
      colorIntent: { hue: 350, chroma: 0.28, lightness: 58 }
    }
  },
  {
    word: "eldritch",
    issue: "Nosifer is too literal horror-movie-poster",
    rationale: "Grenze Gotisch captures archaic, cosmic dread without being campy.",
    current: {
      family: "Nosifer",
      weight: 400,
      style: "normal",
      colorIntent: { hue: 285, chroma: 0.12, lightness: 38 }
    },
    suggested: {
      family: "Grenze Gotisch",
      weight: 600,
      style: "normal",
      colorIntent: { hue: 285, chroma: 0.08, lightness: 35 }
    }
  },
  {
    word: "monadnock",
    issue: "Academic small caps don't feel monumental enough",
    rationale: "Cinzel's Roman inscriptions suit ancient, enduring rock. Cooler grey-green like stone.",
    current: {
      family: "Alegreya SC",
      weight: 800,
      style: "normal",
      colorIntent: { hue: 225, chroma: 0.09, lightness: 48 }
    },
    suggested: {
      family: "Cinzel",
      weight: 800,
      style: "normal",
      colorIntent: { hue: 175, chroma: 0.08, lightness: 40 }
    }
  },
  {
    word: "escutcheon",
    issue: "Teal doesn't evoke heraldic shields",
    rationale: "Classical serif with aged gold/bronze color for heraldry.",
    current: {
      family: "Baskervville",
      weight: 600,
      style: "normal",
      colorIntent: { hue: 165, chroma: 0.12, lightness: 42 }
    },
    suggested: {
      family: "Baskervville",
      weight: 400,
      style: "normal",
      colorIntent: { hue: 45, chroma: 0.12, lightness: 48 }
    }
  },
  {
    word: "ancient",
    issue: "Blackletter feels too specifically medieval-European",
    rationale: "Cinzel is more broadly ancient—works for Egypt, Greece, Rome.",
    current: {
      family: "UnifrakturCook",
      weight: 700,
      style: "normal",
      colorIntent: { hue: 30, chroma: 0.15, lightness: 45 }
    },
    suggested: {
      family: "Cinzel",
      weight: 600,
      style: "normal",
      colorIntent: { hue: 35, chroma: 0.12, lightness: 48 }
    }
  },
  {
    word: "weltanschauung",
    issue: "Could benefit from a more Germanic serif",
    rationale: "Vollkorn has German typographic heritage, scholarly weight.",
    current: {
      family: "Alegreya",
      weight: 600,
      style: "normal",
      colorIntent: { hue: 48, chroma: 0.12, lightness: 42 }
    },
    suggested: {
      family: "Vollkorn",
      weight: 600,
      style: "normal",
      colorIntent: { hue: 48, chroma: 0.12, lightness: 42 }
    }
  }
]

type Choice = "current" | "suggested" | null

export default function ReviewPage() {
  const [choices, setChoices] = useState<Record<string, Choice>>({})

  const handleChoice = (word: string, choice: Choice) => {
    setChoices(prev => ({
      ...prev,
      [word]: prev[word] === choice ? null : choice
    }))
  }

  const selectedSuggested = Object.entries(choices)
    .filter(([, choice]) => choice === "suggested")
    .map(([word]) => word)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 p-8">
      <header className="mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-light mb-2">Word Style Review</h1>
        <p className="text-zinc-400 mb-4">
          Click on the version you prefer. Selected suggestions will be listed at the bottom.
        </p>
        {selectedSuggested.length > 0 && (
          <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
            <p className="text-sm text-zinc-500 mb-2">Words to update ({selectedSuggested.length}):</p>
            <p className="font-mono text-sm text-emerald-400">{selectedSuggested.join(", ")}</p>
          </div>
        )}
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        {comparisons.map((comp) => (
          <div key={comp.word} className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
            <div className="mb-4">
              <p className="text-zinc-500 text-sm mb-1">{comp.issue}</p>
              <p className="text-zinc-400 text-xs italic">{comp.rationale}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => handleChoice(comp.word, "current")}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  choices[comp.word] === "current"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wide">Current</p>
                <div className="text-4xl mb-4">
                  <GalleryWord
                    word={comp.word}
                    variant={comp.current}
                    colorMode="dark"
                  />
                </div>
                <div className="text-xs text-zinc-600 font-mono space-y-1">
                  <p>{comp.current.family} {comp.current.weight}</p>
                  <p>H:{comp.current.colorIntent.hue} C:{comp.current.colorIntent.chroma} L:{comp.current.colorIntent.lightness}</p>
                </div>
              </button>

              <button
                onClick={() => handleChoice(comp.word, "suggested")}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  choices[comp.word] === "suggested"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wide">Suggested</p>
                <div className="text-4xl mb-4">
                  <GalleryWord
                    word={comp.word}
                    variant={comp.suggested}
                    colorMode="dark"
                  />
                </div>
                <div className="text-xs text-zinc-600 font-mono space-y-1">
                  <p>{comp.suggested.family} {comp.suggested.weight}</p>
                  <p>H:{comp.suggested.colorIntent.hue} C:{comp.suggested.colorIntent.chroma} L:{comp.suggested.colorIntent.lightness}</p>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedSuggested.length > 0 && (
        <div className="max-w-4xl mx-auto mt-12 p-6 bg-zinc-900 rounded-xl border border-zinc-800">
          <h2 className="text-lg font-light mb-4">Apply Changes</h2>
          <p className="text-zinc-400 text-sm mb-4">
            You've selected {selectedSuggested.length} word{selectedSuggested.length > 1 ? "s" : ""} to update.
            Let me know when you're ready and I'll update the vetted-styles.json file.
          </p>
          <pre className="bg-zinc-950 p-4 rounded-lg text-xs font-mono text-zinc-400 overflow-x-auto">
{JSON.stringify(
  selectedSuggested.reduce((acc, word) => {
    const comp = comparisons.find(c => c.word === word)
    if (comp) acc[word] = comp.suggested
    return acc
  }, {} as Record<string, FontVariant>),
  null,
  2
)}
          </pre>
        </div>
      )}
    </div>
  )
}
