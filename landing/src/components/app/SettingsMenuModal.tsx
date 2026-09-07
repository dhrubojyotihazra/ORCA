"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  X,
  Info,
  User,
  CreditCard,
  Sliders,
  Cpu,
  ShieldCheck,
  Moon,
  Sun,
  Type,
  Volume2,
  Smartphone,
  Bell,
  Shield,
  Share2,
  LogOut,
  ChevronRight,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/lib/app-context";

export function SettingsMenuModal() {
  const router = useRouter();
  const {
    theme,
    toggleTheme,
    isSettingsOpen,
    setIsSettingsOpen,
    hapticFeedback,
    setHapticFeedback,
    language,
    setLanguage,
    userRole,
    userLocation,
    vesselType,
    showToast,
  } = useApp();

  const isLight = theme === "light";

  // Sub-view dialog states
  const [activeSubView, setActiveSubView] = useState<
    "none" | "info" | "capabilities" | "connectors" | "language" | "upgrade" | "profile"
  >("none");

  // Upgrade success state
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);

  if (!isSettingsOpen) return null;

  const handleClose = () => {
    setActiveSubView("none");
    setIsSettingsOpen(false);
  };

  const handleLogout = () => {
    showToast("Signing out of ORCA fleet session...", "info");
    setTimeout(() => {
      handleClose();
      router.push("/login");
    }, 600);
  };

  const languages = [
    { code: "en", label: "English", dialect: "Maritime Standard (UTC)" },
    { code: "ta", label: "தமிழ் (Tamil)", dialect: "Coromandel & Palk Bay" },
    { code: "bn", label: "বাংলা (Bengali)", dialect: "Bay of Bengal & Sundarbans" },
    { code: "ml", label: "മലയാളം (Malayalam)", dialect: "Malabar & Arabian Sea" },
    { code: "hi", label: "हिन्दी (Hindi)", dialect: "National Maritime Protocol" },
  ];

  const agentCapabilities = [
    {
      id: "ocean",
      name: "Ocean & PFZ Specialist",
      desc: "Thermal fronts, chlorophyll-a convergence & pelagic fish migration",
      model: "Oceansat-3 L3 (MOSDAC)",
      status: "Active",
    },
    {
      id: "weather",
      name: "Marine Hydrodynamics Agent",
      desc: "Significant wave height (Hs), peak period & sea-state safety index",
      model: "INCOIS High-Res OSF",
      status: "Active",
    },
    {
      id: "squall",
      name: "Squall & Cyclone Early Warning",
      desc: "Real-time atmospheric radar vectors & capsizing hazard mitigation",
      model: "IMD Doppler & INSAT-3DR",
      status: "Active",
    },
    {
      id: "imbl",
      name: "IMBL & Protected Area Geofence",
      desc: "Autonomous boundary detection against sovereign lines & turtle MPAs",
      model: "PostGIS Spatial Engine",
      status: "Active",
    },
    {
      id: "synth",
      name: "Multilingual Indic Synthesizer",
      desc: "Low-connectivity localized voice & structured bulletin formatting",
      model: "Groq LPU / Whisper Small",
      status: "Active",
    },
  ];

  const connectors = [
    { name: "ISRO MOSDAC Satellite Telemetry", type: "Oceansat-3 & INSAT-3DR", status: "Connected", ping: "42ms" },
    { name: "INCOIS ERDDAP Marine Server", type: "Ocean State Forecasts & PFZ", status: "Connected", ping: "68ms" },
    { name: "NavIC Satellite Constellation", type: "Indian Regional GNSS / PNT", status: "Synchronized", ping: "12ms" },
    { name: "ICAR-CMFRI Marine Fisheries", type: "Coastal Demographics & Census", status: "Cached", ping: "Local" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-md h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-[32px] overflow-hidden shadow-2xl transition-colors duration-300 z-10 select-none ${
            isLight
              ? "bg-[#f7f9fc] text-slate-900 border-x sm:border border-slate-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
              : "bg-[#070d18] text-slate-100 border-x sm:border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.7)]"
          }`}
        >
          {/* ── Top Header ── */}
          <div
            className={`h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 border-b transition-colors ${
              isLight ? "bg-white/80 border-slate-200/60 backdrop-blur-md" : "bg-[#070d18]/90 border-white/10 backdrop-blur-md"
            }`}
          >
            <button
              onClick={handleClose}
              className={`size-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isLight ? "hover:bg-slate-100 text-slate-700 active:scale-95" : "hover:bg-white/10 text-slate-200 active:scale-95"
              }`}
              title="Close Settings"
              aria-label="Close Settings"
            >
              <ArrowLeft className="size-5 stroke-[2.25]" />
            </button>

            <h1 className="text-lg font-serif font-semibold tracking-tight">Settings</h1>

            <button
              onClick={() => setActiveSubView("info")}
              className={`size-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isLight ? "hover:bg-slate-100 text-slate-700 active:scale-95" : "hover:bg-white/10 text-slate-200 active:scale-95"
              }`}
              title="About ORCA"
              aria-label="About ORCA"
            >
              <Info className="size-5 stroke-[2]" />
            </button>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 space-y-3.5 sm:space-y-4">
            {/* 1. User Email Card */}
            <div
              onClick={() => setActiveSubView("profile")}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-200 cursor-pointer ${
                isLight
                  ? "bg-white border border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md active:scale-[0.99]"
                  : "bg-[#0c1524] border border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.3)] hover:border-cyan-500/30 active:scale-[0.99]"
              }`}
            >
              <div className="min-w-0 pr-2">
                <span className="text-[13px] sm:text-sm font-semibold tracking-tight truncate block">
                  dhrubojyotihazra@gmail.com
                </span>
                <span
                  className={`text-[11px] block truncate mt-0.5 ${
                    isLight ? "text-slate-500" : "text-slate-400 font-mono"
                  }`}
                >
                  {userLocation.name} Fleet · Call Sign: ORCA-DELTA-1
                </span>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                  isLight
                    ? "bg-slate-950 text-white"
                    : "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                }`}
              >
                {userRole.replace("_", " ")}
              </span>
            </div>

            {/* 2. Upgrade Banner Card ("Want more Claude?" -> "Want deeper ocean intelligence?") */}
            <div
              className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-300 space-y-3 ${
                isLight
                  ? "bg-white border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                  : "bg-gradient-to-br from-[#0e1c31] via-[#091526] to-[#060c18] border-cyan-500/25 shadow-[0_4px_20px_rgba(6,182,212,0.1)]"
              }`}
            >
              <div>
                <h2 className="text-[15px] font-bold font-sans tracking-tight">Want deeper ocean intelligence?</h2>
                <p className={`text-xs sm:text-[13px] mt-1 leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  Upgrade for real-time 1km SAR radar, subsurface chlorophyll fronts & NavIC satellite distress relays.
                </p>
              </div>
              <button
                onClick={() => setActiveSubView("upgrade")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer active:scale-95 ${
                  isLight
                    ? "bg-black text-white hover:bg-slate-800 shadow-sm"
                    : "bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold shadow-[0_0_16px_rgba(6,182,212,0.4)] hover:brightness-110"
                }`}
              >
                Upgrade to Fleet Command
              </button>
            </div>

            {/* 3. Card Group: Identity & Quota */}
            <div
              className={`w-full rounded-2xl border divide-y overflow-hidden transition-colors ${
                isLight
                  ? "bg-white border-slate-200/70 divide-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  : "bg-[#0c1524] border-white/10 divide-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
              }`}
            >
              {/* Profile */}
              <button
                onClick={() => setActiveSubView("profile")}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Profile</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Vessel & Harbor Credentials
                    </span>
                  </div>
                </div>
                <ChevronRight className={`size-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
              </button>

              {/* Billing */}
              <button
                onClick={() => setActiveSubView("upgrade")}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Billing & Satellite Compute</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      2,450 / 5,000 daily MOSDAC tokens
                    </span>
                  </div>
                </div>
                <ChevronRight className={`size-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
              </button>
            </div>

            {/* 4. Card Group: Capabilities, Connectors, Permissions */}
            <div
              className={`w-full rounded-2xl border divide-y overflow-hidden transition-colors ${
                isLight
                  ? "bg-white border-slate-200/70 divide-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  : "bg-[#0c1524] border-white/10 divide-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
              }`}
            >
              {/* Capabilities */}
              <button
                onClick={() => setActiveSubView("capabilities")}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sliders className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Capabilities</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      5 enabled (Multi-Agent Mesh)
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  5 active
                </span>
              </button>

              {/* Connectors */}
              <button
                onClick={() => setActiveSubView("connectors")}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cpu className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Connectors</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      MOSDAC · INCOIS · NavIC · CMFRI
                    </span>
                  </div>
                </div>
                <ChevronRight className={`size-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
              </button>

              {/* Permissions */}
              <button
                onClick={() => {
                  showToast("GPS Geofence & Audio Permissions: All Granted", "success");
                }}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Permissions</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Location, Microphone & Offline Cache
                    </span>
                  </div>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Granted</span>
              </button>
            </div>

            {/* 5. Card Group: Appearance, Language & Voice */}
            <div
              className={`w-full rounded-2xl border divide-y overflow-hidden transition-colors ${
                isLight
                  ? "bg-white border-slate-200/70 divide-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  : "bg-[#0c1524] border-white/10 divide-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
              }`}
            >
              {/* Color Mode */}
              <button
                onClick={() => {
                  toggleTheme();
                  showToast(`Switched theme to ${isLight ? "Abyss Dark" : "Cyan Light"}`, "info");
                }}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isLight ? (
                    <Moon className="size-5 text-slate-700" />
                  ) : (
                    <Sun className="size-5 text-amber-400" />
                  )}
                  <div>
                    <span className="text-sm font-medium block">Color mode</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {isLight ? "Cyan Light" : "Abyss Dark"}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isLight ? "bg-slate-100 text-slate-800" : "bg-white/10 text-cyan-300"
                  }`}
                >
                  Tap to switch
                </span>
              </button>

              {/* Font style / Language */}
              <button
                onClick={() => setActiveSubView("language")}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Type className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Language & Font style</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {languages.find((l) => l.code === language)?.label || "English"}
                    </span>
                  </div>
                </div>
                <ChevronRight className={`size-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
              </button>

              {/* Voice */}
              <button
                onClick={() => {
                  showToast("Voice Mode: Whisper Small Multi-Dialect ready", "info");
                }}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Volume2 className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Voice</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Whisper Multilingual · Marine Acoustic
                    </span>
                  </div>
                </div>
                <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Ready</span>
              </button>
            </div>

            {/* 6. Card Group: System, Haptics, Notifications & Sharing */}
            <div
              className={`w-full rounded-2xl border divide-y overflow-hidden transition-colors ${
                isLight
                  ? "bg-white border-slate-200/70 divide-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  : "bg-[#0c1524] border-white/10 divide-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
              }`}
            >
              {/* Haptic feedback (Interactive Toggle Switch!) */}
              <div className="w-full p-3.5 sm:p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Haptic feedback</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Tactile vibration on marine alerts
                    </span>
                  </div>
                </div>

                {/* Animated Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={hapticFeedback}
                  onClick={() => {
                    setHapticFeedback(!hapticFeedback);
                    showToast(`Haptic feedback ${!hapticFeedback ? "enabled" : "disabled"}`, "info");
                  }}
                  className={`relative w-12 h-6.5 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none ${
                    hapticFeedback
                      ? isLight
                        ? "bg-slate-900"
                        : "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                      : isLight
                      ? "bg-slate-300"
                      : "bg-white/20"
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`block size-5 rounded-full bg-white shadow-md transition-transform ${
                      hapticFeedback ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Notifications */}
              <button
                onClick={() => {
                  showToast("Emergency push notifications active for high waves & IMBL", "info");
                }}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bell className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Notifications</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Squall alarms & emergency directives
                    </span>
                  </div>
                </div>
                <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Enabled</span>
              </button>

              {/* Privacy */}
              <button
                onClick={() => {
                  showToast("ISRO SIH26176 Security: Zero telemetry logged externally", "success");
                }}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Privacy & Governance</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Encrypted vessel logs & audit trail
                    </span>
                  </div>
                </div>
                <ChevronRight className={`size-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
              </button>

              {/* Sharing */}
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.origin);
                  }
                  showToast("ORCA Maritime Portal link copied to clipboard!", "success");
                }}
                className={`w-full p-3.5 sm:p-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Share2 className={`size-5 ${isLight ? "text-slate-700" : "text-slate-300"}`} />
                  <div>
                    <span className="text-sm font-medium block">Sharing & Telemetry Export</span>
                    <span className={`text-xs block ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Export NMEA 0183 & GPX Waypoints
                    </span>
                  </div>
                </div>
                <ChevronRight className={`size-4 ${isLight ? "text-slate-400" : "text-slate-500"}`} />
              </button>
            </div>

            {/* 7. Card Group: Danger Zone - Log Out */}
            <div
              className={`w-full rounded-2xl border overflow-hidden transition-colors ${
                isLight
                  ? "bg-white border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  : "bg-[#0c1524] border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
              }`}
            >
              <button
                onClick={handleLogout}
                className="w-full p-4 flex items-center gap-3 text-left transition-colors cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-500/5 active:scale-[0.99]"
              >
                <LogOut className="size-5 stroke-[2.25]" />
                <span className="text-sm font-semibold tracking-wide">Log out</span>
              </button>
            </div>

            {/* Footer Version Tag */}
            <div className="text-center py-2">
              <span className={`text-[11px] font-mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                ORCA Marine AI · SIH26176 v2.4.0 · Dept. of Space
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Sub-view Modal Overlays (Capabilities, Connectors, Language, Upgrade, Profile, Info) ── */}
        <AnimatePresence>
          {activeSubView !== "none" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
            >
              <div
                className={`w-full max-w-sm rounded-[28px] p-5 shadow-2xl border space-y-4 max-h-[85vh] overflow-y-auto ${
                  isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1627] border-cyan-500/30 text-white"
                }`}
              >
                {/* Sub-view: Capabilities */}
                {activeSubView === "capabilities" && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Sliders className="size-4 text-cyan-400" />
                        <h3 className="font-bold text-sm">Autonomous Capabilities</h3>
                      </div>
                      <button
                        onClick={() => setActiveSubView("none")}
                        className="size-7 rounded-full bg-slate-200/50 dark:bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {agentCapabilities.map((agent) => (
                        <div
                          key={agent.id}
                          className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#070e1a] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{agent.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                              {agent.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                            {agent.desc}
                          </p>
                          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono block">
                            Engine: {agent.model}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Sub-view: Connectors */}
                {activeSubView === "connectors" && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Cpu className="size-4 text-cyan-400" />
                        <h3 className="font-bold text-sm">Telemetry Connectors</h3>
                      </div>
                      <button
                        onClick={() => setActiveSubView("none")}
                        className="size-7 rounded-full bg-slate-200/50 dark:bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {connectors.map((c, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#070e1a] flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold block">{c.name}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{c.type}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold block">
                              {c.status}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">{c.ping}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Sub-view: Language */}
                {activeSubView === "language" && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Type className="size-4 text-cyan-400" />
                        <h3 className="font-bold text-sm">Regional Dialect</h3>
                      </div>
                      <button
                        onClick={() => setActiveSubView("none")}
                        className="size-7 rounded-full bg-slate-200/50 dark:bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {languages.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => {
                            setLanguage(l.code);
                            showToast(`Dialect set to ${l.label}`, "success");
                            setActiveSubView("none");
                          }}
                          className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                            language === l.code
                              ? "bg-cyan-500/15 border-cyan-400 text-cyan-600 dark:text-cyan-300 font-bold"
                              : "bg-slate-50 dark:bg-[#070e1a] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div>
                            <span className="text-xs block">{l.label}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                              {l.dialect}
                            </span>
                          </div>
                          {language === l.code && <Check className="size-4 text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Sub-view: Upgrade */}
                {activeSubView === "upgrade" && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-amber-400" />
                        <h3 className="font-bold text-sm">Fleet Command Tier</h3>
                      </div>
                      <button
                        onClick={() => setActiveSubView("none")}
                        className="size-7 rounded-full bg-slate-200/50 dark:bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Authorized maritime operators gain unthrottled access to ISRO Oceansat-3 1km SAR telemetry,
                        automated INCOIS squall SMS broadcast relays, and satellite AIS ship tracking.
                      </p>
                      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                          <Check className="size-3.5" /> High-frequency 15-min SAR telemetry updates
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                          <Check className="size-3.5" /> Direct NavIC VHF distress beacon integration
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                          <Check className="size-3.5" /> Unlimited multi-agent reasoning tokens
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUpgradeSubmitted(true);
                          showToast("Fleet Command access request submitted to ISRO MOSDAC!", "success");
                          setTimeout(() => {
                            setActiveSubView("none");
                            setUpgradeSubmitted(false);
                          }, 1200);
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        {upgradeSubmitted ? "Request Sent ✓" : "Request Institutional Access"}
                      </button>
                    </div>
                  </>
                )}

                {/* Sub-view: Profile */}
                {activeSubView === "profile" && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <User className="size-4 text-cyan-400" />
                        <h3 className="font-bold text-sm">Operator Profile</h3>
                      </div>
                      <button
                        onClick={() => setActiveSubView("none")}
                        className="size-7 rounded-full bg-slate-200/50 dark:bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070e1a] border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-400">Officer Name</span>
                        <div className="font-bold text-sm">Dhrubojyoti Hazra</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070e1a] border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-400">Assigned Station</span>
                        <div className="font-bold">{userLocation.name} ({userLocation.sector})</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070e1a] border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-400">Vessel Classification</span>
                        <div className="font-bold capitalize">{vesselType} Motorized Craft (&lt;8m)</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070e1a] border border-slate-200 dark:border-white/10 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-400">Role & Security Clearance</span>
                        <div className="font-bold capitalize">{userRole.replace("_", " ")} · SIH26176 Verified</div>
                      </div>
                    </div>
                  </>
                )}

                {/* Sub-view: Info */}
                {activeSubView === "info" && (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Info className="size-4 text-cyan-400" />
                        <h3 className="font-bold text-sm">About ORCA</h3>
                      </div>
                      <button
                        onClick={() => setActiveSubView("none")}
                        className="size-7 rounded-full bg-slate-200/50 dark:bg-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="space-y-3 text-xs leading-relaxed">
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong>ORCA (Marine EcoSystem Reasoning with Collaborative Agents)</strong> is an autonomous
                        multi-agent platform engineering evidence-grounded decision intelligence for India&apos;s coastal
                        corridors.
                      </p>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070e1a] border border-slate-200 dark:border-white/10 space-y-1 font-mono text-[11px]">
                        <div>Hackathon: Smart India Hackathon 2026</div>
                        <div>Problem Statement: SIH26176</div>
                        <div>Nodal Ministry: Dept. of Space / ISRO</div>
                        <div>Collaborators: INCOIS &amp; MoES</div>
                        <div>Team: DeTABIS</div>
                      </div>
                      <a
                        href="https://www.mosdac.gov.in/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold hover:bg-cyan-500/20 transition-colors"
                      >
                        ISRO MOSDAC Portal <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
