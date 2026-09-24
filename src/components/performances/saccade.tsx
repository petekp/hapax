"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, useAnimate, type Transition } from "motion/react"
import { oklchToHex } from "@/lib/color"
import { hashString, seededRandom } from "@/lib/hash"
import type { AtmosphereProps, Performance, PerformanceTitleProps } from "./types"

// Saccade: the jump the eye makes between fixations. The word never glides.
// After the eye's usual delay it jumps, lands a little short, and makes a small
// corrective jump. On its page, a faint eye-tracking trace records the jumps a
// reader's eyes make across the definition, the motion most people never
// notice they're making.

// A primary saccade tends to fall short of its target, then correct
const UNDERSHOOT = 0.9
// Seconds before the eye moves, and before it corrects
const LATENCY = 0.22
const CORRECTION = 0.17

// Between the gallery and the overlay: hold, jump most of the way, correct
const FLIGHT_SECONDS = 0.45
const flight: Transition = {
  type: "tween",
  duration: FLIGHT_SECONDS,
  ease: (p: number) => {
    const t = p * FLIGHT_SECONDS
    if (t < LATENCY) return 0
    if (t < LATENCY + CORRECTION) return UNDERSHOOT
    return 1
  },
}

// Where the word is first glimpsed, out of the corner of the eye
const PERIPHERY = { x: -1.4, y: 0.8 }
const GLIMPSE_SECONDS = 0.3
const ENTRANCE_SECONDS = GLIMPSE_SECONDS + LATENCY + CORRECTION

// Position and focus stay in the periphery through the glimpse and the latency, then jump twice
function jumpEase(p: number): number {
  const t = p * ENTRANCE_SECONDS
  if (t < GLIMPSE_SECONDS + LATENCY) return 0
  if (t < ENTRANCE_SECONDS - 0.001) return UNDERSHOOT
  return 1
}

// Visibility rises to a faint glimpse, then sharpens with each jump
function glimpseEase(p: number): number {
  const t = p * ENTRANCE_SECONDS
  if (t < GLIMPSE_SECONDS) return 0.4 * (1 - (1 - t / GLIMPSE_SECONDS) ** 2)
  if (t < GLIMPSE_SECONDS + LATENCY) return 0.4
  if (t < ENTRANCE_SECONDS - 0.001) return 0.95
  return 1
}

function SaccadeTitle({ word, ready, origin, reducedMotion }: PerformanceTitleProps) {
  const [scope, animate] = useAnimate<HTMLSpanElement>()
  // Arriving from the gallery, the flight is the saccade
  const jumpsIn = origin === "entrance" && !reducedMotion

  useEffect(() => {
    if (!ready || !jumpsIn || !scope.current) return

    // A sequence would interpolate between its steps, so each value gets one
    // tween with a stepped easing curve instead
    const controls = animate(
      scope.current,
      {
        x: [`${PERIPHERY.x}em`, "0em"],
        y: [`${PERIPHERY.y}em`, "0em"],
        filter: ["blur(0.09em)", "blur(0em)"],
        opacity: [0, 1],
      },
      {
        duration: ENTRANCE_SECONDS,
        ease: jumpEase,
        opacity: { duration: ENTRANCE_SECONDS, ease: glimpseEase },
      }
    )
    return () => controls.stop()
  }, [ready, jumpsIn, animate, scope])

  return (
    <span ref={scope} className="inline-block" style={jumpsIn ? { opacity: 0 } : undefined}>
      {word}
    </span>
  )
}

interface WordBox {
  x: number
  y: number
  width: number
  height: number
  length: number
  line: number
}

interface Fixation {
  word: number
  // Where in the word the eye lands, 0 to 1
  frac: number
  // Seconds the eye rests there
  dwell: number
}

