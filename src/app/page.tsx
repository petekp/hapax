"use client"

import { AutoScrollGallery, SearchBar } from "@/components/gallery"

export default function Home() {
  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col">
      <header className="flex-shrink-0 flex flex-col items-center justify-center pt-16 pb-8 px-4 z-10">
        <h1 className="text-4xl md:text-5xl font-light text-zinc-200 mb-8 tracking-tight">
          vibetype
        </h1>
        <SearchBar />
      </header>

      <main className="flex-1 overflow-hidden">
        <AutoScrollGallery colorMode="dark" />
      </main>
    </div>
  )
}
