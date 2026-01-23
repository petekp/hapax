"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useControls, folder, button, Leva } from "leva"

export interface TuningValues {
  // Mouse Parallax
  mouseParallaxEnabled: boolean
  mouseParallaxMultiplier: number
  mouseTransitionDuration: number
  mouseEasingX1: number
  mouseEasingY1: number
  mouseEasingX2: number
  mouseEasingY2: number

  // Scroll Parallax
  scrollParallaxEnabled: boolean
  scrollParallaxMultiplier: number
  scrollRangeStart: number
  scrollRangeEnd: number

  // Parallax Depth
  parallaxDepthMin: number
  parallaxDepthMax: number
  depthOpacityNear: number
  depthOpacityFar: number

  // Hover/Tap
  hoverScale: number
  tapScale: number

  // Layout
  gapX: number
  gapY: number
  paddingX: number
  paddingY: number

  // Fade Mask
  maskFadeStart: number
  maskFadeEnd: number

  // Fade In Animation
  fadeInDuration: number
  initialBlur: number
  staggerDelay: number

  // Intersection Observer
  visibilityMargin: number

  // Page Transitions
  viewTransitionDuration: number
  bgColorFadeDuration: number
  bgColorHoldDuration: number
  returnWordScale: number
  returnWordDuration: number
  returnWordSpringStiffness: number
  returnWordSpringDamping: number
  returnWordSpringMass: number
  returnStaggerBase: number
  returnStaggerPerPx: number
  returnOtherDuration: number

  // Overlay Animation
  overlaySpringStiffness: number
  overlaySpringDamping: number
  overlaySpringMass: number
  overlayBackdropDuration: number
  overlayContentDelay: number
  overlayContentFadeOut: number
}

const defaults: TuningValues = {
  // Mouse Parallax
  mouseParallaxEnabled: false,
  mouseParallaxMultiplier: 30,
  mouseTransitionDuration: 0.75,
  mouseEasingX1: 0.33,
  mouseEasingY1: 1,
  mouseEasingX2: 0.68,
  mouseEasingY2: 1,

  // Scroll Parallax
  scrollParallaxEnabled: true,
  scrollParallaxMultiplier: 170,
  scrollRangeStart: 0,
  scrollRangeEnd: 100,

  // Parallax Depth
  parallaxDepthMin: 0.4,
  parallaxDepthMax: 2.2,
  depthOpacityNear: 0.3,
  depthOpacityFar: 1,

  // Hover/Tap
  hoverScale: 1.02,
  tapScale: 0.98,

  // Layout
  gapX: 32,
  gapY: 16,
  paddingX: 32,
  paddingY: 128,

  // Fade Mask
  maskFadeStart: 24,
  maskFadeEnd: 95,

  // Fade In Animation
  fadeInDuration: 0.4,
  initialBlur: 0,
  staggerDelay: 0.008,

  // Intersection Observer
  visibilityMargin: 100,

  // Page Transitions
  viewTransitionDuration: 250,
  bgColorFadeDuration: 200,
  bgColorHoldDuration: 1500,
  returnWordScale: 1.4,
  returnWordDuration: 1,
  returnWordSpringStiffness: 50,
  returnWordSpringDamping: 18,
  returnWordSpringMass: 1.2,
  returnStaggerBase: 0.4,
  returnStaggerPerPx: 0.001,
  returnOtherDuration: 0.8,

  // Overlay Animation
  overlaySpringStiffness: 160,
  overlaySpringDamping: 28,
  overlaySpringMass: 1,
  overlayBackdropDuration: 300,
  overlayContentDelay: 200,
  overlayContentFadeOut: 150,
}

const TuningContext = createContext<TuningValues | null>(null)