// Where each word of the paragraph sits, relative to its positioned wrapper
function measureWords(paragraph: HTMLElement, wrapper: HTMLElement): WordBox[] {
  const origin = wrapper.getBoundingClientRect()
  const words: WordBox[] = []
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
  let lineTop = -Infinity
  let line = -1

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? ""
    for (const match of text.matchAll(/[A-Za-zÀ-ÖØ-öø-ÿ’'-]+/g)) {
      const start = match.index ?? 0
      const range = document.createRange()
      range.setStart(node, start)
      range.setEnd(node, start + match[0].length)
      const rect = range.getClientRects()[0]
      if (!rect) continue
      if (rect.top > lineTop + rect.height / 2) {
        line++
        lineTop = rect.top
      }
      words.push({
        x: rect.left - origin.left,
        y: rect.top - origin.top,
        width: rect.width,
        height: rect.height,
        length: match[0].length,
        line,
      })
    }
  }
  return words
}

// A plausible reader's path through the first lines: most short words are
// skipped, long ones sometimes get a second look, and now and then the eye
// jumps back to recheck a word it already passed
function planScanpath(words: WordBox[], seed: number, lines = 4): Fixation[] {
  let n = 0
  const random = () => seededRandom(seed + ++n * 7919)
  const plan: Fixation[] = []

  for (let i = 0; i < words.length && words[i].line < lines; i++) {
    const w = words[i]
    if (w.length <= 3 && plan.length > 0 && random() < 0.7) continue

    plan.push({ word: i, frac: 0.3 + random() * 0.2, dwell: 0.17 + w.length * 0.014 + random() * 0.06 })
    if (w.length >= 10 && random() < 0.35) {
      plan.push({ word: i, frac: 0.72, dwell: 0.14 + random() * 0.05 })
    }
    if (i > 2 && random() < 0.1) {
      const back = i - 1 - Math.floor(random() * 2)
      if (words[back].line === w.line) plan.push({ word: back, frac: 0.5, dwell: 0.15 + random() * 0.05 })
    }
  }
  return plan
}

// An eye-tracking record drawn over the definition: fixations as circles that
// grow while the eye rests, joined by the straight lines of each jump
function Scanpath({ variant }: AtmosphereProps) {
  const [host, setHost] = useState<{ paragraph: HTMLElement; wrapper: HTMLElement } | null>(null)
  const [words, setWords] = useState<WordBox[]>([])
  const [plan, setPlan] = useState<Fixation[] | null>(null)
  const [shown, setShown] = useState(0)
  const [settled, setSettled] = useState(false)
  // Brighter than the word's own color so the trace stands apart from the text
  const color = oklchToHex(74, Math.min(0.16, variant.colorIntent.chroma), variant.colorIntent.hue)

  // Wait until the definition is on the page and has finished fading in
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const look = () => {
      const paragraph = document.querySelector<HTMLElement>("[data-definition]")
      const wrapper = paragraph?.parentElement
      const reveal = wrapper?.parentElement
      if (paragraph && wrapper && reveal && Number(getComputedStyle(reveal).opacity) > 0.99) {
        setHost({ paragraph, wrapper })
      } else {
        timer = setTimeout(look, 200)
      }
    }
    look()
    return () => clearTimeout(timer)
  }, [])

  // Measure once the fade-in has settled, and again whenever the text reflows
  useEffect(() => {
    if (!host) return
    const measure = () => {
      const measured = measureWords(host.paragraph, host.wrapper)
      setWords(measured)
      setPlan((current) => current ?? planScanpath(measured, hashString(variant.family + host.paragraph.textContent)))
    }
    const first = setTimeout(measure, 600)
    const observer = new ResizeObserver(() => measure())
    observer.observe(host.paragraph)
    return () => {
      clearTimeout(first)
      observer.disconnect()
    }
  }, [host, variant.family])

  // Replay the reading: rest at each fixation, then jump
  useEffect(() => {
    if (!plan) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let t = 0.3
    plan.forEach((fixation, i) => {
      timers.push(setTimeout(() => setShown(i + 1), t * 1000))
      t += fixation.dwell + 0.03
    })
    timers.push(setTimeout(() => setSettled(true), (t + 1.2) * 1000))
    return () => timers.forEach(clearTimeout)
  }, [plan])

  if (!host || !plan) return null

  const points = plan.slice(0, shown).flatMap((fixation) => {
    const w = words[fixation.word]
    if (!w) return []
    return [{
      x: w.x + w.width * fixation.frac,
      y: w.y + w.height * 0.55,
      r: 4 + fixation.dwell * 26,
      dwell: fixation.dwell,
    }]
  })

  return createPortal(
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      style={{ opacity: settled ? 0.3 : 1, transition: "opacity 2.5s ease" }}
    >
      {points.map((p, i) => i > 0 && (
        <line
          key={`jump-${i}`}
          x1={points[i - 1].x}
          y1={points[i - 1].y}
          x2={p.x}
          y2={p.y}
          stroke={color}
          strokeOpacity={0.55}
          strokeWidth={1}
        />
      ))}
      {points.map((p, i) => (
        <motion.circle
          key={`fixation-${i}`}
          cx={p.x}
          cy={p.y}
          fill={color}
          fillOpacity={0.16}
          stroke={color}
          strokeOpacity={0.85}
          strokeWidth={1.25}
          initial={{ r: 1.5 }}
          animate={{ r: p.r }}
          transition={{ duration: p.dwell, ease: "linear" }}
        />
      ))}
    </svg>,
    host.wrapper
  )
}

export const saccade: Performance = {
  Title: SaccadeTitle,
  Atmosphere: Scanpath,
  flight,
}
