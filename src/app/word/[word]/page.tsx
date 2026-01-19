"use client"

import { useEffect, useState, use, useMemo, ViewTransition } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import type { FontVariant } from "@/lib/schemas"
import { deriveColor, deriveTintedTextColor, deriveTintedMutedColor } from "@/lib/color"
import { useActiveColor } from "@/lib/active-color-context"
import { getFontLoader } from "@/lib/font-loader"
import type { WordResponse } from "@/app/api/word/[word]/route"
import type { WordContent } from "@/lib/words"

interface ParsedSection {
  type: "heading" | "paragraph" | "blockquote" | "list"
  level?: number
  content: string
  items?: string[]
}

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

type LetterAnimation = {
  initial: Record<string, number | string>
  animate: Record<string, number | string>
  transition: Record<string, unknown>
}

const letterAnimations: LetterAnimation[] = [
  // Fade up with slight rotation
  {
    initial: { opacity: 0, y: 16, rotateX: -30 },
    animate: { opacity: 1, y: 0, rotateX: 0 },
    transition: { type: "spring", stiffness: 70, damping: 16 },
  },
  // Blur fade in
  {
    initial: { opacity: 0, filter: "blur(10px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    transition: { type: "spring", stiffness: 60, damping: 18 },
  },
  // Scale from center
  {
    initial: { opacity: 0, scale: 0.7 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 80, damping: 14 },
  },
  // Slide in from below with fade
  {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 65, damping: 14 },
  },
  // Subtle scale with blur
  {
    initial: { opacity: 0, scale: 0.9, filter: "blur(6px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    transition: { type: "spring", stiffness: 70, damping: 16 },
  },
  // 3D flip from side
  {
    initial: { opacity: 0, rotateY: -70 },
    animate: { opacity: 1, rotateY: 0 },
    transition: { type: "spring", stiffness: 55, damping: 14 },
  },
  // Drop from above
  {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 80, damping: 12 },
  },
  // Slide from left
  {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    transition: { type: "spring", stiffness: 70, damping: 16 },
  },
  // Soft fade (minimal movement, elegant)
  {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { type: "spring", stiffness: 40, damping: 14 },
  },
  // Scale down from large with blur
  {
    initial: { opacity: 0, scale: 1.3, filter: "blur(8px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    transition: { type: "spring", stiffness: 60, damping: 16 },
  },
  // Slide from right
  {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    transition: { type: "spring", stiffness: 70, damping: 16 },
  },
  // Gentle spin
  {
    initial: { opacity: 0, rotate: -90, scale: 0.7 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    transition: { type: "spring", stiffness: 50, damping: 14 },
  },
  // Vertical flip from top
  {
    initial: { opacity: 0, rotateX: 60 },
    animate: { opacity: 1, rotateX: 0 },
    transition: { type: "spring", stiffness: 60, damping: 14 },
  },
  // Rise with scale
  {
    initial: { opacity: 0, y: 24, scale: 0.85 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { type: "spring", stiffness: 70, damping: 16 },
  },
  // Soft pop
  {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 100, damping: 14 },
  },
  // Slide up with blur
  {
    initial: { opacity: 0, y: 20, filter: "blur(5px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { type: "spring", stiffness: 60, damping: 14 },
  },
  // Gentle drift diagonal
  {
    initial: { opacity: 0, x: -12, y: 12 },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { type: "spring", stiffness: 55, damping: 14 },
  },
  // Zoom blur
  {
    initial: { opacity: 0, scale: 1.6, filter: "blur(12px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    transition: { type: "spring", stiffness: 50, damping: 16 },
  },
  // Squeeze horizontal
  {
    initial: { opacity: 0, scaleX: 0.5, scaleY: 1.1 },
    animate: { opacity: 1, scaleX: 1, scaleY: 1 },
    transition: { type: "spring", stiffness: 80, damping: 14 },
  },
  // Float up ethereal
  {
    initial: { opacity: 0, y: 35, filter: "blur(3px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { type: "spring", stiffness: 40, damping: 12 },
  },
]

// Simple hash function to get deterministic animation per word
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function StyledWord({ word, variant, ready }: { word: string; variant: FontVariant; ready: boolean }) {
  const color = deriveColor(variant.colorIntent, "dark")

  // Pick animation based on word hash (deterministic for SSR)
  const animation = letterAnimations[hashString(word) % letterAnimations.length]

  const letters = word.split("")

  return (
    <span
      style={{
        fontFamily: `"${variant.family}", sans-serif`,
        fontWeight: variant.weight,
        fontStyle: variant.style,
        perspective: "1000px",
      }}
      className="text-[5.25rem] md:text-[8.5rem] inline-flex"
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          style={{
            color,
            display: "inline-block",
            whiteSpace: letter === " " ? "pre" : "normal",
          }}
          initial={animation.initial}
          animate={ready ? animation.animate : animation.initial}
          transition={{
            ...animation.transition,
            delay: i * 0.04,
          }}
        >
          {letter}
        </motion.span>
      ))}
    </span>
  )
}

function parseMarkdown(content: string): ParsedSection[] {
  const lines = content.split("\n")
  const sections: ParsedSection[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("## ")) {
      sections.push({ type: "heading", level: 2, content: line.slice(3) })
      i++
    } else if (line.startsWith("> ")) {
      let quote = line.slice(2)
      i++
      while (i < lines.length && lines[i].startsWith("> ")) {
        quote += "\n" + lines[i].slice(2)
        i++
      }
      sections.push({ type: "blockquote", content: quote })
    } else if (line.startsWith("- ")) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2))
        i++
      }
      sections.push({ type: "list", content: "", items })
    } else if (line.trim()) {
      let para = line
      i++
      while (i < lines.length && lines[i].trim() && !lines[i].startsWith("#") && !lines[i].startsWith(">") && !lines[i].startsWith("- ")) {
        para += " " + lines[i]
        i++
      }
      sections.push({ type: "paragraph", content: para })
    } else {
      i++
    }
  }

  return sections
}

function formatInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    const italicMatch = remaining.match(/\*(.+?)\*/)

    const boldIndex = boldMatch?.index ?? Infinity
    const italicIndex = italicMatch?.index ?? Infinity

    if (boldIndex === Infinity && italicIndex === Infinity) {
      parts.push(remaining)
      break
    }

    if (boldIndex <= italicIndex && boldMatch) {
      if (boldIndex > 0) {
        parts.push(remaining.slice(0, boldIndex))
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldIndex + boldMatch[0].length)
    } else if (italicMatch) {
      if (italicIndex > 0) {
        parts.push(remaining.slice(0, italicIndex))
      }
      parts.push(<em key={key++}>{italicMatch[1]}</em>)
      remaining = remaining.slice(italicIndex + italicMatch[0].length)
    }
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts
}

function MdxContent({ content, textColor, mutedColor }: { content: string; textColor?: string; mutedColor?: string }) {
  const sections = useMemo(() => parseMarkdown(content), [content])

  return (
    <div className="space-y-11">
      {sections.map((section, i) => {
        if (section.type === "heading" && section.level === 2) {
          return (
            <h2 key={i} className="font-sans text-zinc-500 text-[15px] uppercase tracking-wider mt-20 mb-11 pb-4 border-b border-zinc-800/60 first:mt-0">
              {section.content}
            </h2>
          )
        }
        if (section.type === "paragraph") {
          return (
            <p
              key={i}
              className="text-[2.1rem] leading-[1.7] font-normal transition-colors duration-700"
              style={{ color: textColor || "var(--tint-text)" }}
            >
              {formatInlineMarkdown(section.content)}
            </p>
          )
        }
        if (section.type === "blockquote") {
          return (
            <blockquote
              key={i}
              className="text-[1.75rem] leading-[1.65] pl-7 border-l border-zinc-700/50 transition-colors duration-700"
              style={{ color: mutedColor || "var(--tint-muted)" }}
            >
              {formatInlineMarkdown(section.content)}
            </blockquote>
          )
        }
        if (section.type === "list" && section.items) {
          return (
            <ul key={i} className="space-y-3 text-[1.75rem]" style={{ color: mutedColor || "var(--tint-muted)" }}>
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span className="text-zinc-600">•</span>
                  <span>{formatInlineMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          )
        }
        return null
      })}
    </div>
  )
}

export default function WordPage({ params }: { params: Promise<{ word: string }> }) {
  const { word } = use(params)
  const decodedWord = decodeURIComponent(word)
  const { setActiveColor, tintColors } = useActiveColor()

  const [wordContent, setWordContent] = useState<WordContent | null>(null)
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null)
  const [contentLoaded, setContentLoaded] = useState(false)
  const [definitionLoaded, setDefinitionLoaded] = useState(false)
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchWordContent(decodedWord),
      fetchDefinition(decodedWord)
    ]).then(([content, entry]) => {
      setWordContent(content)
      setContentLoaded(true)
      setDefinition(entry)
      setDefinitionLoaded(true)
    })
  }, [decodedWord])

  useEffect(() => {
    if (wordContent) {
      setActiveColor(wordContent.frontmatter.style.colorIntent, "deep")
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
  const textColor = ready ? deriveTintedTextColor(variant.colorIntent) : undefined
  const mutedColor = ready ? deriveTintedMutedColor(variant.colorIntent) : undefined

  return (
    <ViewTransition name="page-background">
      <motion.div
        className="min-h-screen text-zinc-200"
        style={{ willChange: "background-color" }}
        animate={{ backgroundColor: tintColors.bg }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
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
            <StyledWord word={decodedWord} variant={variant} ready={ready} />
          </div>

          {phonetic && (
            <p className="text-zinc-500 text-[1.575rem] font-light tracking-wide mb-28">
              {phonetic}
            </p>
          )}

          <div className="max-w-[75ch] w-full" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
            {hasMdxContent ? (
              <MdxContent
                content={wordContent!.content}
                textColor={textColor}
                mutedColor={mutedColor}
              />
            ) : definition ? (
              <div className="space-y-20">
                {definition.meanings.map((meaning, i) => (
                  <section key={i}>
                    <h2 className="font-sans text-zinc-500 text-[15px] uppercase tracking-wider mb-11 pb-4 border-b border-zinc-800/60">
                      {meaning.partOfSpeech}
                    </h2>

                    <ol className="space-y-10">
                      {meaning.definitions.slice(0, 3).map((def, j) => (
                        <li key={j} className="flex gap-7">
                          <span className="font-sans text-zinc-600 text-[1.4rem] tabular-nums flex-shrink-0 pt-1 select-none">
                            {j + 1}.
                          </span>

                          <div className="space-y-7">
                            <p
                              className="text-[2.1rem] leading-[1.7] font-normal transition-colors duration-700"
                              style={{ color: textColor || "var(--tint-text)" }}
                            >
                              {def.definition}
                            </p>

                            {def.example && (
                              <p
                                className="text-[1.75rem] leading-[1.65] italic pl-7 border-l border-zinc-700/50 transition-colors duration-700"
                                style={{ color: mutedColor || "var(--tint-muted)" }}
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
              <p className="text-zinc-500 text-center text-[1.575rem]">
                No definition found.
              </p>
            )}
          </div>
        </motion.div>
      </main>
      </motion.div>
    </ViewTransition>
  )
}
