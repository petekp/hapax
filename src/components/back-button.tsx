"use client"

import Link from "next/link"
import { motion } from "motion/react"

const BACK_ARROW_SVG = (
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
)

const BASE_CLASSES =
  "fixed left-0 top-0 h-full z-10 flex items-center justify-start pl-4 transition-colors duration-200 cursor-pointer"

const DYNAMIC_WIDTH = "max(4rem, calc(50vw - 24rem - 1.5rem))"

interface BackButtonLinkProps {
  href?: string
  onClick?: (e: React.MouseEvent) => void
  color?: string
  hoverColor?: string
  opacity?: number
  ariaLabel?: string
}

export function BackButtonLink({
  href = "/",
  onClick,
  color = "#71717a",
  hoverColor = "#ffffff",
  opacity = 1,
  ariaLabel = "Back to home",
}: BackButtonLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={BASE_CLASSES}
      style={{
        width: DYNAMIC_WIDTH,
        color,
        opacity,
        transition: "opacity 200ms ease-out, color 200ms ease-out",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={(e) => (e.currentTarget.style.color = color)}
      aria-label={ariaLabel}
    >
      {BACK_ARROW_SVG}
    </Link>
  )
}

interface BackButtonProps {
  onClick: () => void
  color?: string
  hoverColor?: string
  fadeIn?: boolean
  fadeInDuration?: number
  fadeInDelay?: number
  fadeOutDuration?: number
  ariaLabel?: string
}

export function BackButton({
  onClick,
  color = "#71717a",
  hoverColor = "#ffffff",
  fadeIn = false,
  fadeInDuration = 0.3,
  fadeInDelay = 0.15,
  fadeOutDuration = 0.15,
  ariaLabel = "Close",
}: BackButtonProps) {
  if (fadeIn) {
    return (
      <motion.button
        onClick={onClick}
        className={BASE_CLASSES}
        style={{
          width: DYNAMIC_WIDTH,
          color,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: fadeInDuration, delay: fadeInDelay } }}
        exit={{ opacity: 0, transition: { duration: fadeOutDuration } }}
        onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
        onMouseLeave={(e) => (e.currentTarget.style.color = color)}
        aria-label={ariaLabel}
      >
        {BACK_ARROW_SVG}
      </motion.button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={BASE_CLASSES}
      style={{
        width: DYNAMIC_WIDTH,
        color,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={(e) => (e.currentTarget.style.color = color)}
      aria-label={ariaLabel}
    >
      {BACK_ARROW_SVG}
    </button>
  )
}
