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
        {/* Giant "4 4" Background Typography exactly like reference */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <span className="text-[200px] sm:text-[300px] md:text-[400px] lg:text-[460px] font-black text-white/50 tracking-[0.35em] sm:tracking-[0.4em] md:tracking-[0.45em] leading-none font-sans translate-x-[0.18em] sm:translate-x-[0.2em]">
            44
          </span>
        </div>

        {/* Big Interactive Cyan Ghost Centered in Front */}
        <div className="relative z-10 w-[240px] sm:w-[320px] md:w-[380px] h-[300px] sm:h-[380px] md:h-[440px] flex items-center justify-center cursor-pointer">
          <InteractiveGhost
            animationStyle="smooth"
            mood="neutral"
            colorTop="#a5f3fc"
            colorMiddle="#22d3ee"
            colorBottom="#0284c7"
            colorBackTop="#0369a1"
            colorBackBottom="#0c4a6e"
            glowColor="#38bdf8"
            characterScale={1.65}
            bodyHeight={170}
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
