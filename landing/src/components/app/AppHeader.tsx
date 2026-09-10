"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import {
  Sun,
  Moon,
  Zap,
  Map,
  Plus,
} from "lucide-react";

export function AppHeader() {
  const router = useRouter();
  const {
    theme,
    toggleTheme,
    isVoiceActive,
    setIsVoiceActive,
    isMapOpen,
    setIsMapOpen,
    isSidebarCollapsed,
    setIsSettingsOpen,
    user,
  } = useApp();

  const isLight = theme === "light";
  const [avatarError, setAvatarError] = React.useState(false);

  React.useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  const userInitial = user?.displayName
    ? user.displayName.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "O";

  return (
    <header
      className={`w-full h-11 sm:h-12 flex items-center justify-end px-4 sm:px-6 py-1.5 z-20 select-none bg-transparent shrink-0 ${
        isSidebarCollapsed ? "pl-14 sm:pl-16" : ""
      }`}
    >
      {/* ── Right Area: New + Map + Voice + Theme — quiet controls ── */}
      <div className="flex items-center gap-1.5">
        {/* New Marine Inquiry Trigger */}
        <button
          onClick={() => router.push("/new")}
          data-tour="new-inquiry-btn"
          className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isLight
              ? "neo-btn-light text-slate-600 hover:text-teal-700"
              : "neo-btn-dark text-slate-300 hover:text-cyan-300"
          }`}
          title="New Marine Inquiry"
          aria-label="New Marine Inquiry"
        >
          <Plus className="size-4 stroke-[2.5]" />
        </button>
        {/* Marine Map */}
        <button
          onClick={() => setIsMapOpen(true)}
          data-tour="marine-map-btn"
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
          data-tour="voice-mode-btn"
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
          data-tour="theme-toggle-btn"
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

        {/* User Profile / Settings Menu Trigger */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          data-tour="operator-profile-btn"
          className="size-8 rounded-full flex items-center justify-center font-bold text-xs bg-gradient-to-tr from-cyan-500 to-teal-400 text-white shadow-sm ring-2 ring-white/30 dark:ring-cyan-400/30 hover:ring-cyan-400 transition-all cursor-pointer active:scale-95 shrink-0 overflow-hidden relative"
          title="Operator Settings & Profile"
          aria-label="Operator Settings & Profile"
        >
          {user?.avatarUrl && !avatarError ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || "Operator"}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
            />
          ) : (
            userInitial
          )}
        </button>
      </div>
    </header>
  );
}
