"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Home,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Waves,
  Smile,
  ShieldCheck,
} from "lucide-react";
import InteractiveGhost, {
  type GhostMood,
  type GhostAnimationStyle,
} from "@/components/ui/interactive-ghost";

const COLOR_PRESETS = [
  {
    name: "Spectral Lime",
    label: "Lime",
    colorTop: "#eaff5e",
    colorMiddle: "#a3e635",
    colorBottom: "#16a34a",
    colorBackTop: "#65a30d",
    colorBackBottom: "#14532d",
    glowColor: "#eaff5e",
    chipBg: "bg-[#a3e635]/20 text-[#eaff5e] border-[#a3e635]/40",
  },
  {
    name: "Abyssal Cyan",
    label: "Cyan",
    colorTop: "#a5f3fc",
    colorMiddle: "#22d3ee",
    colorBottom: "#0891b2",
    colorBackTop: "#0e7490",
    colorBackBottom: "#164e63",
    glowColor: "#22d3ee",
    chipBg: "bg-[#22d3ee]/20 text-[#a5f3fc] border-[#22d3ee]/40",
  },
  {
    name: "Phantom Violet",
    label: "Violet",
    colorTop: "#f5d0fe",
    colorMiddle: "#c084fc",
    colorBottom: "#7e22ce",
    colorBackTop: "#6b21a8",
    colorBackBottom: "#3b0764",
    glowColor: "#c084fc",
    chipBg: "bg-[#c084fc]/20 text-[#f5d0fe] border-[#c084fc]/40",
  },
  {
    name: "Casper Frost",
    label: "Frost",
    colorTop: "#ffffff",
    colorMiddle: "#cbd5e1",
    colorBottom: "#64748b",
    colorBackTop: "#475569",
    colorBackBottom: "#1e293b",
    glowColor: "#ffffff",
    chipBg: "bg-white/20 text-white border-white/40",
  },
];

const MOODS: { id: GhostMood; label: string; icon: string }[] = [
  { id: "neutral", label: "Neutral", icon: "👻" },
  { id: "happy", label: "Happy", icon: "😊" },
  { id: "excited", label: "Excited", icon: "🤩" },
  { id: "anxious", label: "Anxious", icon: "😰" },
  { id: "sad", label: "Sad", icon: "🥺" },
  { id: "angry", label: "Angry", icon: "😠" },
];

