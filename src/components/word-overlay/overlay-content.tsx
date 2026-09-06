"use client"

import { motion } from "motion/react"
import type { FontVariant } from "@/lib/schemas"
import { deriveTintedTextColor, deriveTintedMutedColor } from "@/lib/color"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { WordContent } from "@/lib/words"
import { useTuning } from "@/components/gallery/masonry/tuning-context"
import { MdxContent } from "@/components/mdx-content"

interface OverlayContentProps {
  variant: FontVariant
  content: WordContent | null
  isLoading: boolean
}

export function OverlayContent({
  variant,
  content,
  isLoading,
}: OverlayContentProps) {
  const prefersReducedMotion = useReducedMotion()
  const tuning = useTuning()
  const phonetic = content?.frontmatter.phonetic
  const partOfSpeech = content?.frontmatter.partOfSpeech
  const hasMdxContent = content && content.content.length > 0

  const ready = !isLoading
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
