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
          className="w-full px-6 py-4 text-xl bg-zinc-900/80 border border-zinc-700 rounded-2xl
                     text-white placeholder-zinc-500
                     focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20
                     transition-all duration-200"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2
                     bg-zinc-700 hover:bg-zinc-600 rounded-xl text-zinc-300
                     transition-colors duration-200"
        >
          Go
        </button>
      </div>
    </form>
  )
}
