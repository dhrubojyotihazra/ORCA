'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, ExternalLink, Sparkles } from 'lucide-react';

interface AppDemoVideoPreviewProps {
  videoSrc?: string;
  posterSrc?: string;
  youtubeUrl?: string;
  className?: string;
}

export function AppDemoVideoPreview({
  videoSrc = '/demo-preview.mp4',
  posterSrc = '/images/demo-preview-poster.png',
  youtubeUrl = 'https://www.youtube.com',
  className = '',
}: AppDemoVideoPreviewProps) {
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (youtubeUrl) {
      window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[440px] select-none cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* ── Ambient Cyan Glow Behind the Chassis ── */}
      <div className="absolute -inset-1 rounded-[30px] bg-gradient-to-r from-teal-500/20 via-cyan-500/30 to-sky-500/20 opacity-70 blur-xl group-hover:opacity-100 group-hover:blur-2xl transition-all duration-500 -z-10" />

      {/* ── Glass Chassis ── */}
      <div className="relative rounded-[26px] overflow-hidden border border-cyan-400/25 group-hover:border-cyan-300/50 bg-[#031526]/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(6,182,212,0.18)] transition-all duration-500">
        
        {/* ── Window Title Bar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/10">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500/80 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
            <span className="size-2.5 rounded-full bg-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            <span className="size-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
          </div>

          {/* Window Title */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/70 font-medium tracking-wide">
            <Sparkles className="size-3 text-cyan-300" />
            <span>ORCA App Walkthrough</span>
          </div>

          {/* Live Preview Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-mono font-bold text-cyan-300">
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>PREVIEW</span>
          </div>
        </div>

        {/* ── Video Player Screen ── */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-black flex items-center justify-center">
          {!hasVideoError ? (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterSrc}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setHasVideoError(true)}
              className="w-full h-full object-cover object-top filter brightness-[0.92] group-hover:brightness-100 transition-all duration-500"
            />
          ) : (
            <img
              src={posterSrc}
              alt="ORCA App Demo Preview"
              className="w-full h-full object-cover object-top filter brightness-[0.92] group-hover:brightness-100 transition-all duration-500"
            />
          )}

          {/* Vignette & Glare Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* ── Floating YouTube Play Overlay ── */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 pointer-events-none">
            {/* Play Button */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring */}
              <span className="absolute size-14 sm:size-16 rounded-full bg-cyan-400/30 animate-ping opacity-60" />
              
              {/* Frosted Play Disc */}
              <div className="relative size-14 sm:size-16 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 p-[2px] shadow-[0_0_30px_rgba(6,182,212,0.6)] group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.85)] transition-all duration-300">
                <div className="w-full h-full rounded-full bg-[#021324]/90 backdrop-blur-md flex items-center justify-center">
                  <Play className="size-6 sm:size-7 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>

            {/* YouTube Watch Pill */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-xs font-semibold shadow-lg group-hover:scale-105 transition-all duration-300">
              <span className="text-rose-400 font-black tracking-tight">▶ YouTube</span>
              <span className="text-white/80">·</span>
              <span>Watch Full Demo</span>
              <ExternalLink className="size-3 text-cyan-300 ml-0.5" />
            </div>
          </div>

          {/* ── Bottom Quick Bar ── */}
          <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/95 to-transparent flex items-center justify-between text-[10px] font-mono text-white/70">
            <span className="flex items-center gap-1 text-cyan-300/90 font-medium">
              <span>●</span> Recorded with Recordly
            </span>
            <span className="text-white/50">1080p HD</span>
          </div>
        </div>

        {/* ── Bottom Footer Status Bar ── */}
        <div className="px-4 py-2.5 bg-black/50 border-t border-white/10 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
            <span className="text-white font-medium">Interactive Demo Walkthrough</span>
          </div>
          <span className="font-mono text-cyan-300 text-[10px]">Click to Play ↗</span>
        </div>

      </div>
    </motion.div>
  );
}
