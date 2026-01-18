"use client"

import { useEffect, useState, use } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import type { FontVariant } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"
import { getFontLoader } from "@/lib/font-loader"
import type { GalleryWordEntry } from "@/app/api/gallery/route"

interface Definition {
  partOfSpeech: string
  definitions: Array<{
    definition: string
    example?: string
  }>
}

interface DictionaryEntry {
  word: string
  phonetic?: string
  meanings: Definition[]
}

async function fetchDefinition(word: string): Promise<DictionaryEntry | null> {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    )
    if (!response.ok) return null
    const data = await response.json()
    return data[0] || null
  } catch {
    return null
  }
}

async function fetchWordStyle(word: string): Promise<GalleryWordEntry | null> {
  try {
    const response = await fetch(`/api/gallery?search=${encodeURIComponent(word)}&limit=1`)
    if (!response.ok) return null
    const data = await response.json()
    return data.words[0] || null
  } catch {
    return null
  }
}

function StyledWord({ word, variant }: { word: string; variant: FontVariant }) {
  const [fontLoaded, setFontLoaded] = useState(false)
  const color = deriveColor(variant.colorIntent, "dark")
  const mutedColor = "hsl(0, 0%, 45%)"

  useEffect(() => {
    const fontLoader = getFontLoader()
    fontLoader.requestFont(variant, word, () => setFontLoaded(true))
  }, [variant, word])

  if (!fontLoaded) {
    return (
      <motion.span
        style={{ color: mutedColor }}
        animate={{ opacity: [0.4, 0.55], filter: ["blur(4px)", "blur(8px)"] }}
        transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
        className="text-6xl md:text-8xl"
      >
        {word}
      </motion.span>
    )
  }

  return (
    <motion.span
      style={{
        color,
        fontFamily: `"${variant.family}", sans-serif`,
        fontWeight: variant.weight,
        fontStyle: variant.style,
      }}
      initial={{ opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.4 }}
      className="text-6xl md:text-8xl"
    >
      {word}
    </motion.span>
  )
}

export default function WordPage({ params }: { params: Promise<{ word: string }> }) {
  const { word } = use(params)
  const decodedWord = decodeURIComponent(word)

  const [styleEntry, setStyleEntry] = useState<GalleryWordEntry | null>(null)
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null)
  const [styleLoading, setStyleLoading] = useState(true)
  const [definitionLoading, setDefinitionLoading] = useState(true)

  useEffect(() => {
    fetchWordStyle(decodedWord).then((entry) => {
      setStyleEntry(entry)
      setStyleLoading(false)
    })
    fetchDefinition(decodedWord).then((entry) => {
      setDefinition(entry)
      setDefinitionLoading(false)
    })
  }, [decodedWord])

  const fallbackVariant: FontVariant = {
    family: "Inter",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 220, chroma: 0.15, lightness: 70 },
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="fixed top-0 left-0 p-8 z-10">
        <Link
          href="/"
          className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm tracking-wide uppercase"
        >
          Back
        </Link>
      </header>

      <main className="flex flex-col items-center px-6 pt-32 pb-24">
        {/* Word display */}
        <div className="text-center mb-6">
          {styleLoading ? (
            <div className="text-6xl md:text-8xl lg:text-9xl text-zinc-700 animate-pulse">
              {decodedWord}
            </div>
          ) : (
            <StyledWord
              word={decodedWord}
              variant={styleEntry?.variant || fallbackVariant}
            />
          )}
        </div>

        {/* Phonetic - tight coupling with word */}
        {!definitionLoading && definition?.phonetic && (
          <p className="text-zinc-600 text-lg md:text-xl font-light tracking-wide mb-16">
            {definition.phonetic}
          </p>
        )}

        {/* Definitions */}
        <div className="max-w-xl w-full">
          {definitionLoading ? (
            <div className="space-y-6">
              <div className="h-4 bg-zinc-900 rounded animate-pulse w-20" />
              <div className="h-5 bg-zinc-900 rounded animate-pulse w-full" />
              <div className="h-5 bg-zinc-900 rounded animate-pulse w-4/5" />
            </div>
          ) : definition ? (
            <div className="space-y-12">
              {definition.meanings.map((meaning, i) => (
                <section key={i}>
                  {/* Part of speech */}
                  <h2 className="text-zinc-500 text-xs uppercase tracking-widest mb-6 pb-2 border-b border-zinc-800">
                    {meaning.partOfSpeech}
                  </h2>

                  {/* Definition list */}
                  <ol className="space-y-6">
                    {meaning.definitions.slice(0, 3).map((def, j) => (
                      <li key={j} className="flex gap-4">
                        {/* Definition number */}
                        <span className="text-zinc-700 text-sm font-light tabular-nums flex-shrink-0 pt-0.5">
                          {j + 1}.
                        </span>

                        <div className="space-y-3">
                          {/* Definition text */}
                          <p className="text-zinc-300 text-lg md:text-xl leading-relaxed font-light">
                            {def.definition}
                          </p>

                          {/* Example */}
                          {def.example && (
                            <p className="text-zinc-500 text-base leading-relaxed italic pl-4 border-l-2 border-zinc-800">
                              {def.example}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-center text-lg">
              No definition found.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
