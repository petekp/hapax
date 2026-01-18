"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import type { WordState, FontVariant } from "@/lib/schemas"
import { deriveColor } from "@/lib/color"

type VisualState = "unformed" | "breathing" | "revealed"

interface PhraseContext {
  phraseText: string
  wordIds: string[]
}

interface VibeWordProps {
  word: WordState
  colorMode: "light" | "dark"
  onVariantChange?: (wordId: string, variant: FontVariant) => void
  onSetLoading?: (wordId: string) => void
  onPhraseVariantChange?: (wordIds: string[], variant: FontVariant) => void
  onSetPhraseLoading?: (wordIds: string[]) => void
  phraseContext?: PhraseContext
  showVettedIndicator?: boolean
}

const isDev = process.env.NODE_ENV === "development"

interface VariantSnapshot {
  key: string
  variant: FontVariant
  color: string
}

const CROSSFADE_DURATION = 0.4

export function VibeWord({
  word,
  colorMode,
  onVariantChange,
  onSetLoading,
  onPhraseVariantChange,
  onSetPhraseLoading,
  phraseContext,
  showVettedIndicator
}: VibeWordProps) {
  const [visualState, setVisualState] = useState<VisualState>("unformed")
  const [fadingOut, setFadingOut] = useState<VariantSnapshot | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const currentVariantRef = useRef<VariantSnapshot | null>(null)

  const mutedColor = colorMode === "dark" ? "hsl(0, 0%, 45%)" : "hsl(0, 0%, 55%)"
  const isPartOfPhrase = !!phraseContext

  const handleSave = useCallback(async () => {
    if (word.resolution.status !== "resolved") return
    setIsSaving(true)
    try {
      if (isPartOfPhrase && phraseContext) {
        const response = await fetch("/api/vet-phrase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phrase: phraseContext.phraseText,
            variant: word.resolution.variant,
          }),
        })
        if (response.ok) {
          console.log(`[ui] Saved phrase "${phraseContext.phraseText}" to vetted styles`)
        }
      } else {
        const response = await fetch("/api/vet-word", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: word.token.raw,
            variant: word.resolution.variant,
          }),
        })
        if (response.ok) {
          console.log(`[ui] Saved "${word.token.raw}" to vetted styles`)
        }
      }
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }, [word, isPartOfPhrase, phraseContext])

  const handleRedo = useCallback(async () => {
    setIsRegenerating(true)

    if (isPartOfPhrase && phraseContext) {
      onSetPhraseLoading?.(phraseContext.wordIds)
      try {
        const response = await fetch("/api/regenerate-phrase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrase: phraseContext.phraseText }),
        })
        if (response.ok) {
          const { variant } = await response.json()
          console.log(`[ui] Regenerated phrase "${phraseContext.phraseText}" → ${variant.family}`)
          onPhraseVariantChange?.(phraseContext.wordIds, variant)
        }
      } catch (error) {
        console.error("Failed to regenerate phrase:", error)
      }
    } else {
      onSetLoading?.(word.token.id)
      try {
        const response = await fetch("/api/regenerate-word", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: word.token.raw }),
        })
        if (response.ok) {
          const { variant } = await response.json()
          console.log(`[ui] Regenerated "${word.token.raw}" → ${variant.family}`)
          onVariantChange?.(word.token.id, variant)
        }
      } catch (error) {
        console.error("Failed to regenerate:", error)
      }
    }

    setIsRegenerating(false)
  }, [word.token.raw, word.token.id, onVariantChange, onSetLoading, isPartOfPhrase, phraseContext, onPhraseVariantChange, onSetPhraseLoading])

  const variantKey = word.resolution.status === "resolved"
    ? `${word.resolution.variant.family}:${word.resolution.variant.weight}:${word.phraseGroupId}`
    : null

  const currentVariant: VariantSnapshot | null =
    word.resolution.status === "resolved" && word.fontLoaded
      ? {
          key: variantKey!,
          variant: word.resolution.variant,
          color: deriveColor(word.resolution.variant.colorIntent, colorMode),
        }
      : null

  const fontStyle = useCallback((variant: FontVariant): React.CSSProperties => ({
    fontFamily: `"${variant.family}", sans-serif`,
    fontWeight: variant.weight,
    fontStyle: variant.style,
  }), [])

  // Track variant changes for crossfade
  useEffect(() => {
    const prev = currentVariantRef.current
    if (currentVariant && currentVariant.key !== prev?.key && prev) {
      setFadingOut(prev)
    }
    currentVariantRef.current = currentVariant
  }, [currentVariant])

  // Visual state machine
  useEffect(() => {
    const { status } = word.resolution

    if (status === "pending") {
      setVisualState("unformed")
    } else if (status === "loading" || (status === "resolved" && !word.fontLoaded)) {
      setVisualState("breathing")
    } else if (status === "resolved" && word.fontLoaded) {
      setVisualState("revealed")
    }
  }, [word.resolution.status, word.fontLoaded])

  const handleFadeOutComplete = useCallback(() => {
    setFadingOut(null)
  }, [])

  // Unformed or breathing state - show muted, blurry text
  if (visualState !== "revealed" || !currentVariant) {
    return (
      <motion.span
        style={{ color: mutedColor }}
        animate={
          visualState === "breathing"
            ? { opacity: [0.4, 0.55], filter: ["blur(4px)", "blur(8px)"] }
            : { opacity: 0.4, filter: "blur(4px)" }
        }
        transition={
          visualState === "breathing"
            ? { duration: 1.2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }
            : { duration: 0.3 }
        }
      >
        {word.token.raw}
      </motion.span>
    )
  }

  // Revealed state - show styled text with optional crossfade ghost
  return (
    <span
      style={{ position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ghost of previous variant fading out */}
      <AnimatePresence>
        {fadingOut && (
          <motion.span
            key={fadingOut.key}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              color: fadingOut.color,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              ...fontStyle(fadingOut.variant),
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0, filter: "blur(4px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: CROSSFADE_DURATION }}
            onAnimationComplete={handleFadeOutComplete}
          >
            {word.token.raw}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Current variant - THIS IS THE LAYOUT ELEMENT */}
      <motion.span
        key={currentVariant.key}
        style={{
          color: currentVariant.color,
          ...fontStyle(currentVariant.variant),
        }}
        initial={{ opacity: 0, filter: "blur(6px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: CROSSFADE_DURATION }}
      >
        {word.token.raw}
      </motion.span>

      {/* Vetted indicator */}
      {showVettedIndicator && word.resolution.status === "resolved" && word.resolution.source === "vetted" && (
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "#22c55e",
            marginLeft: "3px",
            verticalAlign: "super",
            opacity: 0.8,
          }}
          title="Vetted"
        />
      )}

      {/* Save/Redo buttons (dev only) - centered over word */}
      {isDev && isHovered && (
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            gap: "8px",
            zIndex: 100,
          }}
        >
          <button
            onClick={handleSave}
            disabled={isSaving}
            title="Save to vetted styles"
            style={{
              width: "32px",
              height: "32px",
              fontSize: "18px",
              background: isSaving ? "#374151" : "rgba(34, 197, 94, 0.95)",
              color: "white",
              border: "2px solid white",
              borderRadius: "8px",
              cursor: isSaving ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {isSaving ? "⏳" : "✓"}
          </button>
          <button
            onClick={handleRedo}
            disabled={isRegenerating}
            title="Regenerate style"
            style={{
              width: "32px",
              height: "32px",
              fontSize: "18px",
              background: isRegenerating ? "#374151" : "rgba(59, 130, 246, 0.95)",
              color: "white",
              border: "2px solid white",
              borderRadius: "8px",
              cursor: isRegenerating ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {isRegenerating ? "⏳" : "↻"}
          </button>
        </span>
      )}
    </span>
  )
}
