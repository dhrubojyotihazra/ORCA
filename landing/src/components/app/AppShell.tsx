"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { ArtifactsDrawer } from "./ArtifactsDrawer";
import { VoiceOverlay } from "./VoiceOverlay";
import { MarineMapModal } from "./MarineMapModal";
import { SettingsMenuModal } from "./SettingsMenuModal";
import { OnboardingTourModal } from "./OnboardingTourModal";
import { WebGLLiquid } from "@/components/ui/webgl-liquid";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { theme } = useApp();
  const pathname = usePathname();
  const isLight = theme === "light";
  const isChatPage = pathname?.startsWith("/chat/");

  return (
    <div
      className={`min-h-[100dvh] w-full flex overflow-hidden relative transition-colors duration-500 font-sans ${
        isLight
          ? "bg-[#edf3f8] text-slate-900"
          : "bg-[#060b13] text-white"
      }`}
    >
      {/* ── Ambient Background Decor ── */}
      {isLight ? (
        /* Light Mode: Soft pale azure ambient organic curves */
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-sky-200/45 to-teal-100/30 blur-3xl" />
          <div className="absolute -bottom-[25%] -right-[5%] w-[700px] h-[700px] rounded-full bg-gradient-to-tl from-sky-200/50 via-cyan-100/40 to-transparent blur-3xl" />
          <div className="absolute top-[40%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-100/30 blur-3xl" />
        </div>
      ) : (
        /* Dark Mode: Abyss curves with glowing neon cyan/teal rims (as in user's mockup) */
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Subtle star / void gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080e18] via-[#050912] to-[#02050a]" />

          {/* Glowing teal curved arc / orb on the right side */}
          <div className="absolute top-[15%] -right-[180px] w-[580px] h-[580px] rounded-full border border-cyan-400/25 bg-cyan-950/20 shadow-[0_0_80px_rgba(6,182,212,0.15)] blur-[1px]" />
          
          {/* Bottom right glowing arc */}
          <div className="absolute -bottom-[120px] -right-[80px] w-[640px] h-[640px] rounded-full border-2 border-cyan-500/20 bg-gradient-to-tl from-teal-950/40 via-cyan-950/20 to-transparent shadow-[0_0_100px_rgba(20,184,166,0.2)] blur-[2px]" />

          {/* Subtle cyan ambient fog */}
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-900/10 blur-[90px]" />
        </div>
      )}

      {/* ── Left Floating Sidebar ── */}
      <AppSidebar />

      {/* ── Main Workspace Area ── */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden z-10 min-w-0 relative">
        {/* ── Full-Bleed Seamless Ambient WebGL Liquid Backdrop ── */}
        <div
          className={`pointer-events-none absolute inset-0 z-0 overflow-hidden select-none transition-opacity duration-300 ${
            isLight ? "opacity-35" : "opacity-20"
          }`}
        >
          <WebGLLiquid
            title=""
            subtitle=""
            description=""
            colorDeep={isLight ? "#93c5fd" : "#020712"}
            colorMid={isLight ? "#38bdf8" : "#0e3868"}
            colorHighlight={isLight ? "#0284c7" : "#22d3ee"}
            speed={0.6}
            flowStrength={0.7}
            grain={0.02}
            contrast={isLight ? 1.25 : 1.05}
            opacity={isLight ? 0.55 : 0.35}
            disableOverlays={true}
            className="!min-h-0 !h-full !w-full !bg-transparent"
          />
        </div>

        {!isChatPage && <AppHeader />}
        <main className="flex-1 flex flex-col overflow-hidden relative z-10">
          {children}
        </main>
      </div>

      {/* ── Artifacts Slide-out Drawer ── */}
      <ArtifactsDrawer />

      {/* ── Voice Mode Interactive Overlay ── */}
      <VoiceOverlay />

      {/* ── Interactive Geospatial Marine Map ── */}
      <MarineMapModal />

      {/* ── Context-Aware Profile & Settings Sheet ── */}
      <SettingsMenuModal />

      {/* ── Interactive Onboarding Screen & Tooltip Tour ── */}
      <OnboardingTourModal />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#060b13] flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  return <AppShellInner>{children}</AppShellInner>;
}
