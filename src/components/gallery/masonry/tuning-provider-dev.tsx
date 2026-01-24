"use client"

import { useMemo, type ReactNode } from "react"
import { useControls, folder, button, Leva } from "leva"
import { TuningContext, tuningDefaults, type TuningValues } from "./tuning-context"

export function TuningProviderDev({ children }: { children: ReactNode }) {
  const values = useControls({
    "Mouse Parallax": folder({
      mouseParallaxEnabled: { value: tuningDefaults.mouseParallaxEnabled, label: "Enabled" },
      mouseParallaxMultiplier: { value: tuningDefaults.mouseParallaxMultiplier, min: 0, max: 100, step: 1, label: "Intensity" },
      mouseTransitionDuration: { value: tuningDefaults.mouseTransitionDuration, min: 0, max: 2, step: 0.05, label: "Duration (s)" },
      mouseEasingX1: { value: tuningDefaults.mouseEasingX1, min: 0, max: 1, step: 0.01, label: "Easing X1" },
      mouseEasingY1: { value: tuningDefaults.mouseEasingY1, min: 0, max: 2, step: 0.01, label: "Easing Y1" },
      mouseEasingX2: { value: tuningDefaults.mouseEasingX2, min: 0, max: 1, step: 0.01, label: "Easing X2" },
      mouseEasingY2: { value: tuningDefaults.mouseEasingY2, min: 0, max: 2, step: 0.01, label: "Easing Y2" },
    }),

    "Scroll Parallax": folder({
      scrollParallaxEnabled: { value: tuningDefaults.scrollParallaxEnabled, label: "Enabled" },
      scrollParallaxMultiplier: { value: tuningDefaults.scrollParallaxMultiplier, min: 0, max: 200, step: 5, label: "Intensity" },
      scrollRangeStart: { value: tuningDefaults.scrollRangeStart, min: 0, max: 50, step: 1, label: "Range Start (%)" },
      scrollRangeEnd: { value: tuningDefaults.scrollRangeEnd, min: 50, max: 100, step: 1, label: "Range End (%)" },
    }),

    "Parallax Depth": folder({
      parallaxDepthMin: { value: tuningDefaults.parallaxDepthMin, min: 0, max: 2, step: 0.1, label: "Min Depth" },
      parallaxDepthMax: { value: tuningDefaults.parallaxDepthMax, min: 0.5, max: 4, step: 0.1, label: "Max Depth" },
      depthOpacityNear: { value: tuningDefaults.depthOpacityNear, min: 0.3, max: 1, step: 0.05, label: "Near Opacity" },
      depthOpacityFar: { value: tuningDefaults.depthOpacityFar, min: 0.1, max: 1, step: 0.05, label: "Far Opacity" },
    }),

    "Hover & Tap": folder({
      hoverScale: { value: tuningDefaults.hoverScale, min: 1, max: 1.2, step: 0.005, label: "Hover Scale" },
      tapScale: { value: tuningDefaults.tapScale, min: 0.9, max: 1, step: 0.005, label: "Tap Scale" },
    }),

    "Layout": folder({
      gapX: { value: tuningDefaults.gapX, min: 0, max: 80, step: 4, label: "Gap X (px)" },
      gapY: { value: tuningDefaults.gapY, min: 0, max: 80, step: 4, label: "Gap Y (px)" },
      paddingX: { value: tuningDefaults.paddingX, min: 0, max: 128, step: 8, label: "Padding X (px)" },
      paddingY: { value: tuningDefaults.paddingY, min: 0, max: 128, step: 8, label: "Padding Y (px)" },
    }),

    "Fade Mask": folder({
      maskFadeStart: { value: tuningDefaults.maskFadeStart, min: 0, max: 30, step: 1, label: "Fade Start (%)" },
      maskFadeEnd: { value: tuningDefaults.maskFadeEnd, min: 70, max: 100, step: 1, label: "Fade End (%)" },
    }),

    "Entrance Animation": folder({
      fadeInDuration: { value: tuningDefaults.fadeInDuration, min: 0, max: 2, step: 0.05, label: "Duration (s)" },
      initialBlur: { value: tuningDefaults.initialBlur, min: 0, max: 20, step: 1, label: "Initial Blur (px)" },
      staggerDelay: { value: tuningDefaults.staggerDelay, min: 0, max: 0.05, step: 0.002, label: "Stagger (s)" },
    }),

    "Visibility": folder({
      visibilityMargin: { value: tuningDefaults.visibilityMargin, min: 0, max: 500, step: 25, label: "Margin (px)" },
    }),

    "Page Transitions": folder({
      viewTransitionDuration: { value: tuningDefaults.viewTransitionDuration, min: 100, max: 1000, step: 25, label: "View Transition (ms)" },
      bgColorFadeDuration: { value: tuningDefaults.bgColorFadeDuration, min: 50, max: 1000, step: 25, label: "BG Fade (ms)" },
      bgColorHoldDuration: { value: tuningDefaults.bgColorHoldDuration, min: 0, max: 5000, step: 100, label: "BG Hold (ms)" },
      returnWordScale: { value: tuningDefaults.returnWordScale, min: 1, max: 2, step: 0.05, label: "Return Word Scale" },
      returnWordDuration: { value: tuningDefaults.returnWordDuration, min: 0.2, max: 3, step: 0.1, label: "Return Word Duration (s)" },
      returnWordSpringStiffness: { value: tuningDefaults.returnWordSpringStiffness, min: 20, max: 200, step: 5, label: "Spring Stiffness" },
      returnWordSpringDamping: { value: tuningDefaults.returnWordSpringDamping, min: 5, max: 40, step: 1, label: "Spring Damping" },
      returnWordSpringMass: { value: tuningDefaults.returnWordSpringMass, min: 0.5, max: 3, step: 0.1, label: "Spring Mass" },
      returnStaggerBase: { value: tuningDefaults.returnStaggerBase, min: 0, max: 2, step: 0.05, label: "Stagger Base (s)" },
      returnStaggerPerPx: { value: tuningDefaults.returnStaggerPerPx, min: 0, max: 0.005, step: 0.0001, label: "Stagger per Pixel" },
      returnOtherDuration: { value: tuningDefaults.returnOtherDuration, min: 0.2, max: 2, step: 0.05, label: "Other Words Duration (s)" },
    }),

    "Overlay Animation": folder({
      overlaySpringStiffness: { value: tuningDefaults.overlaySpringStiffness, min: 20, max: 200, step: 5, label: "Spring Stiffness" },
      overlaySpringDamping: { value: tuningDefaults.overlaySpringDamping, min: 5, max: 40, step: 1, label: "Spring Damping" },
      overlaySpringMass: { value: tuningDefaults.overlaySpringMass, min: 0.5, max: 3, step: 0.1, label: "Spring Mass" },
      overlayBackdropDuration: { value: tuningDefaults.overlayBackdropDuration, min: 100, max: 1000, step: 25, label: "Backdrop Duration (ms)" },
      overlayContentDelay: { value: tuningDefaults.overlayContentDelay, min: 0, max: 500, step: 25, label: "Content Delay (ms)" },
      overlayContentFadeOut: { value: tuningDefaults.overlayContentFadeOut, min: 50, max: 500, step: 25, label: "Content Fade Out (ms)" },
    }),

    "Export for LLM": button(() => {
      const changed = Object.entries(values)
        .filter(([key, val]) => {
          const defaultVal = tuningDefaults[key as keyof typeof tuningDefaults]
          if (defaultVal === undefined) return false
          const numVal = Number(val)
          const numDefault = Number(defaultVal)
          if (!isNaN(numVal) && !isNaN(numDefault)) {
            return Math.abs(numVal - numDefault) > 0.001
          }
          return val !== defaultVal
        })
        .map(([key, val]) => {
          const defaultVal = tuningDefaults[key as keyof typeof tuningDefaults]
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
