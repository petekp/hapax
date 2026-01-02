import type { FontVariant } from "./schemas"

export function fontVariantKey(variant: FontVariant): string {
  return `${variant.family}:${variant.weight}:${variant.style}`
}

export function buildGoogleFontsUrl(
  requests: Array<{ variant: FontVariant; characters: string }>
): string {
  const base = "https://fonts.googleapis.com/css2"

  const allChars = new Set<string>()
  const familyParams: string[] = []
  const seenFamilies = new Set<string>()

  for (const req of requests) {
    for (const char of req.characters) {
      allChars.add(char)
    }

    const familyKey = fontVariantKey(req.variant)
    if (seenFamilies.has(familyKey)) continue
    seenFamilies.add(familyKey)

    const family = req.variant.family.replace(/ /g, "+")

    if (req.variant.style === "italic") {
      familyParams.push(`family=${family}:ital,wght@1,${req.variant.weight}`)
    } else {
      familyParams.push(`family=${family}:wght@${req.variant.weight}`)
    }
  }

  const parts = [...familyParams]

  const uniqueChars = [...allChars].join("")
  if (uniqueChars) {
    parts.push(`text=${encodeURIComponent(uniqueChars)}`)
  }

  parts.push("display=swap")

  return `${base}?${parts.join("&")}`
}

export function buildFontString(variant: FontVariant): string {
  const style = variant.style === "italic" ? "italic " : ""
  return `${style}${variant.weight} 16px "${variant.family}"`
}

type LoadedFontsCache = Map<string, Set<string>>

export function createFontLoaderState() {
  const loadedChars: LoadedFontsCache = new Map()
  const pendingRequests = new Map<
    string,
    { variant: FontVariant; chars: Set<string>; callbacks: Array<() => void> }
  >()
  const injectedUrls = new Set<string>()

  let batchTimeout: ReturnType<typeof setTimeout> | null = null
  const BATCH_DELAY_MS = 16

  function getLoadedChars(variant: FontVariant): Set<string> {
    const key = fontVariantKey(variant)
    return loadedChars.get(key) || new Set()
  }

  function markCharsLoaded(variant: FontVariant, chars: Iterable<string>) {
    const key = fontVariantKey(variant)
    const existing = loadedChars.get(key) || new Set()
    for (const char of chars) {
      existing.add(char)
    }
    loadedChars.set(key, existing)
  }

  function getUnloadedChars(variant: FontVariant, text: string): string {
    const loaded = getLoadedChars(variant)
    const needed: string[] = []
    for (const char of text) {
      if (!loaded.has(char)) {
        needed.push(char)
      }
    }
    return [...new Set(needed)].join("")
  }

  function flushBatch() {
    if (pendingRequests.size === 0) return

    const requestsNeedingLoad: Array<{ variant: FontVariant; characters: string }> = []
    const allCallbacks: Array<() => void> = []

    for (const [, req] of pendingRequests) {
      allCallbacks.push(...req.callbacks)
      const chars = [...req.chars].join("")
      if (chars.length > 0) {
        requestsNeedingLoad.push({
          variant: req.variant,
          characters: chars,
        })
      }
    }

    pendingRequests.clear()

    if (requestsNeedingLoad.length === 0) {
      for (const cb of allCallbacks) cb()
      return
    }

    const url = buildGoogleFontsUrl(requestsNeedingLoad)

    if (injectedUrls.has(url)) {
      for (const cb of allCallbacks) cb()
      return
    }

    injectedUrls.add(url)

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = url
    link.crossOrigin = "anonymous"

    link.onload = async () => {
      try {
        await document.fonts.ready

        for (const req of requestsNeedingLoad) {
          markCharsLoaded(req.variant, req.characters)
        }

        for (const cb of allCallbacks) {
          cb()
        }
      } catch {
        for (const cb of allCallbacks) {
          cb()
        }
      }
    }

    link.onerror = () => {
      for (const cb of allCallbacks) {
        cb()
      }
    }

    document.head.appendChild(link)
  }

  function requestFont(
    variant: FontVariant,
    text: string,
    onLoaded: () => void
  ): void {
    const unloaded = getUnloadedChars(variant, text)
    const key = fontVariantKey(variant)
    const existing = pendingRequests.get(key)

    if (existing) {
      for (const char of unloaded) {
        existing.chars.add(char)
      }
      existing.callbacks.push(onLoaded)
    } else {
      pendingRequests.set(key, {
        variant,
        chars: new Set(unloaded),
        callbacks: [onLoaded],
      })
    }

    if (batchTimeout) {
      clearTimeout(batchTimeout)
    }

    batchTimeout = setTimeout(flushBatch, BATCH_DELAY_MS)
  }

  function isLoaded(variant: FontVariant, text: string): boolean {
    const loaded = getLoadedChars(variant)
    for (const char of text) {
      if (!loaded.has(char)) {
        return false
      }
    }
    return true
  }

  return {
    requestFont,
    isLoaded,
    getLoadedChars,
  }
}

export type FontLoaderState = ReturnType<typeof createFontLoaderState>

let globalFontLoader: FontLoaderState | null = null

export function getFontLoader(): FontLoaderState {
  if (!globalFontLoader) {
    globalFontLoader = createFontLoaderState()
  }
  return globalFontLoader
}
