import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
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
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Hapax",
  description: "A cabinet of rare words",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
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
      </body>
    </html>
  );
}
