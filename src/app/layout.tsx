import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ActiveColorProvider } from "@/lib/active-color-context";
import { DevToolsProvider } from "@/components/dev-tools-provider";
import { Footer } from "@/components/footer";
import { PRELOAD_URLS } from "@/lib/font-preload";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hapax.ink"),
  title: {
    default: "Hapax — A Cabinet of Rare Words",
    template: "%s — Hapax",
  },
  description:
    "Explore a curated gallery of rare English words. Each word styled with its own unique font and color palette. Discover words like liminal, petrichor, saudade, and more.",
  keywords: [
    "rare words",
    "unusual words",
    "vocabulary",
    "word gallery",
    "linguistics",
    "etymology",
    "beautiful words",
    "obscure words",
  ],
  authors: [{ name: "Peter Petrash", url: "https://x.com/petekp" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Hapax",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@petekp",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Hapax",
  description: "A cabinet of rare words, where each word is styled with its own unique font and color palette.",
  url: "https://hapax.ink",
  author: {
    "@type": "Person",
    name: "Peter Petrash",
    url: "https://x.com/petekp",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#000000" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {PRELOAD_URLS.map((url, i) => (
          <link
            key={i}
            rel="preload"
            href={url}
            as="style"
            crossOrigin="anonymous"
          />
        ))}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        <DevToolsProvider>
          <ActiveColorProvider>
            {children}
            <Footer />
          </ActiveColorProvider>
        </DevToolsProvider>
        <Analytics />
      </body>
    </html>
  );
}