export function TuningProvider({ children }: { children: ReactNode }) {
  const values = useControls({
    "Mouse Parallax": folder({
      mouseParallaxEnabled: { value: defaults.mouseParallaxEnabled, label: "Enabled" },
      mouseParallaxMultiplier: { value: defaults.mouseParallaxMultiplier, min: 0, max: 100, step: 1, label: "Intensity" },
      mouseTransitionDuration: { value: defaults.mouseTransitionDuration, min: 0, max: 2, step: 0.05, label: "Duration (s)" },
      mouseEasingX1: { value: defaults.mouseEasingX1, min: 0, max: 1, step: 0.01, label: "Easing X1" },
      mouseEasingY1: { value: defaults.mouseEasingY1, min: 0, max: 2, step: 0.01, label: "Easing Y1" },
      mouseEasingX2: { value: defaults.mouseEasingX2, min: 0, max: 1, step: 0.01, label: "Easing X2" },
      mouseEasingY2: { value: defaults.mouseEasingY2, min: 0, max: 2, step: 0.01, label: "Easing Y2" },
    }),

    "Scroll Parallax": folder({
      scrollParallaxEnabled: { value: defaults.scrollParallaxEnabled, label: "Enabled" },
      scrollParallaxMultiplier: { value: defaults.scrollParallaxMultiplier, min: 0, max: 200, step: 5, label: "Intensity" },
      scrollRangeStart: { value: defaults.scrollRangeStart, min: 0, max: 50, step: 1, label: "Range Start (%)" },
      scrollRangeEnd: { value: defaults.scrollRangeEnd, min: 50, max: 100, step: 1, label: "Range End (%)" },
    }),

    "Parallax Depth": folder({
      parallaxDepthMin: { value: defaults.parallaxDepthMin, min: 0, max: 2, step: 0.1, label: "Min Depth" },
      parallaxDepthMax: { value: defaults.parallaxDepthMax, min: 0.5, max: 4, step: 0.1, label: "Max Depth" },
      depthOpacityNear: { value: defaults.depthOpacityNear, min: 0.3, max: 1, step: 0.05, label: "Near Opacity" },
      depthOpacityFar: { value: defaults.depthOpacityFar, min: 0.1, max: 1, step: 0.05, label: "Far Opacity" },
    }),

    "Hover & Tap": folder({
      hoverScale: { value: defaults.hoverScale, min: 1, max: 1.2, step: 0.005, label: "Hover Scale" },
      tapScale: { value: defaults.tapScale, min: 0.9, max: 1, step: 0.005, label: "Tap Scale" },
    }),

    "Layout": folder({
      gapX: { value: defaults.gapX, min: 0, max: 80, step: 4, label: "Gap X (px)" },
      gapY: { value: defaults.gapY, min: 0, max: 80, step: 4, label: "Gap Y (px)" },
      paddingX: { value: defaults.paddingX, min: 0, max: 128, step: 8, label: "Padding X (px)" },
      paddingY: { value: defaults.paddingY, min: 0, max: 128, step: 8, label: "Padding Y (px)" },
    }),

    "Fade Mask": folder({
      maskFadeStart: { value: defaults.maskFadeStart, min: 0, max: 30, step: 1, label: "Fade Start (%)" },
      maskFadeEnd: { value: defaults.maskFadeEnd, min: 70, max: 100, step: 1, label: "Fade End (%)" },
    }),

    "Entrance Animation": folder({
      fadeInDuration: { value: defaults.fadeInDuration, min: 0, max: 2, step: 0.05, label: "Duration (s)" },
      initialBlur: { value: defaults.initialBlur, min: 0, max: 20, step: 1, label: "Initial Blur (px)" },
      staggerDelay: { value: defaults.staggerDelay, min: 0, max: 0.05, step: 0.002, label: "Stagger (s)" },
    }),

    "Visibility": folder({
      visibilityMargin: { value: defaults.visibilityMargin, min: 0, max: 500, step: 25, label: "Margin (px)" },
    }),

    "Page Transitions": folder({
      viewTransitionDuration: { value: defaults.viewTransitionDuration, min: 100, max: 1000, step: 25, label: "View Transition (ms)" },
      bgColorFadeDuration: { value: defaults.bgColorFadeDuration, min: 50, max: 1000, step: 25, label: "BG Fade (ms)" },
      bgColorHoldDuration: { value: defaults.bgColorHoldDuration, min: 0, max: 5000, step: 100, label: "BG Hold (ms)" },
      returnWordScale: { value: defaults.returnWordScale, min: 1, max: 2, step: 0.05, label: "Return Word Scale" },
      returnWordDuration: { value: defaults.returnWordDuration, min: 0.2, max: 3, step: 0.1, label: "Return Word Duration (s)" },
      returnWordSpringStiffness: { value: defaults.returnWordSpringStiffness, min: 20, max: 200, step: 5, label: "Spring Stiffness" },
      returnWordSpringDamping: { value: defaults.returnWordSpringDamping, min: 5, max: 40, step: 1, label: "Spring Damping" },
      returnWordSpringMass: { value: defaults.returnWordSpringMass, min: 0.5, max: 3, step: 0.1, label: "Spring Mass" },
      returnStaggerBase: { value: defaults.returnStaggerBase, min: 0, max: 2, step: 0.05, label: "Stagger Base (s)" },
      returnStaggerPerPx: { value: defaults.returnStaggerPerPx, min: 0, max: 0.005, step: 0.0001, label: "Stagger per Pixel" },
      returnOtherDuration: { value: defaults.returnOtherDuration, min: 0.2, max: 2, step: 0.05, label: "Other Words Duration (s)" },
    }),

    "Overlay Animation": folder({
      overlaySpringStiffness: { value: defaults.overlaySpringStiffness, min: 20, max: 200, step: 5, label: "Spring Stiffness" },
      overlaySpringDamping: { value: defaults.overlaySpringDamping, min: 5, max: 40, step: 1, label: "Spring Damping" },
      overlaySpringMass: { value: defaults.overlaySpringMass, min: 0.5, max: 3, step: 0.1, label: "Spring Mass" },
      overlayBackdropDuration: { value: defaults.overlayBackdropDuration, min: 100, max: 1000, step: 25, label: "Backdrop Duration (ms)" },
      overlayContentDelay: { value: defaults.overlayContentDelay, min: 0, max: 500, step: 25, label: "Content Delay (ms)" },
      overlayContentFadeOut: { value: defaults.overlayContentFadeOut, min: 50, max: 500, step: 25, label: "Content Fade Out (ms)" },
    }),

    "Export for LLM": button(() => {
      const changed = Object.entries(values)
        .filter(([key, val]) => {
          const defaultVal = defaults[key as keyof typeof defaults]
          if (defaultVal === undefined) return false
          const numVal = Number(val)
          const numDefault = Number(defaultVal)
          if (!isNaN(numVal) && !isNaN(numDefault)) {
            return Math.abs(numVal - numDefault) > 0.001
          }
          return val !== defaultVal
        })
        .map(([key, val]) => {
          const defaultVal = defaults[key as keyof typeof defaults]
          const displayKey = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())
          return `- ${displayKey}: ${defaultVal} → ${val}`
        })

      const formatted = `## Tuned Parallax Parameters

### Changed Values
${changed.length > 0 ? changed.join("\n") : "(No changes from defaults)"}

### All Current Values
\`\`\`typescript
const config = {
${Object.entries(values)
  .filter(([key]) => !key.includes("Export"))
  .map(([key, val]) => `  ${key}: ${typeof val === "string" ? `"${val}"` : val},`)
  .join("\n")}
}
\`\`\`
`
      navigator.clipboard.writeText(formatted)
      alert("Tuned parameters copied to clipboard!")
    }),
  })

  const tuningValues = useMemo((): TuningValues => ({
    mouseParallaxEnabled: values.mouseParallaxEnabled,
    mouseParallaxMultiplier: values.mouseParallaxMultiplier,
    mouseTransitionDuration: values.mouseTransitionDuration,
    mouseEasingX1: values.mouseEasingX1,
    mouseEasingY1: values.mouseEasingY1,
    mouseEasingX2: values.mouseEasingX2,
    mouseEasingY2: values.mouseEasingY2,
    scrollParallaxEnabled: values.scrollParallaxEnabled,
    scrollParallaxMultiplier: values.scrollParallaxMultiplier,
    scrollRangeStart: values.scrollRangeStart,
    scrollRangeEnd: values.scrollRangeEnd,
    parallaxDepthMin: values.parallaxDepthMin,
    parallaxDepthMax: values.parallaxDepthMax,
    depthOpacityNear: values.depthOpacityNear,
    depthOpacityFar: values.depthOpacityFar,
    hoverScale: values.hoverScale,
    tapScale: values.tapScale,
    gapX: values.gapX,
    gapY: values.gapY,
    paddingX: values.paddingX,
    paddingY: values.paddingY,
    maskFadeStart: values.maskFadeStart,
    maskFadeEnd: values.maskFadeEnd,
    fadeInDuration: values.fadeInDuration,
    initialBlur: values.initialBlur,
    staggerDelay: values.staggerDelay,
    visibilityMargin: values.visibilityMargin,
    viewTransitionDuration: values.viewTransitionDuration,
    bgColorFadeDuration: values.bgColorFadeDuration,
    bgColorHoldDuration: values.bgColorHoldDuration,
    returnWordScale: values.returnWordScale,
    returnWordDuration: values.returnWordDuration,
    returnWordSpringStiffness: values.returnWordSpringStiffness,
    returnWordSpringDamping: values.returnWordSpringDamping,
    returnWordSpringMass: values.returnWordSpringMass,
    returnStaggerBase: values.returnStaggerBase,
    returnStaggerPerPx: values.returnStaggerPerPx,
    returnOtherDuration: values.returnOtherDuration,
    overlaySpringStiffness: values.overlaySpringStiffness,
    overlaySpringDamping: values.overlaySpringDamping,
    overlaySpringMass: values.overlaySpringMass,
    overlayBackdropDuration: values.overlayBackdropDuration,
    overlayContentDelay: values.overlayContentDelay,
    overlayContentFadeOut: values.overlayContentFadeOut,
  }), [
    values.mouseParallaxEnabled, values.mouseParallaxMultiplier, values.mouseTransitionDuration,
    values.mouseEasingX1, values.mouseEasingY1, values.mouseEasingX2, values.mouseEasingY2,
    values.scrollParallaxEnabled, values.scrollParallaxMultiplier, values.scrollRangeStart, values.scrollRangeEnd,
    values.parallaxDepthMin, values.parallaxDepthMax, values.depthOpacityNear, values.depthOpacityFar,
    values.hoverScale, values.tapScale,
    values.gapX, values.gapY, values.paddingX, values.paddingY,
    values.maskFadeStart, values.maskFadeEnd,
    values.fadeInDuration, values.initialBlur, values.staggerDelay,
    values.visibilityMargin,
    values.viewTransitionDuration, values.bgColorFadeDuration, values.bgColorHoldDuration,
    values.returnWordScale, values.returnWordDuration,
    values.returnWordSpringStiffness, values.returnWordSpringDamping, values.returnWordSpringMass,
    values.returnStaggerBase, values.returnStaggerPerPx, values.returnOtherDuration,
    values.overlaySpringStiffness, values.overlaySpringDamping, values.overlaySpringMass,
    values.overlayBackdropDuration, values.overlayContentDelay, values.overlayContentFadeOut,
  ])

  return (
    <TuningContext.Provider value={tuningValues}>
      <Leva
        flat
        oneLineLabels
        titleBar={{ title: "Tuning", drag: true, filter: true }}
        theme={{
          sizes: {
            rootWidth: "320px",
            numberInputMinWidth: "56px",
          },
          fontSizes: {
            root: "12px",
          },
        }}
      />
      {children}
    </TuningContext.Provider>
  )
}

export function useTuning(): TuningValues {
  const context = useContext(TuningContext)
  return context ?? defaults
}

export { defaults as tuningDefaults }
