"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  Radio,
  Map,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Users,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/app-context";

interface TourStep {
  targetSelector?: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  tip?: string;
  preferredPosition?: "top" | "bottom" | "left" | "right" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="prompt-card"]',
    title: "Intelligent Marine Dispatch",
    subtitle: "Conversational Coastal Operations",
    description:
      "Type or dictate maritime inquiries in English or coastal Indian dialects (Hindi, Bengali, Tamil, etc.). Inquire about Potential Fishing Zones (PFZ), wave height safety, cyclone warnings, or voyage departure clearance.",
    badge: "Operational Prompt Bar",
    icon: MessageSquare,
    tip: "Pro-tip: Try asking 'Where is the nearest PFZ today from Paradip?'",
    preferredPosition: "top",
  },
  {
    targetSelector: '[data-tour="voice-mode-btn"]',
    title: "Hands-Free Bhasini Voice Copilot",
    subtitle: "Real-time Maritime Speech AI",
    description:
      "Operate ORCA hands-free on the vessel bridge or helm. Click the Zap icon in the header for full-screen voice mode, or the Mic button in the prompt bar to dictate directly using Bhasini ASR.",
    badge: "Hands-Free Bridge Voice",
    icon: Zap,
    tip: "Zero-latency audio streaming tuned for coastal acoustic noise.",
    preferredPosition: "bottom",
  },
  {
    targetSelector: '[data-tour="marine-map-btn"]',
    title: "Live PostGIS Marine Map",
    subtitle: "Satellite Remote Sensing & Geofences",
    description:
      "Inspect high-resolution geospatial ocean layers: Potential Fishing Zones (PFZ), Sea Surface Temperature (SST) thermal fronts, wave height contours, and protected boundaries (Gahirmatha & IMBL).",
    badge: "Geospatial Navigation",
    icon: Map,
    tip: "Click the Map button in the header anytime to open the overlay.",
    preferredPosition: "bottom",
  },
  {
    targetSelector: '[data-tour="sidebar-roles"]',
    title: "Stakeholder Roles & Vessel Telemetry",
    subtitle: "Dynamic Hydrodynamic Calibration",
    description:
      "Switch between Fisher, Coast Guard, Port Operations, and Scientist modes. ORCA dynamically adjusts hydrodynamic safety index calculations and risk thresholds according to your selected vessel size.",
    badge: "Multirole & Craft Sizing",
    icon: Users,
    tip: "Calibrated to craft length (<8m artisanal vs >15m mechanized).",
    preferredPosition: "right",
  },
  {
    targetSelector: '[data-tour="sidebar-chats"]',
    title: "Preloaded Tutorial Mission",
    subtitle: "Full-Featured Demonstration Query",
    description:
      "Check out the preloaded 'ORCA Maritime Tutorial & Walkthrough' in your sidebar. It includes complete mathematical formulations, species HSI tables, Sea-Venture indices, and geofence alerts.",
    badge: "Demonstration Mission",
    icon: Radio,
    tip: "Click the mission in the sidebar to review all verified capabilities.",
    preferredPosition: "right",
  },
];

