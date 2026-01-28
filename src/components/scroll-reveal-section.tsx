"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"

interface ScrollRevealSectionProps {
  children: React.ReactNode
  reducedMotion: boolean
  delay?: number
}

export function ScrollRevealSection({
  children,
  reducedMotion,
  delay = 0,
}: ScrollRevealSectionProps) {
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
