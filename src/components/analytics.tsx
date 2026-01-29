"use client"

import dynamic from "next/dynamic"

const VercelAnalytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => m.Analytics),
  { ssr: false }
)

export function Analytics() {
  return <VercelAnalytics />
}
