"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  animate,
  motion,
  motionValue,
  useMotionTemplate,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react"
import { oklchToHex } from "@/lib/color"
import { hashString, seededRandom } from "@/lib/hash"
import type { AtmosphereProps, Performance, PerformanceTitleProps } from "./types"

// Petrichor: the smell of rain on dry ground. The word pales as if dried out,
// the first drops strike it letter by letter, each letter darkens as the water
// soaks down through it, and once it's all wet a faint scent rises.

// Pale dust, the color of the ground before rain
const DRY = "oklch(80% 0.02 85)"
const DROPLET = "rgba(226, 238, 230, 0.9)"

// How far the damp edge fades into the dry part of a letter, in percent of its height
const DAMP_FRINGE = 16
// Soak values: fully dry sits the fringe above the letter, fully wet below it
const SOAK_DRY = -DAMP_FRINGE
const SOAK_WET = 100

const FALL_SECONDS = 0.42
const DRY_OUT_SECONDS = 0.8

// Letters get hit in a shuffled but repeatable order
function hitOrder(count: number, seed: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i)
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i * 7919) * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

// The first drops are far apart, then the rain picks up
function hitTimes(count: number, start: number): number[] {
  const times: number[] = []
  let t = start
  for (let k = 0; k < count; k++) {
    times.push(t)
    t += Math.max(0.1, 0.5 * Math.pow(0.78, k))
  }
  return times
}

function Letter({ char, soak }: { char: string; soak: MotionValue<number> }) {
  const edge = useTransform(soak, (v) => v + DAMP_FRINGE)
  const backgroundImage = useMotionTemplate`linear-gradient(to bottom, var(--ink) ${soak}%, ${DRY} ${edge}%)`

  return (
    <motion.span
      style={{
        backgroundImage,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        // Pad the painted area so italic overhangs aren't clipped, without moving anything
        padding: "0.2em 0.14em",
        margin: "0 -0.14em",
      }}
    >
      {char}
    </motion.span>
  )
}

function Drop({ onLand }: { onLand: () => void }) {
  const [fallFrom] = useState(() => -window.innerHeight * 0.75)
  return (
    <motion.span
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        left: "50%",
        top: "-0.35em",
        width: "0.045em",
        height: "0.6em",
        marginLeft: "-0.0225em",
        borderRadius: "0.05em",
        background: `linear-gradient(to bottom, transparent, ${DROPLET})`,
      }}
      initial={{ y: fallFrom, opacity: 0 }}
      animate={{ y: 0, opacity: 0.9 }}
      transition={{ y: { duration: FALL_SECONDS, ease: "easeIn" }, opacity: { duration: 0.12 } }}
      onAnimationComplete={onLand}
    />
  )
}

// Droplets thrown up where a drop strikes: sideways reach and height, in em
const SPLASH = [
  { dx: -0.24, up: 0.13 },
  { dx: -0.08, up: 0.24 },
  { dx: 0.11, up: 0.19 },
  { dx: 0.27, up: 0.1 },
]

function Splash() {
  return (
    <>
      {SPLASH.map(({ dx, up }) => (
        <motion.span
          key={dx}
          aria-hidden
          className="absolute pointer-events-none rounded-full"
          style={{
            left: "50%",
            top: "0.22em",
            width: "0.04em",
            height: "0.04em",
            background: DROPLET,
          }}
          initial={{ x: "0em", y: "0em", opacity: 0.9 }}
          animate={{ x: `${dx}em`, y: ["0em", `-${up}em`, "0.06em"], opacity: [0.9, 0.7, 0] }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      ))}
    </>
  )
}

// Thin strands of scent rising off different letters: position across the word (%) and delay (s)
const WISPS = [
  { x: 16, delay: 0 },
  { x: 58, delay: 0.3 },
  { x: 37, delay: 0.75 },
  { x: 80, delay: 1.1 },
]

// The scent lifting off the wet word, wavering like steam
function Scent() {
  return (
    <>
      {WISPS.map((wisp) => (
        <motion.span
          key={wisp.x}
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: `${wisp.x}%`,
            top: "0.05em",
            width: "0.06em",
            height: "0.9em",
            marginLeft: "-0.03em",
            borderRadius: "0.03em",
            background: "linear-gradient(to top, transparent, color-mix(in oklch, var(--ink) 30%, white), transparent)",
            filter: "blur(0.015em)",
            transformOrigin: "50% 100%",
          }}
          initial={{ y: "0em", x: "0em", opacity: 0, scaleY: 0.5 }}
          animate={{
            y: "-1.2em",
            x: ["0em", "0.07em", "-0.05em", "0.05em", "0em"],
            opacity: [0, 0.38, 0],
            scaleY: 1.3,
          }}
          transition={{ duration: 3.8, delay: wisp.delay, ease: "easeOut" }}
        />
      ))}
    </>
  )
}

