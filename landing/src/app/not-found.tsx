"use client";

import React from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import InteractiveGhost from "@/components/ui/interactive-ghost";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] w-full bg-gradient-to-b from-[#0284c7] via-[#06b6d4] to-[#ecfeff] flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* ── Center Stage: 4 [Ghost] 4 ── */}
      <div className="relative flex items-center justify-center w-full max-w-5xl px-4 my-auto">
        <div className="relative flex items-center justify-center select-none">
          {/* Left "4" */}
          <span className="text-[170px] sm:text-[260px] md:text-[340px] lg:text-[410px] font-bold text-white/70 select-none pointer-events-none leading-none -mr-6 sm:-mr-12 md:-mr-18 lg:-mr-24 z-0 font-sans tracking-tight">
            4
          </span>

          {/* Interactive Cyan Ghost Centered in Front */}
          <div className="relative z-10 w-[230px] sm:w-[310px] md:w-[370px] lg:w-[420px] h-[280px] sm:h-[360px] md:h-[420px] lg:h-[470px] flex items-center justify-center cursor-pointer">
            <InteractiveGhost
              animationStyle="smooth"
              mood="neutral"
              colorTop="#a5f3fc"
              colorMiddle="#22d3ee"
              colorBottom="#0284c7"
              colorBackTop="#0369a1"
              colorBackBottom="#0c4a6e"
              glowColor="#38bdf8"
              characterScale={2.05}
              bodyHeight={160}
              floatingSpeed={1.1}
              animatingSpeed={1}
              interactiveEyes={true}
              followGlobalMouse={true}
              enableChat={true}
              quotes={[
                "Boo! 👻 Coordinates lost!",
                "404: Even my sonar is puzzled!",
                "You're off the nautical charts! 🌊",
                "Did I scare you? Click me again!",
                "Deep oceanic void ahead! Better turn back! 🧭",
              ]}
              chatBgColor="#ffffff"
              chatTextColor="#0284c7"
            />
          </div>

          {/* Right "4" */}
          <span className="text-[170px] sm:text-[260px] md:text-[340px] lg:text-[410px] font-bold text-white/70 select-none pointer-events-none leading-none -ml-6 sm:-ml-12 md:-ml-18 lg:-ml-24 z-0 font-sans tracking-tight">
            4
          </span>
        </div>
      </div>

      {/* ── Ultra-Clean Minimal Return Navigation ── */}
      <div className="absolute bottom-8 sm:bottom-12 z-20 flex flex-col items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/25 hover:bg-white/35 text-white font-bold text-sm backdrop-blur-md border border-white/30 transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <Home className="size-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </main>
  );
}