export function OnboardingTourModal() {
  const { isOnboardingOpen, setIsOnboardingOpen, theme } = useApp();
  const isLight = theme === "light";

  // Mode: "welcome" | "tour" | "complete"
  const [mode, setMode] = useState<"welcome" | "tour" | "complete">("welcome");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Dismiss & persist seen flag
  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem("orca_tutorial_seen_v1", "true");
    } catch {}
    setIsOnboardingOpen(false);
    // Reset state for future replays
    setTimeout(() => {
      setMode("welcome");
      setCurrentStepIndex(0);
    }, 300);
  }, [setIsOnboardingOpen]);

  // Start the interactive tour
  const handleStartTour = () => {
    setMode("tour");
    setCurrentStepIndex(0);
  };

  // Step navigation
  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setMode("complete");
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      setMode("welcome");
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOnboardingOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      } else if (mode === "tour") {
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "ArrowLeft") handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOnboardingOpen, mode, currentStepIndex, handleDismiss]);

  // Compute spotlight bounding rect
  useEffect(() => {
    if (!isOnboardingOpen || mode !== "tour" || !currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(currentStep.targetSelector!);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Check if element is visible
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          return;
        }
      }
      setTargetRect(null);
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    const timer = setTimeout(updateRect, 100);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      clearTimeout(timer);
    };
  }, [isOnboardingOpen, mode, currentStepIndex, currentStep]);

  if (!isOnboardingOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center select-none overflow-hidden">
        {/* ── Spotlight / Backdrop Layer ── */}
        {mode === "tour" && targetRect ? (
          <div className="absolute inset-0 pointer-events-auto">
            {/* SVG mask for spotlight cutout */}
            <svg className="w-full h-full" style={{ fillRule: "evenodd" }}>
              <defs>
                <mask id="spotlight-mask">
                  {/* White background = visible mask */}
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {/* Black cutout = punch hole through mask */}
                  <rect
                    x={targetRect.left - 6}
                    y={targetRect.top - 6}
                    width={targetRect.width + 12}
                    height={targetRect.height + 12}
                    rx="16"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(4, 9, 18, 0.75)"
                mask="url(#spotlight-mask)"
                className="backdrop-blur-[2px] transition-all duration-300"
              />
            </svg>

            {/* Glowing animated spotlight ring around target */}
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              style={{
                position: "absolute",
                top: targetRect.top - 6,
                left: targetRect.left - 6,
                width: targetRect.width + 12,
                height: targetRect.height + 12,
              }}
              className="pointer-events-none rounded-2xl ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.45)] animate-pulse"
            />
          </div>
        ) : (
          /* Standard Dark Backdrop for Welcome & Complete modes */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
        )}

        {/* ── MODE 1: WELCOME SCREEN BRIEFING ── */}
        {mode === "welcome" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`relative w-full max-w-xl mx-4 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border transition-colors ${
              isLight
                ? "bg-[#f4f8fc] border-sky-200/80 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                : "bg-[#09111e] border-cyan-500/25 text-white shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_40px_rgba(6,182,212,0.1)]"
            }`}
          >
            {/* Header / Badges */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                <Compass className="size-3.5" />
                ISRO SIH26176 · Dept. of Space
              </span>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                title="Skip Tutorial"
                aria-label="Skip Tutorial"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Title & Introduction */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
                Welcome to ORCA
              </h2>
              <p
                className={`text-sm sm:text-base mt-2 leading-relaxed ${
                  isLight ? "text-slate-600" : "text-slate-300"
                }`}
              >
                Your Maritime AI Copilot synthesizing live ISRO MOSDAC Earth Observation feeds, INCOIS wave forecasts, and PostGIS geofences into verified coastal advisories.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div
                className={`p-3.5 rounded-2xl border transition-colors ${
                  isLight
                    ? "bg-white/80 border-slate-200/70"
                    : "bg-white/[0.03] border-white/10"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5 text-cyan-600 dark:text-cyan-400 font-semibold text-xs">
                  <Radio className="size-4" />
                  <span>MOSDAC & INCOIS Feeds</span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-snug">
                  Real-time SST, chlorophyll fronts, and wave height thresholds.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition-colors ${
                  isLight
                    ? "bg-white/80 border-slate-200/70"
                    : "bg-white/[0.03] border-white/10"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  <ShieldCheck className="size-4" />
                  <span>PostGIS Geofencing</span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-snug">
                  Audible buffer warnings for turtle sanctuaries & IMBL borders.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition-colors ${
                  isLight
                    ? "bg-white/80 border-slate-200/70"
                    : "bg-white/[0.03] border-white/10"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  <Zap className="size-4" />
                  <span>Bhasini Hands-Free Voice</span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-snug">
                  Multi-dialect bridge assistant in Hindi, Bengali, Tamil & Marathi.
                </p>
              </div>

              <div
                className={`p-3.5 rounded-2xl border transition-colors ${
                  isLight
                    ? "bg-white/80 border-slate-200/70"
                    : "bg-white/[0.03] border-white/10"
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                  <Sparkles className="size-4" />
                  <span>5-Agent Reasoner</span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-snug">
                  Zero-hallucination verification trace grounded in numerical telemetry.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={handleDismiss}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center ${
                  isLight
                    ? "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Skip Tutorial
              </button>

              <button
                onClick={handleStartTour}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95"
              >
                <span>Start Guided Tour</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── MODE 2: INTERACTIVE STEP-BY-STEP TOOLTIP ── */}
        {mode === "tour" && currentStep && (
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            style={(() => {
              if (!targetRect) {
                return {
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  maxWidth: "460px",
                  width: "calc(100% - 32px)",
                };
              }

              const pos = currentStep.preferredPosition || "bottom";
              const screenWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
              const screenHeight = typeof window !== "undefined" ? window.innerHeight : 800;

              if (screenWidth < 640) {
                return {
                  position: "fixed",
                  bottom: "24px",
                  left: "16px",
                  right: "16px",
                  maxWidth: "calc(100% - 32px)",
                };
              }

              if (pos === "top") {
                const top = Math.max(20, targetRect.top - 240);
                const left = Math.min(
                  screenWidth - 440,
                  Math.max(20, targetRect.left + targetRect.width / 2 - 210)
                );
                return { position: "fixed", top: `${top}px`, left: `${left}px`, width: "420px" };
              }

              if (pos === "bottom") {
                const top = Math.min(screenHeight - 250, targetRect.bottom + 16);
                const left = Math.min(
                  screenWidth - 440,
                  Math.max(20, targetRect.left + targetRect.width / 2 - 210)
                );
                return { position: "fixed", top: `${top}px`, left: `${left}px`, width: "420px" };
              }

              if (pos === "right") {
                const top = Math.max(40, targetRect.top);
                const left = Math.min(screenWidth - 440, targetRect.right + 20);
                return { position: "fixed", top: `${top}px`, left: `${left}px`, width: "400px" };
              }

              return {
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "420px",
              };
            })()}
            className={`z-20 rounded-2xl p-5 shadow-2xl border transition-all ${
              isLight
                ? "bg-white border-sky-200 text-slate-900 shadow-[0_15px_40px_rgba(0,0,0,0.18)]"
                : "bg-[#0b1424] border-cyan-500/40 text-white shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.2)]"
            }`}
          >
            {/* Step Header */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  {currentStep.badge}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                title="Skip Tutorial"
                aria-label="Skip Tutorial"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Title & Description */}
            <div className="mb-3">
              <h3 className="text-base font-bold font-sans tracking-tight flex items-center gap-2">
                <currentStep.icon className="size-4 text-cyan-500 shrink-0" />
                <span>{currentStep.title}</span>
              </h3>
              <p
                className={`text-xs mt-1.5 leading-relaxed ${
                  isLight ? "text-slate-600" : "text-slate-300"
                }`}
              >
                {currentStep.description}
              </p>
            </div>

            {/* Pro Tip Callout */}
            {currentStep.tip && (
              <div
                className={`p-2.5 rounded-xl text-[11px] mb-4 border ${
                  isLight
                    ? "bg-cyan-50/70 border-cyan-200/60 text-cyan-900"
                    : "bg-cyan-950/30 border-cyan-500/20 text-cyan-300"
                }`}
              >
                {currentStep.tip}
              </div>
            )}

            {/* Progress Dots & Buttons */}
            <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/10">
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`size-2 rounded-full transition-all ${
                      i === currentStepIndex
                        ? "w-4 bg-cyan-400"
                        : i < currentStepIndex
                        ? "bg-cyan-500/50"
                        : "bg-slate-400/30"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismiss}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isLight
                      ? "text-slate-400 hover:text-slate-700"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Skip
                </button>

                <button
                  onClick={handleBack}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    isLight
                      ? "hover:bg-slate-100 text-slate-700"
                      : "hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleNext}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:brightness-110 active:scale-95"
                >
                  <span>{currentStepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── MODE 3: COMPLETION CELEBRATION ── */}
        {mode === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            className={`relative w-full max-w-md mx-4 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border text-center transition-colors ${
              isLight
                ? "bg-[#f4f8fc] border-sky-200/80 text-slate-900"
                : "bg-[#09111e] border-cyan-500/25 text-white shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="size-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/30">
              <CheckCircle2 className="size-8 stroke-[2.5]" />
            </div>

            <h2 className="text-2xl font-bold font-serif tracking-tight">
              Mission Ready!
            </h2>
            <p
              className={`text-xs sm:text-sm mt-2 leading-relaxed ${
                isLight ? "text-slate-600" : "text-slate-300"
              }`}
            >
              You have completed the ORCA onboarding tour. You can replay this interactive walkthrough at any time from the Operator Profile & Settings menu.
            </p>

            <button
              onClick={handleDismiss}
              className="mt-6 w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95"
            >
              Launch Mission Control
            </button>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