function PetrichorTitle({ word, ready, origin, reducedMotion }: PerformanceTitleProps) {
  const letters = useMemo(() => [...word], [word])
  const startsWet = origin === "gallery" || reducedMotion
  const [soaks] = useState(() => letters.map(() => motionValue(startsWet ? SOAK_WET : SOAK_DRY)))

  const [falling, setFalling] = useState<ReadonlySet<number>>(new Set())
  const [splashed, setSplashed] = useState<ReadonlySet<number>>(new Set())
  const [scentRising, setScentRising] = useState(false)
  const soakAnimations = useRef<AnimationPlaybackControls[]>([])

  useEffect(() => {
    if (!ready || reducedMotion) return

    const animations = soakAnimations.current
    const timers: ReturnType<typeof setTimeout>[] = []

    // A word lifted from the gallery dries out on the way up
    if (origin === "gallery") {
      for (const soak of soaks) {
        animations.push(animate(soak, SOAK_DRY, { duration: DRY_OUT_SECONDS, ease: "easeInOut" }))
      }
    }

    const rainStart = origin === "gallery" ? DRY_OUT_SECONDS + 0.3 : 0.9
    const order = hitOrder(letters.length, hashString(word))
    const times = hitTimes(letters.length, rainStart)

    order.forEach((letterIndex, k) => {
      timers.push(setTimeout(() => {
        setFalling((prev) => new Set(prev).add(letterIndex))
      }, times[k] * 1000))
    })

    const lastLanding = times[times.length - 1] + FALL_SECONDS
    timers.push(setTimeout(() => setScentRising(true), (lastLanding + 1) * 1000))

    return () => {
      timers.forEach(clearTimeout)
      animations.forEach((animation) => animation.stop())
      animations.length = 0
    }
  }, [ready, reducedMotion, origin, word, letters.length, soaks])

  const land = (index: number) => {
    setFalling((prev) => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
    setSplashed((prev) => new Set(prev).add(index))
    // Water soaks down through the letter
    soakAnimations.current.push(
      animate(soaks[index], SOAK_WET, { duration: 1.2, ease: [0.25, 0.6, 0.3, 1] })
    )
  }

  return (
    <motion.span
      className="relative inline-block"
      initial={{ opacity: origin === "gallery" || reducedMotion ? 1 : 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      transition={{ duration: origin === "gallery" ? 0 : 0.6, ease: "easeOut" }}
    >
      <span className="sr-only">{word}</span>
      <span aria-hidden>
        {letters.map((char, i) => (
          <span key={i} className="relative">
            <Letter char={char} soak={soaks[i]} />
            {falling.has(i) && <Drop onLand={() => land(i)} />}
            {splashed.has(i) && <Splash />}
          </span>
        ))}
      </span>
      {scentRising && <Scent />}
    </motion.span>
  )
}

interface Raindrop {
  x: number
  y: number
  depth: number
  length: number
  speed: number
}

// Light rain behind the page: the first scattered drops, a brief shower, then a drizzle
function Rain({ variant }: AtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { hue, chroma } = variant.colorIntent

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const color = oklchToHex(86, Math.min(0.05, chroma * 0.35), hue)
    const wind = Math.tan((10 * Math.PI) / 180)
    let width = 0
    let height = 0

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const spawn = (drop: Partial<Raindrop> = {}): Raindrop => {
      const depth = Math.random()
      return Object.assign(drop, {
        x: Math.random() * (width + height * wind) - height * wind,
        y: -Math.random() * height * 0.4,
        depth,
        length: 10 + depth * 20,
        speed: 420 + depth * 560,
      }) as Raindrop
    }

    // Share of the full shower falling at time t (seconds)
    const density = (t: number) => {
      if (t < 0.6) return 0
      if (t < 6) return Math.pow((t - 0.6) / 5.4, 1.6)
      if (t < 12) return 1
      if (t < 20) return 1 - 0.7 * ((t - 12) / 8)
      return 0.3
    }

    const maxDrops = Math.round((width * height) / 11000)
    const drops: Raindrop[] = []
    const start = performance.now()
    let last = start
    let frame = 0

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const target = Math.round(maxDrops * density((now - start) / 1000))

      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = color
      ctx.lineCap = "round"

      for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i]
        drop.y += drop.speed * dt
        drop.x += drop.speed * dt * wind
        if (drop.y - drop.length > height) {
          // Let the rain thin out by not replacing drops that land
          if (drops.length > target) {
            drops.splice(i, 1)
            continue
          }
          spawn(drop)
        }
        ctx.globalAlpha = 0.05 + drop.depth * 0.17
        ctx.lineWidth = 0.6 + drop.depth * 0.9
        ctx.beginPath()
        ctx.moveTo(drop.x, drop.y)
        ctx.lineTo(drop.x - drop.length * wind, drop.y - drop.length)
        ctx.stroke()
      }
      while (drops.length < target) drops.push(spawn())

      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
    }
  }, [hue, chroma])

  return <canvas ref={canvasRef} aria-hidden className="fixed inset-0 h-full w-full pointer-events-none" />
}

export const petrichor: Performance = {
  Title: PetrichorTitle,
  Atmosphere: Rain,
}
