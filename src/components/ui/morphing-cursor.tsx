"use client"

import React from "react"
import { useRef, useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"

interface MagneticTextProps {
  text: string
  hoverText?: string
  className?: string
  textClassName?: string
  circleSize?: number
  circleBgColor?: string
  hoverTextColor?: string
}

export function MagneticText({
  text = "ORCA",
  hoverText = "SIH26176",
  className,
  textClassName,
  circleSize = 130,
  circleBgColor = "bg-teal-400",
  hoverTextColor = "text-[#050B14]",
}: MagneticTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const circleRef = useRef<HTMLDivElement>(null)
  const innerTextRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const mousePos = useRef({ x: 0, y: 0 })
  const currentPos = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor

    const animate = () => {
      currentPos.current.x = lerp(currentPos.current.x, mousePos.current.x, 0.15)
      currentPos.current.y = lerp(currentPos.current.y, mousePos.current.y, 0.15)

      if (circleRef.current) {
        circleRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px) translate(-50%, -50%)`
      }

      if (innerTextRef.current) {
        innerTextRef.current.style.transform = `translate(${-currentPos.current.x}px, ${-currentPos.current.y}px)`
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    mousePos.current = { x, y }
    currentPos.current = { x, y }
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  return (
    <span
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative inline-flex items-center justify-center cursor-pointer select-none overflow-visible align-baseline",
        // A faint dashed underline hints this word is interactive before hover.
        "decoration-teal-300/50 decoration-2 underline-offset-8",
        !isHovered && "underline decoration-dotted",
        className
      )}
    >
      {/* Base text layer - original text */}
      <span className={cn("font-heading font-extrabold text-white tracking-tight", textClassName)}>
        {text}
      </span>

      {/* Morphing lens circle */}
      <div
        ref={circleRef}
        className={cn(
          "absolute top-0 left-0 pointer-events-none rounded-full overflow-hidden z-20 shadow-[0_0_30px_rgba(31,182,182,0.75)] flex items-center justify-center",
          circleBgColor
        )}
        style={{
          width: isHovered ? circleSize : 0,
          height: isHovered ? circleSize : 0,
          transition: "width 0.4s cubic-bezier(0.33, 1, 0.68, 1), height 0.4s cubic-bezier(0.33, 1, 0.68, 1)",
          willChange: "transform, width, height",
        }}
      >
        <div
          ref={innerTextRef}
          className="absolute flex items-center justify-center px-2"
          style={{
            width: containerSize.width,
            height: containerSize.height,
            top: "50%",
            left: "50%",
            willChange: "transform",
          }}
        >
          {/* Sized relative to the circle, not the (much larger) headline
              font — this is what was making the reveal text clip/vanish. */}
          <span
            className={cn(
              "font-mono font-bold whitespace-nowrap tracking-wide uppercase leading-none",
              hoverTextColor
            )}
            style={{ fontSize: Math.max(11, circleSize * 0.135) }}
          >
            {hoverText}
          </span>
        </div>
      </div>
    </span>
  )
}
