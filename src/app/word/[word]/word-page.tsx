"use client"

import { useEffect, useState, useRef, forwardRef, useCallback } from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { FontVariant } from "@/lib/schemas"
import { deriveColor, deriveTintedTextColor, deriveTintedMutedColor, deriveTintedMutedColorHex } from "@/lib/color"
import { useActiveColor } from "@/lib/active-color-context"
import { getFontLoader } from "@/lib/font-loader"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { WordContent } from "@/lib/words"
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

type LetterAnimation = {
  initial: Record<string, number | string>
  animate: Record<string, number | string>
  transition: Record<string, unknown>
}

const letterAnimations: LetterAnimation[] = [
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
    transition: { type: "spring", stiffness: 80, damping: 16 },
  },
  // Slide in from below with fade
  {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 65, damping: 16 },
  },
  // Subtle scale with blur
  {
    initial: { opacity: 0, scale: 0.9, filter: "blur(6px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    transition: { type: "spring", stiffness: 70, damping: 16 },
  },
  // Drop from above
  {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", stiffness: 80, damping: 16 },
  },
  // Slide from left
  {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    transition: { type: "spring", stiffness: 70, damping: 16 },
  },
  // Soft fade
  {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { type: "spring", stiffness: 40, damping: 16 },
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
    transition: { type: "spring", stiffness: 100, damping: 16 },
  },
  // Slide up with blur
  {
    initial: { opacity: 0, y: 20, filter: "blur(5px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { type: "spring", stiffness: 60, damping: 16 },
  },
  // Gentle drift diagonal
  {
    initial: { opacity: 0, x: -12, y: 12 },
    animate: { opacity: 1, x: 0, y: 0 },
    transition: { type: "spring", stiffness: 55, damping: 16 },
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
    transition: { type: "spring", stiffness: 80, damping: 16 },
  },
  // Float up ethereal
  {
    initial: { opacity: 0, y: 35, filter: "blur(3px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { type: "spring", stiffness: 40, damping: 16 },
  },
  // Swooping arc from below
  {
    initial: { opacity: 0, x: -15, y: 40, scale: 0.8, filter: "blur(8px)" },
    animate: { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" },
    transition: {
      type: "spring",
      stiffness: 55,
      damping: 16,
      y: { type: "spring", stiffness: 35, damping: 12 },
      scale: { type: "spring", stiffness: 80, damping: 16 },
    },
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

function calculateFluidFontSize(wordLength: number): string {
  // Available width: viewport minus padding (3rem on each side = 6rem total)
  // We want the word to fit comfortably within ~90% of available width
  // Average character width ratio: ~0.55 of font size

  const charWidthRatio = 0.55
  const maxSize = 10.5 // rem - max size for short words
  const minSize = 3 // rem - minimum readable size

  // Calculate the size that would fit the word at different viewports
  // Mobile (20rem viewport): availableWidth = 20 - 6 = 14rem
  // Desktop (80rem viewport): availableWidth = 80 - 6 = 74rem (but capped by maxSize)

  // For a word to fit: fontSize * wordLength * charWidthRatio <= availableWidth
  // fontSize <= availableWidth / (wordLength * charWidthRatio)

  // We'll use clamp with a calculated preferred value that accounts for word length
  const mobileAvailable = 14 // rem
  const desktopAvailable = 60 // rem (practical max)

  const mobileMax = Math.min(maxSize, mobileAvailable / (wordLength * charWidthRatio))
  const desktopMax = Math.min(maxSize, desktopAvailable / (wordLength * charWidthRatio))

  // Ensure we don't go below minimum
  const clampedMobile = Math.max(minSize, mobileMax)
  const clampedDesktop = Math.max(minSize, desktopMax)

  // Calculate the fluid middle value (slope-based interpolation)
  const slope = (clampedDesktop - clampedMobile) / 60 // 60rem viewport range
  const intercept = clampedMobile - slope * 20 // starts at 20rem viewport

  return `clamp(${clampedMobile.toFixed(2)}rem, ${intercept.toFixed(2)}rem + ${(slope * 100).toFixed(2)}vw, ${clampedDesktop.toFixed(2)}rem)`
}

interface StyledWordProps {
  word: string
  variant: FontVariant
  ready: boolean
  reducedMotion: boolean
}

const StyledWord = forwardRef<HTMLSpanElement, StyledWordProps>(
  function StyledWord({ word, variant, ready, reducedMotion }, ref) {
    const color = deriveColor(variant.colorIntent, "dark")

    // Pick animation based on word hash (deterministic for SSR)
    const animation = letterAnimations[hashString(word) % letterAnimations.length]

    const letters = word.split("")
    const fontSize = calculateFluidFontSize(word.length)

    // For reduced motion, show all letters immediately
    if (reducedMotion) {
      return (
        <span
          ref={ref}
          style={{
            fontFamily: `"${variant.family}", sans-serif`,
            fontWeight: variant.weight,
            fontStyle: variant.style,
            fontSize,
            color,
          }}
          className="inline-flex typography-display"
        >
          {word}
        </span>
      )
    }

    // Negative stagger: letters appear "already in motion"
    // First letter has longest delay, last letter starts immediately
    const totalStaggerTime = letters.length * 0.04
    const baseDelay = 0.1 // Small initial delay for page transition

    return (
      <span
        ref={ref}
        style={{
          fontFamily: `"${variant.family}", sans-serif`,
          fontWeight: variant.weight,
          fontStyle: variant.style,
          perspective: "1000px",
          fontSize,
        }}
        className="inline-flex typography-display"
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
              // Negative stagger: last letters animate first, creating wave effect
              delay: baseDelay + (totalStaggerTime - (i * 0.04)),
            }}
          >
            {letter}
          </motion.span>
        ))}
      </span>
    )
  }
)


