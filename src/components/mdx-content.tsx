"use client"

import { useMemo } from "react"
import { parseMarkdown, parseRelatedWordItem, type ParsedSection } from "@/lib/markdown"
import { ScrollRevealSection } from "./scroll-reveal-section"

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

function SectionHeading({
  content,
  mutedColor,
}: {
  content: string
  mutedColor?: string
}) {
  return (
    <div className="max-w-3xl mx-auto pt-16">
      <h2
        className="text-[length:var(--text-fluid-sm)] uppercase tracking-widest mb-8 pb-4 transition-colors duration-700 text-balance border-b"
        style={{
          color: mutedColor || "var(--tint-muted)",
          borderBottomColor: `color-mix(in oklch, ${mutedColor || "var(--tint-muted)"} 50%, transparent)`,
          opacity: 0.6,
          fontFamily: "var(--font-serif), Georgia, serif",
        }}
      >
        {content}
      </h2>
    </div>
  )
}

function SectionParagraph({
  content,
  textColor,
}: {
  content: string
  textColor?: string
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <p
        className="text-[length:var(--text-fluid-body)] leading-[1.8] font-normal transition-colors duration-700 text-pretty"
        style={{ color: textColor || "var(--tint-text)" }}
      >
        {formatInlineMarkdown(content)}
      </p>
    </div>
  )
}

function SectionBlockquote({
  content,
  mutedColor,
}: {
  content: string
  mutedColor?: string
}) {
  return (
    <blockquote
      className="max-w-5xl mx-auto py-12 md:py-16 lg:py-20 text-[length:var(--text-fluid-quote)] leading-[1.3] transition-colors duration-700 text-balance text-center typography-display"
      style={{ color: mutedColor || "var(--tint-muted)" }}
    >
      {formatInlineMarkdown(content)}
    </blockquote>
  )
}

function RelatedWordsList({
  items,
  textColor,
}: {
  items: { word: string; description: string }[]
  textColor?: string
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-2 gap-x-8 gap-y-10">
        {items.map((item, j) => (
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
  )
}

function SectionList({
  items,
  mutedColor,
}: {
  items: string[]
  mutedColor?: string
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <ul
        className="space-y-4 text-[length:var(--text-fluid-body)]"
        style={{ color: mutedColor || "var(--tint-muted)" }}
      >
        {items.map((item, j) => (
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
  )
}

function computeRelatedWordsIndices(sections: ParsedSection[]): Set<number> {
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
}

interface MdxContentProps {
  content: string
  textColor?: string
  mutedColor?: string
  reducedMotion: boolean
}

export function MdxContent({
  content,
  textColor,
  mutedColor,
  reducedMotion,
}: MdxContentProps) {
  const sections = useMemo(() => parseMarkdown(content), [content])
  const relatedWordsIndices = useMemo(
    () => computeRelatedWordsIndices(sections),
    [sections]
  )

  return (
    <div className="space-y-8">
      {sections.map((section, i) => {
        const delay = i * 0.05
        const isRelatedWordsList = relatedWordsIndices.has(i)

        if (section.type === "heading" && section.level === 2) {
          return (
            <ScrollRevealSection key={i} reducedMotion={reducedMotion} delay={delay}>
              <SectionHeading content={section.content} mutedColor={mutedColor} />
            </ScrollRevealSection>
          )
        }

        if (section.type === "paragraph") {
          return (
            <ScrollRevealSection key={i} reducedMotion={reducedMotion} delay={delay}>
              <SectionParagraph content={section.content} textColor={textColor} />
            </ScrollRevealSection>
          )
        }

        if (section.type === "blockquote") {
          return (
            <ScrollRevealSection key={i} reducedMotion={reducedMotion} delay={delay}>
              <SectionBlockquote content={section.content} mutedColor={mutedColor} />
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
                <ScrollRevealSection key={i} reducedMotion={reducedMotion} delay={delay}>
                  <RelatedWordsList items={parsedItems} textColor={textColor} />
                </ScrollRevealSection>
              )
            }
          }

          return (
            <ScrollRevealSection key={i} reducedMotion={reducedMotion} delay={delay}>
              <SectionList items={section.items} mutedColor={mutedColor} />
            </ScrollRevealSection>
          )
        }

        return null
      })}
    </div>
  )
}
