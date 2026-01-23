"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { motion, useInView } from "motion/react"
import type { FontVariant } from "@/lib/schemas"
import { deriveTintedTextColor, deriveTintedMutedColor } from "@/lib/color"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { WordContent } from "@/lib/words"
import { useTuning } from "@/components/gallery/masonry/tuning-context"

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

interface ParsedSection {
  type: "heading" | "paragraph" | "blockquote" | "list"
  level?: number
  content: string
  items?: string[]
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
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].startsWith("#") &&
        !lines[i].startsWith(">") &&
        !lines[i].startsWith("- ")
      ) {
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

function ScrollRevealSection({
  children,
  reducedMotion,
  delay = 0,
}: {
  children: React.ReactNode
  reducedMotion: boolean
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  if (reducedMotion) {
    return <div>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 12, filter: "blur(4px)" }
      }
      transition={{ type: "spring", stiffness: 60, damping: 16, delay }}
    >
      {children}
    </motion.div>
  )
}

function parseRelatedWordItem(
  item: string
): { word: string; description: string } | null {
  const match = item.match(/^\*\*(.+?)\*\*\s*\((.+)\)$/)
  if (match) {
    return { word: match[1], description: match[2] }
  }
  return null
}

function MdxContent({
  content,
  textColor,
  mutedColor,
  reducedMotion,
}: {
  content: string
  textColor?: string
  mutedColor?: string
  reducedMotion: boolean
}) {
  const sections = useMemo(() => parseMarkdown(content), [content])

  const relatedWordsIndices = useMemo(() => {
    const indices = new Set<number>()
    let inRelatedWordsSection = false
    sections.forEach((section, i) => {
      if (section.type === "heading" && section.level === 2) {
        inRelatedWordsSection = section.content.toLowerCase() === "related words"
      } else if (section.type === "list" && inRelatedWordsSection) {
        indices.add(i)
        inRelatedWordsSection = false
      } else {
        inRelatedWordsSection = false
      }
    })
    return indices
  }, [sections])

  return (
    <div className="space-y-8">
      {sections.map((section, i) => {
        const delay = i * 0.05
        const isRelatedWordsList = relatedWordsIndices.has(i)

        if (section.type === "heading" && section.level === 2) {
          return (
            <ScrollRevealSection key={i} reducedMotion={reducedMotion} delay={delay}>
              <div className="max-w-3xl mx-auto pt-16">
                <h2
                  className="text-[18px] uppercase tracking-wider mb-8 pb-4 transition-colors duration-700 text-balance border-b"
                  style={{
                    color: mutedColor || "var(--tint-muted)",
                    borderBottomColor: `color-mix(in oklch, ${
                      mutedColor || "var(--tint-muted)"
                    } 50%, transparent)`,
                    opacity: 0.6,
                    fontFamily: "var(--font-serif), Georgia, serif",
                  }}
                >
                  {section.content}
                </h2>
              </div>
            </ScrollRevealSection>
          )
        }
        if (section.type === "paragraph") {
          return (
            <ScrollRevealSection key={i} reducedMotion={reducedMotion} delay={delay}>
              <div className="max-w-3xl mx-auto">
                <p
                  className="text-[length:var(--text-fluid-body)] leading-[1.8] font-normal transition-colors duration-700 text-pretty"
                  style={{ color: textColor || "var(--tint-text)" }}
                >
                  {formatInlineMarkdown(section.content)}
                </p>
              </div>
            </ScrollRevealSection>
          )
        }
        if (section.type === "blockquote") {
          return (
            <ScrollRevealSection key={i} reducedMotion={reducedMotion} delay={delay}>
              <blockquote
                className="max-w-5xl mx-auto py-12 md:py-16 lg:py-20 text-[length:var(--text-fluid-quote)] leading-[1.3] transition-colors duration-700 text-balance text-center typography-display"
                style={{ color: mutedColor || "var(--tint-muted)" }}
              >
                {formatInlineMarkdown(section.content)}
              </blockquote>
            </ScrollRevealSection>
          )
        }
        if (section.type === "list" && section.items) {
          if (isRelatedWordsList) {
            const parsedItems = section.items
              .map(parseRelatedWordItem)
              .filter(Boolean) as { word: string; description: string }[]

            if (parsedItems.length > 0) {
              return (
                <ScrollRevealSection
                  key={i}
                  reducedMotion={reducedMotion}
                  delay={delay}
                >
                  <div className="max-w-3xl mx-auto">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                      {parsedItems.map((item, j) => (
                        <div key={j} className="flex flex-col">
                          <span
                            className="font-medium transition-colors duration-700"
                            style={{
                              color: textColor || "var(--tint-text)",
                              fontSize: "calc(var(--text-fluid-body) * 0.9)",
                            }}
                          >
                            {item.word}
                          </span>
                          <span
                            className="leading-relaxed mt-1.5 transition-colors duration-700 text-pretty italic"
                            style={{
                              color: textColor || "var(--tint-text)",
                              opacity: 0.65,
                              fontSize: "calc(var(--text-fluid-body) * 0.7)",
                            }}
                          >
                            {item.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollRevealSection>
              )
            }
          }

          return (
            <ScrollRevealSection key={i} reducedMotion={reducedMotion} delay={delay}>
              <div className="max-w-3xl mx-auto">
                <ul
                  className="space-y-4 text-[length:var(--text-fluid-body)]"
                  style={{ color: mutedColor || "var(--tint-muted)" }}
                >
                  {section.items.map((item, j) => (
                    <li key={j} className="flex gap-3">
                      <span
                        style={{
                          color: mutedColor || "var(--tint-muted)",
                          opacity: 0.5,
                        }}
                      >
                        •
                      </span>
                      <span>{formatInlineMarkdown(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollRevealSection>
          )
        }
        return null
      })}
    </div>
  )
}

interface OverlayContentProps {
  word: string
  variant: FontVariant
  content: WordContent | null
  isLoading: boolean
}

export function OverlayContent({
  word,
  variant,
  content,
  isLoading,
}: OverlayContentProps) {
  const prefersReducedMotion = useReducedMotion()
  const tuning = useTuning()
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null)
  const [definitionLoaded, setDefinitionLoaded] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset state when word changes
    setDefinition(null)
    setDefinitionLoaded(false)
    fetchDefinition(word).then((entry) => {
      setDefinition(entry)
      setDefinitionLoaded(true)
    })
  }, [word])

  const phonetic = content?.frontmatter.phonetic || definition?.phonetic
  const partOfSpeech =
    content?.frontmatter.partOfSpeech || definition?.meanings[0]?.partOfSpeech
  const hasMdxContent = content && content.content.length > 0

  const ready = !isLoading && definitionLoaded
  const textColor = ready ? deriveTintedTextColor(variant.colorIntent) : undefined
  const mutedColor = ready ? deriveTintedMutedColor(variant.colorIntent) : undefined

  const contentDelay = (tuning.overlayContentDelay ?? 200) / 1000

  return (
    <motion.div
      className="w-full px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      transition={{ duration: 0.3, delay: contentDelay }}
    >
      {(partOfSpeech || phonetic) && (
        <p
          className="text-[length:var(--text-fluid-caption)] font-light tracking-[0.15em] mb-28 text-center transition-colors duration-700"
          style={{
            color: mutedColor || "var(--tint-muted)",
            opacity: 0.8,
            fontFamily: "var(--font-serif), Georgia, serif",
          }}
        >
          {partOfSpeech && (
            <span className="uppercase text-[0.85em]">{partOfSpeech}</span>
          )}
          {partOfSpeech && phonetic && <span className="mx-3 opacity-50">·</span>}
          {phonetic && <span>{phonetic}</span>}
        </p>
      )}

      <div
        className="w-full typography-display"
        style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
      >
        {hasMdxContent ? (
          <MdxContent
            content={content!.content}
            textColor={textColor}
            mutedColor={mutedColor}
            reducedMotion={prefersReducedMotion}
          />
        ) : definition ? (
          <div className="max-w-3xl mx-auto">
            <div className="space-y-16">
              {definition.meanings.map((meaning, i) => (
                <ScrollRevealSection
                  key={i}
                  reducedMotion={prefersReducedMotion}
                  delay={i * 0.1}
                >
                  <section>
                    {i > 0 && (
                      <div
                        className="mb-16 h-px transition-colors duration-700"
                        style={{
                          backgroundColor: mutedColor || "var(--tint-muted)",
                          opacity: 0.2,
                        }}
                      />
                    )}

                    <ol className="space-y-10">
                      {meaning.definitions.slice(0, 3).map((def, j) => (
                        <li key={j} className="flex gap-7">
                          <span className="font-sans text-zinc-600 text-[1.4rem] tabular-nums flex-shrink-0 pt-1 select-none">
                            {j + 1}.
                          </span>

                          <div className="space-y-7">
                            <p
                              className="text-[length:var(--text-fluid-body)] leading-[1.7] font-normal transition-colors duration-700 text-pretty"
                              style={{ color: textColor || "var(--tint-text)" }}
                            >
                              {def.definition}
                            </p>

                            {def.example && (
                              <p
                                className="text-[length:var(--text-fluid-quote)] leading-[1.5] italic transition-colors duration-700 -mx-8 px-8 md:-mx-16 md:px-16 lg:-mx-24 lg:px-24 text-balance text-center typography-display"
                                style={{ color: mutedColor || "var(--tint-muted)" }}
                              >
                                &ldquo;{def.example}&rdquo;
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                </ScrollRevealSection>
              ))}
            </div>
          </div>
        ) : (
          !isLoading && (
            <p className="text-zinc-500 text-center text-[length:var(--text-fluid-caption)]">
              No definition found.
            </p>
          )
        )}
      </div>
    </motion.div>
  )
}
