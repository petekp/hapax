import type { ColorIntent } from "./schemas"

export type ColorMode = "light" | "dark"

export function deriveColor(intent: ColorIntent, mode: ColorMode): string {
  const lightness = mode === "light" ? 30 : 75
  return `hsl(${intent.hue}, ${intent.saturation}%, ${lightness}%)`
}

export function deriveCssVariables(
  intent: ColorIntent
): Record<string, string> {
  return {
    "--vibe-color-light": deriveColor(intent, "light"),
    "--vibe-color-dark": deriveColor(intent, "dark"),
    "--vibe-hue": String(intent.hue),
    "--vibe-saturation": `${intent.saturation}%`,
  }
}
