"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import type { FontVariant } from "@/lib/schemas"
import { deriveTintedTextColor, deriveTintedMutedColor } from "@/lib/color"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { WordContent } from "@/lib/words"
import { useTuning } from "@/components/gallery/masonry/tuning-context"
import { MdxContent } from "@/components/mdx-content"
import { ScrollRevealSection } from "@/components/scroll-reveal-section"

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
