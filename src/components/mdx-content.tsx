"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { FontVariant } from "@/lib/schemas"
import { deriveInkVariables } from "@/lib/color"
import { getFontLoader } from "@/lib/font-loader"
import { findRelatedWordsListIndices, parseMarkdown, parseRelatedWordItem } from "@/lib/markdown"
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
  isFirst = false,
}: {
  content: string
  textColor?: string
  isFirst?: boolean
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <p
        className={`text-[length:var(--text-fluid-body)] leading-[1.8] font-normal transition-colors duration-700 text-pretty ${isFirst ? "drop-cap" : ""}`}
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
  const hasQuotes = content.startsWith('"') || content.startsWith('"') || content.startsWith("'")

  return (
    <blockquote
      className="max-w-5xl mx-auto py-12 md:py-16 lg:py-20 text-[length:var(--text-fluid-quote)] leading-[1.3] transition-colors duration-700 text-balance text-center typography-display"
      style={{
        color: mutedColor || "var(--tint-muted)",
        textIndent: hasQuotes ? "-0.4em" : undefined,
      }}
    >
      {formatInlineMarkdown(content)}
    </blockquote>
  )
}

// A related word that's in the collection, set in its own typeface and color
function RelatedWordLink({
  word,
  variant,
  onNavigate,
}: {
  word: string
  variant: FontVariant
  onNavigate?: (word: string, variant: FontVariant) => void
}) {
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    getFontLoader().requestFont(variant, word, () => setFontLoaded(true))
  }, [variant, word])

  const className =
    "ink self-start text-left underline-offset-[0.18em] decoration-[0.05em] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm transition-opacity duration-500"
  const style = {
    ...deriveInkVariables(variant.colorIntent),
    fontFamily: `"${variant.family}", serif`,
    fontWeight: variant.weight,
    fontStyle: variant.style,
    fontSize: "var(--text-fluid-body)",
    lineHeight: 1.2,
    opacity: fontLoaded ? 1 : 0,
    textDecorationColor: "color-mix(in oklch, currentColor 45%, transparent)",
  }

  if (onNavigate) {
    return (
      <button type="button" className={className} style={style} onClick={() => onNavigate(word, variant)}>
        {word}
      </button>
    )
  }

  return (
    <Link href={`/word/${encodeURIComponent(word.toLowerCase())}`} className={className} style={style}>
      {word}
    </Link>
  )
}

