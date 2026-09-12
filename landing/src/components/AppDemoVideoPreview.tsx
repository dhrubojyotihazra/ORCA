'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, ExternalLink } from 'lucide-react';
import { MacbookPro } from '@/components/ui/macbook-pro';

interface AppDemoVideoPreviewProps {
  videoSrc?: string;
  posterSrc?: string;
  youtubeUrl?: string;
  className?: string;
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export function AppDemoVideoPreview({
  videoSrc = '/demo-preview.mp4',
  posterSrc = '/images/demo-preview-poster.png',
  youtubeUrl = 'https://youtu.be/sYZFu3BxVJA?si=5zFauYf7aAtkfS3d',
  className = '',
}: AppDemoVideoPreviewProps) {
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    // If opened via normal left click, allow native anchor or window.open fallback
    if (youtubeUrl && (!e.ctrlKey && !e.metaKey && !e.shiftKey)) {
      e.preventDefault();
      window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.a
      href={youtubeUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative block w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[500px] xl:max-w-[550px] select-none cursor-pointer transition-transform duration-500 ease-out hover:scale-[1.015] ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      aria-label="Watch full ORCA app walkthrough on YouTube"
    >
      {/* ── Oceanic Cyan Ambient Glow Behind MacBook ── */}
      <div className="absolute -inset-2 sm:-inset-4 rounded-[30px] bg-gradient-to-r from-teal-500/20 via-cyan-500/35 to-blue-500/20 opacity-60 blur-2xl sm:blur-3xl group-hover:opacity-95 group-hover:blur-[36px] transition-all duration-700 -z-10 pointer-events-none" />

      {/* ── Photorealistic MacBook Pro Chassis ── */}
      <div className="relative w-full aspect-[650/400] drop-shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
        {/* SVG MacBook Hardware Frame */}
        <MacbookPro
          src={posterSrc}
          className="w-full h-full text-black"
        />

        {/* ── Interactive Screen Area Overlay (Coordinates match SVG screen viewport) ── */}
        <div
          className="absolute overflow-hidden rounded-[3px] sm:rounded-[5px] bg-[#020b14]"
          style={{
            left: '11.465%',
            top: '5.33%',
            width: '77.11%',
            height: '80.96%',
          }}
        >
          {/* Looping muted video preview (Recordly recording) or high-res poster */}
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
              className="w-full h-full object-cover object-top filter brightness-[0.94] contrast-[1.02] group-hover:brightness-100 transition-all duration-500"
            />
          ) : (
            <img
              src={posterSrc}
              alt="ORCA App Demo"
              className="w-full h-full object-cover object-top filter brightness-[0.94] group-hover:brightness-100 transition-all duration-500"
            />
          )}

          {/* Notch Cover for camera authenticity */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[10.8%] h-[2.5%] min-h-[5px] bg-black rounded-b-[3px] z-20 pointer-events-none flex items-center justify-center">
            <span className="size-[2px] sm:size-[3px] rounded-full bg-[#080d4c] shadow-[0_0_2px_rgba(59,130,246,0.6)]" />
          </div>

          {/* Screen Vignette Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none z-10" />

          {/* ── Centered YouTube Play Badge ── */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-2.5 p-3 z-20 pointer-events-none">
            {/* Play Button Icon */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing ring */}
              <span className="absolute size-11 sm:size-14 rounded-full bg-cyan-400/30 animate-ping opacity-70" />
              
              <div className="relative size-10 sm:size-12 rounded-full bg-gradient-to-br from-cyan-400 via-teal-500 to-cyan-600 p-[1.5px] shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_35px_rgba(6,182,212,0.85)]">
                <div className="w-full h-full rounded-full bg-[#031526]/90 backdrop-blur-xl flex items-center justify-center pl-0.5">
                  <Play className="size-4 sm:size-5 text-cyan-300 fill-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                </div>
              </div>
            </div>

            {/* Click to Watch CTA Label */}
            <div className="flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-white/90 shadow-xl transition-all duration-300 group-hover:border-cyan-400/50 group-hover:bg-cyan-950/80">
              <YoutubeIcon className="size-3 sm:size-3.5 text-red-500" />
              <span className="text-[10px] sm:text-xs font-medium tracking-wide">
                Watch Full Walkthrough
              </span>
              <ExternalLink className="size-2.5 sm:size-3 text-cyan-300 opacity-80 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </motion.a>
  );
}
