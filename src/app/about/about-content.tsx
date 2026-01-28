"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { BackButtonLink } from "@/components/back-button"

const HAPAX_STYLE = {
  family: "IM Fell DW Pica",
  weight: 400,
  style: "italic" as const,
  color: "#e4e4e7",
}

export function AboutContent() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IM+Fell+DW+Pica:ital@1&display=swap"
      />
      <BackButtonLink />

      <main className="flex flex-col items-center px-6 pt-32 pb-24">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 60, damping: 16 }}
        >
          <h1
            className="text-[clamp(2.5rem,6vw,4rem)] mb-8 typography-display inline-flex"
            style={{
              fontFamily: `"${HAPAX_STYLE.family}", Georgia, serif`,
              fontWeight: HAPAX_STYLE.weight,
              fontStyle: HAPAX_STYLE.style,
              color: HAPAX_STYLE.color,
            }}
          >
            {"Hapax".split("").map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  type: "spring",
                  stiffness: 60,
                  damping: 16,
                  delay: 0.1 + i * 0.08,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </h1>

          <div
            className="space-y-8 text-[clamp(1.1rem,2.5vw,1.35rem)] leading-[1.8] text-zinc-400"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            <p>
              A{" "}
              <Link
                href="/word/hapax%20legomenon"
                className="text-zinc-300 hover:text-zinc-100 transition-colors duration-200 underline underline-offset-4 decoration-zinc-600"
              >
                <em>hapax legomenon</em>
              </Link>{" "}
              is a word that occurs only once in a body of text. Some appear
              just once in all surviving literature.
            </p>

            <p>
              This is a cabinet of rare words, a collaboration between{" "}
              <a
                href="https://x.com/petekp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-zinc-100 transition-colors duration-200 underline underline-offset-4 decoration-zinc-600"
              >
                Peter Petrash
              </a>
              {" "}and{" "}
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-zinc-100 transition-colors duration-200 underline underline-offset-4 decoration-zinc-600"
              >
                Claude Opus 4.5
              </a>
              . Each word is styled by Claude, which picks from 1,500+ Google
              Fonts to find a typeface that fits.
            </p>

            <blockquote className="text-zinc-500 italic border-l-2 border-zinc-700 pl-6 mt-12">
              "The limits of my language mean the limits of my world."
              <footer className="mt-2 text-zinc-600 not-italic text-[0.9em]">
                — Ludwig Wittgenstein
              </footer>
            </blockquote>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
