"use client"

import React, { useEffect, useRef, useCallback, useState } from "react"
import createGlobe from "cobe"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

export interface Marker {
  id: string
  location: [number, number]
  label: string
}

export interface Arc {
  id: string
  from: [number, number]
  to: [number, number]
  label?: string
}

export interface GlobeProps {
  markers?: Marker[]
  arcs?: Arc[]
  className?: string
  markerColor?: [number, number, number]
  baseColor?: [number, number, number]
  arcColor?: [number, number, number]
  glowColor?: [number, number, number]
  dark?: number
  mapBrightness?: number
  markerSize?: number
  markerElevation?: number
  arcWidth?: number
  arcHeight?: number
  speed?: number
  theta?: number
  diffuse?: number
  mapSamples?: number
  enableZoom?: boolean
}

export function Globe({
  markers = [],
  arcs = [],
  className = "",
  markerColor = [0, 0.94, 1], // bright electric cyan
  baseColor = [0.03, 0.1, 0.16], // deep marine obsidian
  arcColor = [0.12, 0.72, 0.72], // glowing teal
  glowColor = [0.12, 0.72, 0.72], // cyan halo
  dark = 1,
  mapBrightness = 6,
  markerSize = 0.04,
  markerElevation = 0.02,
  arcWidth = 0.6,
  arcHeight = 0.28,
  speed = 0.003,
  theta = 0.25,
  diffuse = 1.6,
  mapSamples = 16000,
  enableZoom = true,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const velocity = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)

  const [zoom, setZoom] = useState(1.0)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    isPausedRef.current = true
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const deltaX = e.clientX - pointerInteracting.current.x
      const deltaY = e.clientY - pointerInteracting.current.y
      dragOffset.current = { phi: deltaX / 250, theta: deltaY / 800 }
      const now = Date.now()
      if (lastPointer.current) {
        const dt = Math.max(now - lastPointer.current.t, 1)
        const maxVelocity = 0.15
        velocity.current = {
          phi: Math.max(
            -maxVelocity,
            Math.min(maxVelocity, ((e.clientX - lastPointer.current.x) / dt) * 0.3)
          ),
          theta: Math.max(
            -maxVelocity,
            Math.min(maxVelocity, ((e.clientY - lastPointer.current.y) / dt) * 0.08)
          ),
        }
      }
      lastPointer.current = { x: e.clientX, y: e.clientY, t: now }
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
      lastPointer.current = null
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
    isPausedRef.current = false
  }, [])

  // Wheel Zoom Listener
  useEffect(() => {
    const container = containerRef.current
    if (!container || !enableZoom) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY * -0.0012
      setZoom((prev) => Math.min(1.5, Math.max(0.75, prev + delta)))
    }

    container.addEventListener("wheel", handleWheel, { passive: false })
    return () => container.removeEventListener("wheel", handleWheel)
  }, [enableZoom])

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [handlePointerMove, handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let globe: ReturnType<typeof createGlobe> | null = null
    let animationId: number
    let phi = 0

    function init() {
      if (!canvas) return
      const width = canvas.offsetWidth
      if (width === 0 || globe) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: width * dpr,
        height: width * dpr,
        phi: 0,
        theta,
        dark,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor,
        markerColor,
        glowColor,
        markerElevation,
        markers: markers.map((m) => ({
          location: m.location,
          size: markerSize,
        })),
        arcs: arcs.map((a) => ({
          from: a.from,
          to: a.to,
        })),
        arcColor,
        arcWidth,
        arcHeight,
        opacity: 0.85,
      })

      function animate() {
        if (!isPausedRef.current && globe) {
          phi += speed
          if (
            Math.abs(velocity.current.phi) > 0.0001 ||
            Math.abs(velocity.current.theta) > 0.0001
          ) {
            phiOffsetRef.current += velocity.current.phi
            thetaOffsetRef.current += velocity.current.theta
            velocity.current.phi *= 0.95
            velocity.current.theta *= 0.95
          }
          const thetaMin = -0.4,
            thetaMax = 0.4
          if (thetaOffsetRef.current < thetaMin) {
            thetaOffsetRef.current += (thetaMin - thetaOffsetRef.current) * 0.1
          } else if (thetaOffsetRef.current > thetaMax) {
            thetaOffsetRef.current += (thetaMax - thetaOffsetRef.current) * 0.1
          }
        }
        if (globe) {
          globe.update({
            phi: phi + phiOffsetRef.current + dragOffset.current.phi,
            theta: theta + thetaOffsetRef.current + dragOffset.current.theta,
            dark,
            mapBrightness,
            markerColor,
            baseColor,
            arcColor,
            markerElevation,
            markers: markers.map((m) => ({
              location: m.location,
              size: markerSize,
            })),
            arcs: arcs.map((a) => ({
              from: a.from,
              to: a.to,
            })),
          })
        }
        animationId = requestAnimationFrame(animate)
      }
      animate()
      setTimeout(() => canvas && (canvas.style.opacity = "1"), 50)
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect()
          init()
        }
      })
      ro.observe(canvas)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (globe) globe.destroy()
    }
  }, [markers, arcs, markerColor, baseColor, arcColor, glowColor, dark, mapBrightness, markerSize, markerElevation, arcWidth, arcHeight, speed, theta, diffuse, mapSamples])

  const handleZoomIn = () => setZoom((prev) => Math.min(1.5, prev + 0.15))
  const handleZoomOut = () => setZoom((prev) => Math.max(0.75, prev - 0.15))
  const handleReset = () => {
    setZoom(1.0)
    phiOffsetRef.current = 0
    thetaOffsetRef.current = 0
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square select-none overflow-hidden ${className}`}
      suppressHydrationWarning
    >
      {/* Canvas with zoom scaling */}
      <div
        className="w-full h-full transition-transform duration-200 ease-out flex items-center justify-center"
        style={{
          transform: `scale(${zoom})`,
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          style={{
            width: "100%",
            height: "100%",
            cursor: "grab",
            opacity: 0,
            transition: "opacity 1.2s ease",
            borderRadius: "50%",
            touchAction: "none",
          }}
        />
      </div>

      {/* Floating Zoom Controls (Borderless) */}
      {enableZoom && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 p-1 rounded-xl backdrop-blur-md z-30 shadow-md">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom In"
            className="p-1 hover:bg-white/10 rounded-lg text-teal-300 transition-colors"
          >
            <ZoomIn className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom Out"
            className="p-1 hover:bg-white/10 rounded-lg text-teal-300 transition-colors"
          >
            <ZoomOut className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset View"
            className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            <RotateCcw className="size-3" />
          </button>
        </div>
      )}
    </div>
  )
}
