"use client"

import { AutoScrollGallery, SearchBar } from "@/components/gallery"

export default function Home() {
  return (
    <div
      className="fixed inset-0 flex flex-col transition-colors duration-700"
      style={{ backgroundColor: "var(--tint-bg)" }}
    >
      <header className="flex-shrink-0 flex flex-col items-center justify-center pt-16 pb-8 px-4 z-10">
        <h1
          className="text-4xl md:text-5xl font-light mb-8 tracking-tight transition-colors duration-700"
          style={{ color: "var(--tint-text)" }}
        >
          hapax
        </h1>
        <SearchBar />
      </header>

      <main className="flex-1 overflow-hidden">
        <AutoScrollGallery colorMode="dark" />
      </main>
    </div>
  )
}
