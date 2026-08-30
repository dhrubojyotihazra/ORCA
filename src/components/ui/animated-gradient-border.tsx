'use client';

import React, { useRef, useCallback, CSSProperties, ReactNode, HTMLAttributes } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

export type AnimationMode = 'auto-rotate' | 'rotate-on-hover' | 'stop-rotate-on-hover';

export interface BorderRotateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  children: ReactNode;
  className?: string;
 
  // Animation customization
  animationMode?: AnimationMode;
  animationSpeed?: number; // Duration in seconds
 
  // Color customization
  gradientColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  backgroundColor?: string;
 
  // Border customization
  borderWidth?: number;
  borderRadius?: number;

  // Spotlight customization
  enableSpotlight?: boolean;
  spotlightColor?: string;
  spotlightSize?: number;
 
  // Container styling
  style?: CSSProperties;
}

const defaultGradientColors = {
  primary: '#584827',
  secondary: '#c7a03c',
  accent: '#f9de90',
};

export const BorderRotate: React.FC<BorderRotateProps> = ({
  children,
  className = '',
  animationMode = 'auto-rotate',
  animationSpeed = 5,
  gradientColors = defaultGradientColors,
  backgroundColor = '#07131D',
  borderWidth = 2,
  borderRadius = 24,
  enableSpotlight = true,
  spotlightColor,
  spotlightSize = 360,
  style = {},
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-spotlightSize);
  const mouseY = useMotionValue(-spotlightSize);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const { left, top } = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - left);
      mouseY.set(e.clientY - top);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-spotlightSize);
    mouseY.set(-spotlightSize);
  }, [mouseX, mouseY, spotlightSize]);

  // Use the member's accent/secondary color with smooth alpha for the spotlight pool
  const activeSpotlightColor = spotlightColor || `${gradientColors.secondary}40`;

  const spotlightBackground = useMotionTemplate`
    radial-gradient(${spotlightSize}px circle at ${mouseX}px ${mouseY}px, ${activeSpotlightColor}, transparent 80%)
  `;

  // Get animation class based on mode
  const getAnimationClass = () => {
    switch (animationMode) {
      case 'auto-rotate':
        return 'gradient-border-auto';
      case 'rotate-on-hover':
        return 'gradient-border-hover';
      case 'stop-rotate-on-hover':
        return 'gradient-border-stop-hover';
      default:
        return '';
    }
  };
 
  const combinedStyle: CSSProperties = {
    // CSS custom variables
    ['--gradient-primary' as string]: gradientColors.primary,
    ['--gradient-secondary' as string]: gradientColors.secondary,
    ['--gradient-accent' as string]: gradientColors.accent,
    ['--bg-color' as string]: backgroundColor,
    ['--border-width' as string]: `${borderWidth}px`,
    ['--border-radius' as string]: `${borderRadius}px`,
    ['--animation-duration' as string]: `${animationSpeed}s`,
    border: `${borderWidth}px solid transparent`,
    borderRadius: `${borderRadius}px`,
    backgroundImage: `
      linear-gradient(${backgroundColor}, ${backgroundColor}),
      conic-gradient(
        from var(--gradient-angle, 0deg),
        ${gradientColors.primary} 0%,
        ${gradientColors.secondary} 37%,
        ${gradientColors.accent} 30%,
        ${gradientColors.secondary} 33%,
        ${gradientColors.primary} 40%,
        ${gradientColors.primary} 50%,
        ${gradientColors.secondary} 77%,
        ${gradientColors.accent} 80%,
        ${gradientColors.secondary} 83%,
        ${gradientColors.primary} 90%
      )
    `,
    backgroundClip: 'padding-box, border-box',
    backgroundOrigin: 'padding-box, border-box',
    ...style,
  };
 
  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden gradient-border-component ${getAnimationClass()} ${className}`}
      style={combinedStyle}
      {...props}
    >
      {/* ── Liquid Glass Refraction Layer ── */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit] -z-10 opacity-75"
        style={{
          filter: 'url(#glass-distortion)',
          WebkitFilter: 'url(#glass-distortion)',
        }}
      />

      {/* ── Interactive Cursor-Tracking Spotlight Effect Layer in Member's Color ── */}
      {enableSpotlight && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-0"
          style={{
            background: spotlightBackground,
          }}
        />
      )}

      {/* ── Inset Specular Glass Bevel ── */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit] z-0"
        style={{
          boxShadow: `
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.12),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.4)
          `,
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};

