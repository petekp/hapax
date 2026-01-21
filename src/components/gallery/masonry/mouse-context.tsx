"use client"

import { createContext, useContext, useRef, useEffect, useCallback, type ReactNode } from "react"

interface MouseContextValue {
  subscribe: (callback: (x: number, y: number) => void) => () => void
}

const MouseContext = createContext<MouseContextValue | null>(null)

export function MouseProvider({ children }: { children: ReactNode }) {
  const subscribers = useRef<Set<(x: number, y: number) => void>>(new Set())
  const posRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          subscribers.current.forEach(cb => cb(posRef.current.x, posRef.current.y))
          rafRef.current = null
        })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const subscribe = useCallback((callback: (x: number, y: number) => void) => {
    subscribers.current.add(callback)
    callback(posRef.current.x, posRef.current.y)
    return () => {
      subscribers.current.delete(callback)
    }
  }, [])

  return (
    <MouseContext.Provider value={{ subscribe }}>
      {children}
    </MouseContext.Provider>
  )
}

export function useMousePosition() {
  const context = useContext(MouseContext)
  if (!context) throw new Error("useMousePosition must be used within MouseProvider")
  return context
}
