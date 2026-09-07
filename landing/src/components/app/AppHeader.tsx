"use client";

import React from "react";
import { useApp } from "@/lib/app-context";
import {
  Sun,
  Moon,
  Zap,
  Map,
} from "lucide-react";

export function AppHeader() {
  const {
    theme,
    toggleTheme,
    isVoiceActive,
    setIsVoiceActive,
    setIsMapOpen,
  } = useApp();

  const isLight = theme === "light";

  return (
    <header className="w-full flex items-center justify-end px-4 sm:px-6 py-3 z-20 select-none bg-transparent">
      {/* ── Right Area: Map + Voice + Theme — 3 quiet icons ── */}
      <div className="flex items-center gap-2">
        {/* Marine Map */}
        <button
          onClick={() => setIsMapOpen(true)}
          className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isLight
              ? "neo-btn-light text-slate-500 hover:text-teal-700"
              : "neo-btn-dark text-slate-400 hover:text-cyan-300"
          }`}
          title="Open Marine Map"
          aria-label="Marine Map"
        >
          <Map className="size-4" />
        </button>

        {/* Voice Mode */}
        <button
          onClick={() => setIsVoiceActive(true)}
          className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isVoiceActive
              ? "bg-cyan-500 text-white shadow-[0_0_16px_rgba(6,182,212,0.6)] animate-pulse"
              : isLight
              ? "neo-btn-light text-slate-500 hover:text-cyan-600"
              : "neo-btn-dark text-slate-400 hover:text-cyan-300"
          }`}
          title="Voice Assistant"
          aria-label="Voice Mode"
        >
          <Zap className="size-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isLight
              ? "neo-btn-light text-amber-500 hover:text-amber-600"
              : "neo-btn-dark text-amber-400 hover:text-amber-300"
          }`}
          title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
          aria-label="Toggle Theme"
        >
          {isLight ? <Moon className="size-3.5" /> : <Sun className="size-3.5 fill-amber-400/20" />}
        </button>
      </div>
    </header>
  );
}
