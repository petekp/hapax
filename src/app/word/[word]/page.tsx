"use client"

import { useEffect, useState, use } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import type { FontVariant } from "@/lib/schemas"
import { deriveColor, deriveBackgroundColor, deriveTintedTextColor, deriveTintedMutedColor } from "@/lib/color"
import { useActiveColor } from "@/lib/active-color-context"
import { getFontLoader } from "@/lib/font-loader"
import type { WordResponse } from "@/app/api/word/[word]/route"
import type { WordContent } from "@/lib/words"

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

async function fetchWordContent(word: string): Promise<WordContent | null> {
  try {
    const response = await fetch(`/api/word/${encodeURIComponent(word)}`)
    if (!response.ok) return null
    const data: WordResponse = await response.json()
    return data.content
  } catch {
    return null
  }
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

function StyledWord({ word, variant }: { word: string; variant: FontVariant }) {
  const color = deriveColor(variant.colorIntent, "dark")

  return (
    <span
      style={{
        color,
        fontFamily: `"${variant.family}", sans-serif`,
        fontWeight: variant.weight,
        fontStyle: variant.style,
      }}
      className="text-6xl md:text-8xl"
    >
      {word}
    </span>
  )
}

export default function WordPage({ params }: { params: Promise<{ word: string }> }) {
  const { word } = use(params)
  const decodedWord = decodeURIComponent(word)
  const { setActiveColor } = useActiveColor()

  const [wordContent, setWordContent] = useState<WordContent | null>(null)
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null)
  const [contentLoaded, setContentLoaded] = useState(false)
  const [definitionLoaded, setDefinitionLoaded] = useState(false)
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    fetchWordContent(decodedWord).then((content) => {
      setWordContent(content)
      setContentLoaded(true)
    })
    fetchDefinition(decodedWord).then((entry) => {
      setDefinition(entry)
      setDefinitionLoaded(true)
    })
  }, [decodedWord])

  useEffect(() => {
    if (wordContent) {
      setActiveColor(wordContent.frontmatter.style.colorIntent)
    }
    return () => setActiveColor(null)
  }, [wordContent, setActiveColor])

  const fallbackVariant: FontVariant = {
    family: "Inter",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 220, chroma: 0.15, lightness: 70 },
  }

  const variant = wordContent?.frontmatter.style || fallbackVariant
  const phonetic = wordContent?.frontmatter.phonetic || definition?.phonetic
  const hasMdxContent = wordContent && wordContent.content.length > 0

  useEffect(() => {
    if (!contentLoaded) return
    const fontLoader = getFontLoader()
    fontLoader.requestFont(variant, decodedWord, () => setFontLoaded(true))
  }, [contentLoaded, variant, decodedWord])

  const ready = contentLoaded && definitionLoaded && fontLoaded
  const backgroundColor = ready ? deriveBackgroundColor(variant.colorIntent) : undefined
  const textColor = ready ? deriveTintedTextColor(variant.colorIntent) : undefined
  const mutedColor = ready ? deriveTintedMutedColor(variant.colorIntent) : undefined

  return (
    <div
      className="min-h-screen text-zinc-200 transition-colors duration-700"
      style={{ backgroundColor: backgroundColor || "#09090b" }}
    >
      <header className="fixed top-0 left-0 p-8 z-10">
        <Link
          href="/"
          className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm tracking-wide uppercase"
        >
          Back
        </Link>
      </header>

      <main className="flex flex-col items-center px-6 pt-32 pb-24">
        <motion.div
          className="flex flex-col items-center w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-4">
            <StyledWord word={decodedWord} variant={variant} />
          </div>

          {phonetic && (
            <p className="text-zinc-500 text-lg font-light tracking-wide mb-20">
              {phonetic}
            </p>
          )}

          <div className="max-w-prose w-full" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
            {definition ? (
              <div className="space-y-14">
                {definition.meanings.map((meaning, i) => (
                  <section key={i}>
                    <h2 className="font-sans text-zinc-500 text-[11px] uppercase tracking-wider mb-8 pb-3 border-b border-zinc-800/60">
                      {meaning.partOfSpeech}
                    </h2>

                    <ol className="space-y-7">
                      {meaning.definitions.slice(0, 3).map((def, j) => (
                        <li key={j} className="flex gap-5">
                          <span className="font-sans text-zinc-600 text-base tabular-nums flex-shrink-0 pt-1 select-none">
                            {j + 1}.
                          </span>

                          <div className="space-y-5">
                            <p
                              className="text-2xl leading-[1.7] font-normal transition-colors duration-700"
                              style={{ color: textColor || "#e4e4e7" }}
                            >
                              {def.definition}
                            </p>

                            {def.example && (
                              <p
                                className="text-xl leading-[1.65] italic pl-5 border-l border-zinc-700/50 transition-colors duration-700"
                                style={{ color: mutedColor || "#a1a1aa" }}
                              >
                                "{def.example}"
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
              <p className="text-zinc-500 text-center text-lg">
                No definition found.
              </p>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
