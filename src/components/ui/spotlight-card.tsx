'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  borderSpotlightColor?: string;
  size?: number;
}

export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(31, 182, 182, 0.22)',
  borderSpotlightColor = 'rgba(31, 182, 182, 0.65)',
  size = 420,
  ...props
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(-size);
  const mouseY = useMotionValue(-size);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const { left, top } = cardRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(-size);
    mouseY.set(-size);
  }, [mouseX, mouseY, size]);

  const backgroundGradient = useMotionTemplate`
    radial-gradient(${size}px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 75%)
  `;

  const borderGradient = useMotionTemplate`
    radial-gradient(${size}px circle at ${mouseX}px ${mouseY}px, ${borderSpotlightColor}, transparent 80%)
  `;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative rounded-3xl transition-all duration-300',
        className
      )}
      {...props}
    >
      {/* ── Outer Soft Spotlight Aura on Hover ── */}
      <motion.div
        className="pointer-events-none absolute -inset-1 rounded-3xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60 -z-10"
        style={{
          background: borderGradient,
        }}
      />

      {/* ── Main Borderless Liquid Glass Card Container ── */}
      <div
        className="relative h-full w-full rounded-3xl bg-[#06101c]/60 p-7 sm:p-8 overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between"
        style={{
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* ── 1. Liquid Glass SVG Distortion Filter ── */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] -z-10 opacity-70"
          style={{
            filter: 'url(#glass-distortion)',
            WebkitFilter: 'url(#glass-distortion)',
          }}
        />

        {/* ── 2. Subtle Inset Glass Luminosity ── */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-0"
          style={{
            boxShadow: `
              inset 0 1px 1px 0 rgba(255, 255, 255, 0.08),
              inset 0 -1px 1px 0 rgba(0, 0, 0, 0.3)
            `,
          }}
        />

        {/* ── 3. Dynamic Cursor-Tracking Spotlight Light Pool ── */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[23px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0"
          style={{
            background: backgroundGradient,
          }}
        />

        {/* ── 4. Top Glass Horizon Light Highlight ── */}
        <div className="pointer-events-none absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent z-10" />

        {/* ── 5. Card Content ── */}
        <div className="relative z-20 flex flex-col justify-between h-full">
          {children}
        </div>
      </div>
    </div>
  );
}

export default SpotlightCard;
