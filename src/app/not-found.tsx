"use client"

import Link from "next/link"
import { motion } from "motion/react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="font-serif text-[clamp(4rem,15vw,12rem)] font-light italic leading-none"
          style={{
            color: "oklch(58% 0.18 270)",
          }}
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          lacuna
        </motion.h1>

        <motion.p
          className="mt-6 text-zinc-500 text-lg font-serif italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          a gap; a missing portion
        </motion.p>

        <motion.p
          className="mt-8 text-zinc-600 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          The page you seek does not exist.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Link
            href="/"
            className="mt-10 inline-block text-zinc-400 hover:text-zinc-200 transition-colors text-sm border-b border-zinc-700 hover:border-zinc-500 pb-0.5"
          >
            Return to the collection
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 text-zinc-700 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.1 }}
      >
        404
      </motion.div>
    </div>
  )
}