interface WordPageProps {
  word: string
  initialContent: WordContent | null
}

export default function WordPage({ word, initialContent }: WordPageProps) {
  const { setActiveColor, tintColors } = useActiveColor()
  const prefersReducedMotion = useReducedMotion()
  const wordRef = useRef<HTMLSpanElement>(null)
  const router = useRouter()

  const [definition, setDefinition] = useState<DictionaryEntry | null>(null)
  const [definitionLoaded, setDefinitionLoaded] = useState(false)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const handleBackClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()

    if (!wordRef.current) {
      router.push("/")
      return
    }

    // Store measurements
    const rect = wordRef.current.getBoundingClientRect()
    sessionStorage.setItem("returning-word-rect", JSON.stringify({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    }))

    // Start exit animation
    setIsExiting(true)

    // Navigate after animation
    setTimeout(() => {
      router.push("/")
    }, 200)
  }, [router])

  useEffect(() => {
    fetchDefinition(word).then((entry) => {
      setDefinition(entry)
      setDefinitionLoaded(true)
    })
  }, [word])

  useEffect(() => {
    if (initialContent) {
      setActiveColor(initialContent.frontmatter.style.colorIntent, "deep")
    }
  }, [initialContent, setActiveColor])

  const fallbackVariant: FontVariant = {
    family: "Inter",
    weight: 400,
    style: "normal",
    colorIntent: { hue: 220, chroma: 0.15, lightness: 70 },
  }

  const variant = initialContent?.frontmatter.style || fallbackVariant
  const phonetic = initialContent?.frontmatter.phonetic || definition?.phonetic
  const partOfSpeech = initialContent?.frontmatter.partOfSpeech || definition?.meanings[0]?.partOfSpeech
  const hasMdxContent = initialContent && initialContent.content.length > 0

  useEffect(() => {
    const fontLoader = getFontLoader()
    fontLoader.requestFont(variant, word, () => setFontLoaded(true))
  }, [variant, word])

  const ready = definitionLoaded && fontLoaded
  const textColor = ready ? deriveTintedTextColor(variant.colorIntent) : undefined
  const mutedColor = ready ? deriveTintedMutedColor(variant.colorIntent) : undefined
  const backArrowColor = ready ? deriveTintedMutedColorHex(variant.colorIntent) : "#71717a"

  return (
      <motion.div
        className="min-h-screen text-zinc-200"
        style={{ willChange: "background-color" }}
        animate={{ backgroundColor: tintColors.bg }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
      >
        <Link
          href="/"
          onClick={handleBackClick}
          className="fixed left-0 top-0 h-full z-10 flex items-center justify-start pl-4 transition-colors duration-200 cursor-pointer"
          style={{
            width: "max(4rem, calc(50vw - 24rem - 1.5rem))",
            color: backArrowColor,
            opacity: isExiting ? 0 : 1,
            transition: "opacity 200ms ease-out, color 200ms ease-out",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = backArrowColor)}
          aria-label="Back to home"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>

      <main className="flex flex-col items-center px-6 pt-32 pb-48">
        <motion.div
          className="flex flex-col items-center w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-4">
            <StyledWord ref={wordRef} word={word} variant={variant} ready={ready} reducedMotion={prefersReducedMotion} />
          </div>

          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isExiting ? 0 : 1 }}
            transition={{ duration: 0.15 }}
          >
          {(partOfSpeech || phonetic) && (
            <p
              className="text-[length:var(--text-fluid-caption)] font-light tracking-[0.15em] mb-28 transition-colors duration-700 text-center"
              style={{ color: mutedColor || "var(--tint-muted)", opacity: 0.8, fontFamily: "var(--font-serif), Georgia, serif" }}
            >
              {partOfSpeech && (
                <span className="uppercase text-[0.85em]">{partOfSpeech}</span>
              )}
              {partOfSpeech && phonetic && (
                <span className="mx-3 opacity-50">·</span>
              )}
              {phonetic && <span>{phonetic}</span>}
            </p>
          )}

          <div className="w-full typography-display" style={{ fontFamily: "var(--font-serif), Georgia, serif" }}>
            {hasMdxContent ? (
              <MdxContent
                content={initialContent!.content}
                textColor={textColor}
                mutedColor={mutedColor}
                reducedMotion={prefersReducedMotion}
              />
            ) : definition ? (
              <div className="max-w-3xl mx-auto">
              <div className="space-y-16">
                {definition.meanings.map((meaning, i) => (
                  <ScrollRevealSection key={i} reducedMotion={prefersReducedMotion} delay={i * 0.1}>
                    <section>
                      {i > 0 && (
                        <div
                          className="mb-16 h-px transition-colors duration-700"
                          style={{ backgroundColor: mutedColor || "var(--tint-muted)", opacity: 0.2 }}
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
              <p className="text-zinc-500 text-center text-[length:var(--text-fluid-caption)]">
                No definition found.
              </p>
            )}
          </div>
          </motion.div>
        </motion.div>
      </main>
      </motion.div>
  )
}