export default function NotFound() {
  const [mood, setMood] = useState<GhostMood>("neutral");
  const [colorIndex, setColorIndex] = useState(0);
  const [animStyle, setAnimStyle] = useState<GhostAnimationStyle>("smooth");
  const [lastQuote, setLastQuote] = useState<string>("");

  const activePreset = COLOR_PRESETS[colorIndex];

  return (
    <main className="min-h-[100dvh] w-full bg-[#030712] text-white flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden select-none">
      {/* ── Ambient Underwater Lighting & Deep-Sea Rays ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-25 transition-all duration-700 pointer-events-none"
          style={{ background: activePreset.glowColor }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(6,182,212,0.12),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02050b]/80 via-transparent to-[#02050b]" />
      </div>

      {/* ── Top Header Bar ── */}
      <header className="relative z-10 w-full max-w-5xl flex items-center justify-between gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all backdrop-blur-md"
        >
          <ArrowLeft className="size-3.5" />
          <span>RETURN TO OVERVIEW</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.2)] backdrop-blur-md">
          <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
          <span>PHANTOM FREQUENCY · 404.0 MHz</span>
        </div>
      </header>

      {/* ── Center Stage: Interactive Ghost & 404 Hero ── */}
      <section className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-2xl text-center px-2 py-4">
        {/* Interactive Ghost Mascot */}
        <div className="relative w-full h-[260px] sm:h-[300px] flex items-center justify-center cursor-pointer group">
          <InteractiveGhost
            mood={mood}
            animationStyle={animStyle}
            colorTop={activePreset.colorTop}
            colorMiddle={activePreset.colorMiddle}
            colorBottom={activePreset.colorBottom}
            colorBackTop={activePreset.colorBackTop}
            colorBackBottom={activePreset.colorBackBottom}
            glowColor={activePreset.glowColor}
            characterScale={1.1}
            bodyHeight={170}
            floatingSpeed={1.1}
            animatingSpeed={1}
            interactiveEyes={true}
            followGlobalMouse={true}
            enableChat={true}
            quotes={[
              "Boo! 👻 Coordinates lost!",
              "404: Even my sonar is puzzled!",
              "You've sailed off the nautical chart! 🌊",
              "Did I scare you? Click me again!",
              "Deep oceanic void ahead! Better turn back! 🧭",
              "I'm the friendly phantom of 404s past!",
              "Captain, our compass is spinning! ⚓",
            ]}
            onGhostClick={(quote) => setLastQuote(quote)}
          />
        </div>

        {/* Tip Hint */}
        <p className="text-[11px] font-mono text-slate-400 -mt-1 mb-4 opacity-75 group-hover:opacity-100 transition-opacity">
          Click the phantom to hear its thoughts · Eyes follow your cursor
        </p>

        {/* 404 Headline */}
        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-bold tracking-widest uppercase">
            <span>Coordinate Unreachable</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            Lost in the Deep Abyss
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            The requested nautical sector does not exist in the ORCA coastal registry.
            Even our resident deep-sea phantom couldn&apos;t locate the signal.
          </p>
        </div>

        {/* ── Interactive Controls: Mood & Spectral Glow ── */}
        <div className="w-full max-w-lg rounded-2xl bg-white/[0.03] border border-white/10 p-3 backdrop-blur-md shadow-2xl mb-6 space-y-2.5">
          {/* Mood Selector */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider pl-1">
              Ghost Mood:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    mood === m.id
                      ? "bg-white text-slate-950 font-bold shadow-md scale-105"
                      : "bg-white/5 hover:bg-white/15 text-slate-300"
                  }`}
                  title={`Set mood to ${m.label}`}
                >
                  <span>{m.icon}</span>
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Presets & Cloth Style */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider pl-1">
                Glow:
              </span>
              {COLOR_PRESETS.map((p, idx) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setColorIndex(idx)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    colorIndex === idx
                      ? p.chipBg + " scale-105 font-bold shadow-sm"
                      : "bg-transparent text-slate-400 border-white/10 hover:border-white/30"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setAnimStyle((prev) => (prev === "smooth" ? "classic" : "smooth"))
              }
              className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 cursor-pointer flex items-center gap-1 hover:underline pl-1"
            >
              <Waves className="size-3" />
              <span>{animStyle === "smooth" ? "Cloth: Smooth" : "Cloth: Classic"}</span>
            </button>
          </div>
        </div>

        {/* ── Primary Action Navigation Deck ── */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-semibold text-white transition-all backdrop-blur-md shadow-md active:scale-95"
          >
            <Home className="size-4 text-cyan-400" />
            <span>Home Deck</span>
          </Link>

          <Link
            href="/app"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-[0_0_24px_rgba(6,182,212,0.45)] transition-all active:scale-95"
          >
            <MessageSquare className="size-4" />
            <span>Launch ORCA Chat</span>
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-slate-300 hover:text-white transition-all backdrop-blur-md active:scale-95"
          >
            <Compass className="size-4 text-amber-400" />
            <span>Port Login</span>
          </Link>
        </div>
      </section>

      {/* ── Bottom Footer Provenance ── */}
      <footer className="relative z-10 w-full max-w-5xl flex items-center justify-between text-[11px] font-mono text-slate-500 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-teal-500" />
          <span>ORCA · ISRO SIH26176 MARITIME REGISTRY</span>
        </div>
        <span>SECTOR ERROR 404</span>
      </footer>
    </main>
  );
}
