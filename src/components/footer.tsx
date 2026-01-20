"use client"

import Link from "next/link"

const GITHUB_URL = "https://github.com/your-username/hapax"
const X_URL = "https://x.com/your-handle"

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex justify-center items-center gap-6 py-6 pointer-events-auto">
        <Link
          href="/about"
          className="text-[13px] tracking-wide transition-colors duration-300 text-zinc-500 hover:text-zinc-300"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          About
        </Link>
        <span className="text-zinc-600">·</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] tracking-wide transition-colors duration-300 text-zinc-500 hover:text-zinc-300"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          GitHub
        </a>
        <span className="text-zinc-600">·</span>
        <a
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] tracking-wide transition-colors duration-300 text-zinc-500 hover:text-zinc-300"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          X
        </a>
      </div>
    </footer>
  )
}
