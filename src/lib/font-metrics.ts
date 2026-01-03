const metricsCache = new Map<string, FontMetrics>()

export interface FontMetrics {
  capHeight: number
  xHeight: number
  ascent: number
  descent: number
  unitsPerEm: number
  capHeightRatio: number
  xHeightRatio: number
}

const TARGET_CAP_HEIGHT_RATIO = 0.70

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

function getContext(): CanvasRenderingContext2D {
  if (!canvas) {
    canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    ctx = canvas.getContext("2d", { willReadFrequently: true })
  }
  return ctx!
}

function measureGlyphHeight(
  ctx: CanvasRenderingContext2D,
  char: string,
  font: string,
  fontSize: number
): { top: number; bottom: number; height: number } {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = "black"
  ctx.font = `${fontSize}px ${font}`
  ctx.textBaseline = "alphabetic"

  const baseline = height * 0.7
  ctx.fillText(char, 10, baseline)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  let top = height
  let bottom = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > 0) {
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }

  return {
    top,
    bottom,
    height: bottom - top + 1,
  }
}

export function measureFontMetrics(
  fontFamily: string,
  fontWeight: number | string = 400,
  fontStyle: string = "normal"
): FontMetrics {
  const cacheKey = `${fontFamily}:${fontWeight}:${fontStyle}`

  if (metricsCache.has(cacheKey)) {
    return metricsCache.get(cacheKey)!
  }

  const ctx = getContext()
  const fontSize = 100
  const font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`

  const capMetrics = measureGlyphHeight(ctx, "H", font, fontSize)
  const xMetrics = measureGlyphHeight(ctx, "x", font, fontSize)
  const ascentMetrics = measureGlyphHeight(ctx, "b", font, fontSize)
  const descentMetrics = measureGlyphHeight(ctx, "g", font, fontSize)

  const baseline = ctx.canvas.height * 0.7

  const metrics: FontMetrics = {
    capHeight: capMetrics.height,
    xHeight: xMetrics.height,
    ascent: baseline - ascentMetrics.top,
    descent: descentMetrics.bottom - baseline,
    unitsPerEm: fontSize,
    capHeightRatio: capMetrics.height / fontSize,
    xHeightRatio: xMetrics.height / fontSize,
  }

  metricsCache.set(cacheKey, metrics)
  return metrics
}

export function getCapHeightScale(
  fontFamily: string,
  fontWeight: number | string = 400,
  fontStyle: string = "normal"
): number {
  const metrics = measureFontMetrics(fontFamily, fontWeight, fontStyle)
  const rawScale = TARGET_CAP_HEIGHT_RATIO / metrics.capHeightRatio

  // Clamp to reasonable bounds to prevent extreme scaling
  return Math.max(0.85, Math.min(1.15, rawScale))
}

export function getBaselineOffset(
  fontFamily: string,
  fontWeight: number | string = 400,
  fontStyle: string = "normal",
  fontSize: number = 1
): number {
  const metrics = measureFontMetrics(fontFamily, fontWeight, fontStyle)
  const scale = TARGET_CAP_HEIGHT_RATIO / metrics.capHeightRatio

  const originalCapTop = fontSize * (1 - metrics.capHeightRatio)
  const scaledCapTop = fontSize * scale * (1 - metrics.capHeightRatio)

  return (scaledCapTop - originalCapTop) / 2
}

export function getSystemFontMetrics(): FontMetrics {
  return measureFontMetrics("system-ui", 400, "normal")
}

export { TARGET_CAP_HEIGHT_RATIO }
