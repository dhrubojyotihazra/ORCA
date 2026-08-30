'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface LiquidGlassCardProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

// LiquidGlassCard — the centrepiece of the hero.
//
// How the refraction works:
//  1. Every rAF, we measure the card's getBoundingClientRect().
//  2. Inside the card, a <canvas> is positioned at the *negative* card offset
//     so its pixel 0,0 lines up with viewport 0,0 — the card's overflow:hidden
//     then clips it to the card shape.
//  3. We draw the current video frame into that canvas at VIEWPORT size
//     (not card size!) using object-fit:cover math.
//  4. CSS `filter: url(#liquid-glass-refraction)` applies the SVG chromatic
//     displacement to the canvas — producing the glassy rainbow fringing.
//
//  Why viewport size for the canvas?
//  The SVG filter's edge mask produces hard RGB separation bands at the
//  *element's own boundary*. If the canvas is only card-sized those bands
//  appear inside the visible area. At viewport size the bands fall outside
//  the card's clip region and only clean refraction shows through.
//
//  Why 1× pixel density?
//  The filter cost scales with pixel count; the softness of the refraction
//  hides the difference at 2× anyway.

export function LiquidGlassCard({ videoRef }: LiquidGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dupContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const card = cardRef.current;
    const dupContainer = dupContainerRef.current;
    const canvas = canvasRef.current;

    if (!video || !card || !dupContainer || !canvas) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const rect = card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    // Position duplicate so its top-left aligns with the viewport origin
    dupContainer.style.left = `${-rect.left}px`;
    dupContainer.style.top = `${-rect.top}px`;
    dupContainer.style.width = `${vw}px`;
    dupContainer.style.height = `${vh}px`;

    // Only resize canvas when viewport dimensions actually change
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;   // 1× — no devicePixelRatio
      canvas.height = vh;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // Draw with object-fit: cover math (scale to cover, centre crop)
    try {
      const coverScale = Math.max(vw / video.videoWidth, vh / video.videoHeight);
      const sw = vw / coverScale;
      const sh = vh / coverScale;
      const sx = (video.videoWidth - sw) / 2;
      const sy = (video.videoHeight - sh) / 2;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, vw, vh);
    } catch {
      // Frame not yet decodable — skip this tick
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [videoRef]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  return (
    <motion.div
      ref={cardRef}
      className="relative flex flex-col justify-between w-[340px] max-w-full h-[460px] rounded-[44px] overflow-hidden border border-white/20 pointer-events-auto cursor-pointer"
      style={{ background: 'transparent' }}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
    >
      {/* Layer 0 — Live refraction duplicate */}
      <div
        ref={dupContainerRef}
        className="absolute z-0 overflow-hidden pointer-events-none"
        style={{ position: 'absolute' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ filter: 'url(#liquid-glass-refraction)' }}
        />
      </div>

      {/* Layer 1 — Teal-navy frost sheen */}
      <div
        className="absolute inset-0 z-[1] rounded-[44px] pointer-events-none transition-[background] duration-300"
        style={{
          background: 'rgba(31, 182, 182, 0.06)',
          boxShadow:
            'inset 0 1.5px 2px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(5,11,20,0.3)',
        }}
      />

      {/* Layer 2 — Card content */}
      <div className="relative z-[2] flex flex-col justify-between h-full p-7">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_theme(colors.teal.400)]" />
            <h2 className="text-base font-semibold text-white tracking-tight">Live Advisory</h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-teal-400 bg-teal-400/10 border border-teal-400/30 px-2 py-0.5 rounded-full">
            // LIVE
          </span>
        </div>

        {/* Advisory rows */}
        <div className="flex flex-col gap-4 mt-4 flex-1">
          {[
            {
              q: '"Is it safe to go out tomorrow?"',
              a: 'Calm seas expected — a swell advisory begins near your zone at 6 PM.',
            },
            {
              q: '"Where\'s today\'s best catch?"',
              a: 'Favorable temperature and chlorophyll readings 12 km southeast of your last position.',
            },
          ].map(({ q, a }, i) => (
            <div
              key={i}
              className="rounded-2xl bg-slate-950/40 border border-white/10 p-4 space-y-2"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">{q}</p>
              <p className="text-sm leading-relaxed text-white/85">{a}</p>
            </div>
          ))}
        </div>

        {/* Bathymetric wave SVG — hand-authored irregular waveform */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <svg
            viewBox="0 0 220 50"
            fill="none"
            className="w-full h-auto opacity-60"
            aria-hidden="true"
          >
            <path
              d="M0 30 C10 30 12 45 18 45 C24 45 26 10 34 10 C42 10 44 40 52 40 C60 40 62 5 70 5 C78 5 80 42 88 42 C96 42 98 15 106 15 C114 15 116 38 124 38 C132 38 134 20 142 20 C150 20 152 35 160 35 C168 35 170 22 178 22 C186 22 188 32 196 32 C204 32 210 28 220 28"
              stroke="#1FB6B6"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex justify-between mt-2 font-mono text-[10px] uppercase tracking-widest text-white/35">
            <span>ISRO MOSDAC · INCOIS</span>
            <span className="text-teal-400">● SYNCED</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