function RelatedWordsList({
  items,
  textColor,
  relatedStyles,
  onNavigate,
}: {
  items: { word: string; description: string }[]
  textColor?: string
  relatedStyles?: Record<string, FontVariant>
  onNavigate?: (word: string, variant: FontVariant) => void
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid grid-cols-2 gap-x-8 gap-y-10">
        {items.map((item, j) => {
          const variant = relatedStyles?.[item.word.toLowerCase()]
          return (
            <div key={j} className="flex flex-col">
              {variant ? (
                <RelatedWordLink word={item.word} variant={variant} onNavigate={onNavigate} />
              ) : (
                // Not in the collection, so it recedes behind the words you can visit
                <span
                  className="font-medium transition-colors duration-700"
                  style={{
                    color: textColor || "var(--tint-text)",
                    fontSize: "calc(var(--text-fluid-body) * 0.9)",
                    opacity: 0.55,
                  }}
                >
                  {item.word}
                </span>
              )}
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
          )
        })}
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

const WEIGHT_NAMES: Record<number, string> = {
  100: "Thin",
  200: "ExtraLight",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
  800: "ExtraBold",
  900: "Black",
}

// "Alegreya Italic", "Cinzel SemiBold", "Space Mono Regular"
function typefaceName(variant: FontVariant): string {
  const italic = variant.style === "italic"
  const weight = variant.weight === 400 && italic ? "" : WEIGHT_NAMES[variant.weight]
  return [variant.family, weight, italic ? "Italic" : ""].filter(Boolean).join(" ")
}

export interface ColophonInfo {
  variant: FontVariant
  designer: string | null
  note?: string
}

// Credits for the word's typeface and color, and the curator's reasoning
function Colophon({
  variant,
  designer,
  note,
  textColor,
  mutedColor,
}: ColophonInfo & { textColor?: string; mutedColor?: string }) {
  const name = typefaceName(variant)
  const [fontLoaded, setFontLoaded] = useState(false)

  useEffect(() => {
    getFontLoader().requestFont(variant, name, () => setFontLoaded(true))
  }, [variant, name])

  const { hue, chroma, lightness } = variant.colorIntent
  const smallText = { color: mutedColor || "var(--tint-muted)", fontSize: "calc(var(--text-fluid-body) * 0.7)" }

  return (
    <div className="max-w-3xl mx-auto" style={deriveInkVariables(variant.colorIntent)}>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div>
          {/* The typeface's name, set in the typeface */}
          <p
            className="ink transition-opacity duration-500"
            style={{
              fontFamily: `"${variant.family}", serif`,
              fontWeight: variant.weight,
              fontStyle: variant.style,
              fontSize: "var(--text-fluid-body)",
              lineHeight: 1.2,
              opacity: fontLoaded ? 1 : 0,
            }}
          >
            {name}
          </p>
          {designer && (
            <p className="mt-1.5 leading-relaxed" style={smallText}>
              {designer}
            </p>
          )}
        </div>
        <p className="flex items-center gap-3 sm:justify-self-end tabular-nums" style={smallText}>
          <span aria-hidden className="ink inline-block size-[0.9em] rounded-full" style={{ backgroundColor: "currentColor" }} />
          oklch({lightness}% {chroma} {hue})
        </p>
      </div>
      {note && (
        <p
          className="mt-10 leading-[1.7] italic text-pretty transition-colors duration-700"
          style={{
            color: textColor || "var(--tint-text)",
            opacity: 0.8,
            fontSize: "calc(var(--text-fluid-body) * 0.8)",
          }}
        >
          {formatInlineMarkdown(note)}
        </p>
      )}
    </div>
  )
}

interface MdxContentProps {
  content: string
  textColor?: string
  mutedColor?: string
  reducedMotion: boolean
  relatedStyles?: Record<string, FontVariant>
  // Called when a linked related word is chosen; without it, related words are page links
  onNavigate?: (word: string, variant: FontVariant) => void
  colophon?: ColophonInfo
}

export function MdxContent({
  content,
  textColor,
  mutedColor,
  reducedMotion,
  relatedStyles,
  onNavigate,
  colophon,
}: MdxContentProps) {
  const sections = useMemo(() => parseMarkdown(content), [content])
  const relatedWordsIndices = useMemo(
    () => findRelatedWordsListIndices(sections),
    [sections]
  )
  const firstParagraphIndex = useMemo(
    () => sections.findIndex((s) => s.type === "paragraph"),
    [sections]
  )

  return (
    <div className="space-y-8">
      {sections.map((section, i) => {
        const delay = i * 0.05
        const isRelatedWordsList = relatedWordsIndices.has(i)
        const isFirstParagraph = i === firstParagraphIndex

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
              <SectionParagraph content={section.content} textColor={textColor} isFirst={isFirstParagraph} />
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
                  <RelatedWordsList
                    items={parsedItems}
                    textColor={textColor}
                    relatedStyles={relatedStyles}
                    onNavigate={onNavigate}
                  />
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

      {colophon && (
        <>
          <ScrollRevealSection reducedMotion={reducedMotion}>
            <SectionHeading content="Colophon" mutedColor={mutedColor} />
          </ScrollRevealSection>
          <ScrollRevealSection reducedMotion={reducedMotion}>
            <Colophon {...colophon} textColor={textColor} mutedColor={mutedColor} />
          </ScrollRevealSection>
        </>
      )}
    </div>
  )
}
