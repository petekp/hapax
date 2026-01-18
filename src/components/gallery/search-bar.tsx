"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = query.trim().toLowerCase()
      if (trimmed) {
        router.push(`/word/${encodeURIComponent(trimmed)}`)
      }
    },
    [query, router]
  )

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a word..."
          className="w-full px-6 py-4 text-xl bg-black/30 rounded-2xl border
                     text-white placeholder:text-zinc-500
                     focus:outline-none focus:ring-2 focus:ring-white/20
                     transition-all duration-700"
          style={{ borderColor: "var(--tint-border)" }}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2
                     rounded-xl transition-colors duration-700"
          style={{
            backgroundColor: "color-mix(in oklch, var(--tint-muted) 40%, transparent)",
            color: "var(--tint-text)",
          }}
        >
          Go
        </button>
      </div>
    </form>
  )
}
