'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { GlassFilterDefs } from '@/components/GlassFilterDefs';
import { LiquidGlassCard } from '@/components/LiquidGlassCard';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay },
});

export function HeroSection() {
  // videoRef is passed to LiquidGlassCard so the canvas can draw from it.
  // If you have a video asset, swap AnimatedBackground for the <video> below
  // and remove AnimatedBackground. For now we use the animated canvas fallback.
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <section className="relative min-h-screen min-h-svh flex flex-col overflow-hidden">

      {/* SVG chromatic dispersion filter — off-screen, zero size */}
      <GlassFilterDefs />

      {/* Animated canvas background (fallback — replace with <video> when asset ready) */}
      <AnimatedBackground />

      {/*
        If you have a video asset, replace <AnimatedBackground /> with:
        <video
          ref={videoRef}
          className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
          autoPlay muted loop playsInline preload="auto"
          src="/hero.mp4"
          aria-hidden="true"
        />
        And point videoRef at the element above via a callback ref.
      */}

      {/* Content — sits above the background (z-10) */}
      <div className="relative z-10 flex flex-col justify-between flex-1 px-5 sm:px-8 md:px-12 pt-24 sm:pt-28 pb-12 md:pb-16">

        {/* ── Top content row ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">

          {/* Left — service list */}
          <div className="flex flex-col gap-2">
            {['/ AGENTIC OCEAN INTELLIGENCE', '/ SATELLITE EARTH OBSERVATION', '/ MULTILINGUAL REASONING'].map((line, i) => (
              <motion.p
                key={line}
                className="font-mono text-xs uppercase tracking-[0.15em] text-white/80 drop-shadow-md"
                {...fadeUp(0.15 + i * 0.12)}
              >
                {line}
              </motion.p>
            ))}
          </div>

          {/* Right — one-line intro */}
          <motion.p
            className="max-w-xs sm:text-right text-base sm:text-lg leading-relaxed text-white/85 drop-shadow-md"
            {...fadeUp(0.3)}
          >
            We deploy agentic AI that brings satellite clarity, ocean precision,
            and plain-language intelligence to every coastal decision.
          </motion.p>
        </div>

        {/* ── Bottom content row ─────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-12 mt-auto">

          {/* Left column — badge + headline + CTA */}
          <div className="max-w-xl">

            {/* Eyebrow badge */}
            <motion.div {...fadeUp(0.15)}>
              <span
                className="inline-block mb-5 font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-1.5 border-l-2 border-white bg-white/15 backdrop-blur-md text-white"
              >
                SIH 2026 · Agentic Marine Intelligence
              </span>
            </motion.div>

            {/* Headline — Orbitron display */}
            <motion.h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-lg"
              {...fadeUp(0.28)}
            >
              Where the Ocean<br />Answers Back
            </motion.h1>

            {/* Subhead */}
            <motion.p
              className="mt-5 max-w-lg text-base sm:text-lg leading-relaxed text-white/75 drop-shadow-md"
              {...fadeUp(0.42)}
            >
              ORCA reads live satellite data, ocean sensors, and weather systems —
              then answers in plain language, before you ever leave the harbor.
            </motion.p>

            {/* Chamfered CTA — top-left and bottom-right corners cut at 14px */}
            <motion.a
              href="#demo"
              className="relative inline-flex items-center justify-between gap-3 mt-8 text-sm font-medium text-white transition-opacity duration-300 hover:opacity-75"
              style={{ width: 220, height: 48 }}
              {...fadeUp(0.54)}
            >
              {/* Frosted backing — same chamfer silhouette via clip-path */}
              <span
                className="absolute inset-0 bg-white/15 backdrop-blur-md border border-white/25"
                style={{
                  clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
                }}
                aria-hidden="true"
              />
              {/* SVG chamfer outline — scales to element via preserveAspectRatio="none" */}
              <svg
                className="absolute inset-0 w-full h-full overflow-visible"
                viewBox="0 0 220 48"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon
                  points="14,0 220,0 220,34 206,48 0,48 0,14"
                  fill="none"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <span className="relative pl-5 font-mono text-xs uppercase tracking-[0.12em]">
                Talk to ORCA
              </span>
              <ChevronRight className="relative mr-4 w-4 h-4 text-teal-400" strokeWidth={2} />
            </motion.a>
          </div>

          {/* Right column — the liquid-glass refraction card */}
          <div className="flex-shrink-0">
            <LiquidGlassCard videoRef={videoRef} />
          </div>

        </div>

      </div>
    </section>
  );
}
