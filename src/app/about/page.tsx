import type { Metadata } from "next"
import { AboutContent } from "./about-content"

export const metadata: Metadata = {
  title: "About",
  description:
    "Hapax is a cabinet of rare words, a collaboration between Peter Petrash and Claude. Each word is styled with its own unique font and color palette chosen by AI.",
  openGraph: {
    title: "About Hapax",
    description:
      "A cabinet of rare words, where each word is styled with its own unique font and color palette.",
  },
}

export default function AboutPage() {
  return <AboutContent />
}
