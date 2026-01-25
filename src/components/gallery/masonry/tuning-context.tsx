"use client"

import { createContext, useContext, type ReactNode } from "react"

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

  // Ripple Animation
  rippleEnabled: boolean
  rippleBaseDelay: number
  rippleDelayRange: number
  rippleScaleFrom: number
  rippleSpringStiffness: number
  rippleSpringDamping: number

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

export const tuningDefaults: TuningValues = {
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

  // Ripple Animation
  rippleEnabled: true,
  rippleBaseDelay: 0,
  rippleDelayRange: 0.5,
  rippleScaleFrom: 0.92,
  rippleSpringStiffness: 100,
  rippleSpringDamping: 12,

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

export const TuningContext = createContext<TuningValues | null>(null)

export function useTuning(): TuningValues {
  const context = useContext(TuningContext)
  return context ?? tuningDefaults
}

export function TuningProvider({ children }: { children: ReactNode }) {
  return (
    <TuningContext.Provider value={tuningDefaults}>
      {children}
    </TuningContext.Provider>
  )
}
