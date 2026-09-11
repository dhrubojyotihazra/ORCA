"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Play, Pause, Volume2, VolumeX, RotateCcw, ArrowLeft, Download, Maximize } from "lucide-react";

export default function FrameShowcasePage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [wallpaper, setWallpaper] = useState<"oceanic" | "cosmic" | "minimal">("oceanic");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const bgStyles = {
    oceanic: "bg-gradient-to-br from-[#020b14] via-[#041d2f] to-[#01111d]",
    cosmic: "bg-gradient-to-br from-[#0b0f19] via-[#111827] to-[#030712]",
    minimal: "bg-[#090d16]",
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 transition-colors duration-700 relative overflow-hidden ${bgStyles[wallpaper]}`}>
      {/* Oceanic Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top Bar Nav */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-4 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to ORCA Landing
        </Link>

        {/* Wallpaper Picker & Download */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 rounded-full px-3 py-1 text-xs font-mono text-slate-300">
            <span className="text-slate-400">Backdrop:</span>
            <button
              onClick={() => setWallpaper("oceanic")}
              className={`px-2 py-0.5 rounded-full ${wallpaper === "oceanic" ? "bg-teal-500/30 text-teal-300 border border-teal-500/40" : "hover:text-white"}`}
            >
              Oceanic
            </button>
            <button
              onClick={() => setWallpaper("cosmic")}
              className={`px-2 py-0.5 rounded-full ${wallpaper === "cosmic" ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40" : "hover:text-white"}`}
            >
              Cosmic
            </button>
            <button
              onClick={() => setWallpaper("minimal")}
              className={`px-2 py-0.5 rounded-full ${wallpaper === "minimal" ? "bg-slate-700 text-white" : "hover:text-white"}`}
            >
              Minimal
            </button>
          </div>

          <a
            href="/orca_demo_framed.mp4"
            download="orca_demo_framed.mp4"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-300 text-xs font-mono transition-all shadow-lg"
          >
            <Download className="size-3.5" /> Download Framed MP4
          </a>
        </div>
      </div>

      {/* ── macOS / MacBook Floating Window Mockup Frame ── */}
      <div className="relative w-full max-w-6xl rounded-2xl border border-teal-500/30 bg-[#0d1420] shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_40px_rgba(20,184,166,0.15)] overflow-hidden transition-all duration-500">
        
        {/* macOS Titlebar */}
        <div className="h-10 bg-[#111b2b] border-b border-slate-700/60 px-4 flex items-center justify-between select-none">
          {/* Traffic Light Buttons */}
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-[#ff5f57] border border-[#e0443e] shadow-sm" />
            <span className="size-3 rounded-full bg-[#febc2e] border border-[#df9e1a] shadow-sm" />
            <span className="size-3 rounded-full bg-[#28c840] border border-[#24b236] shadow-sm" />
          </div>

          {/* Window Title with Lock Icon */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 tracking-wider">
            <span className="size-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>ORCA — Mission Control (localhost:3000)</span>
          </div>

          {/* Dummy Right Controls / Spacer */}
          <div className="w-12 text-right text-[10px] font-mono text-slate-500">
            1080p HD
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative aspect-[16/9] w-full bg-black">
          <video
            ref={videoRef}
            src="/demo-preview.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Floating Player Controls Bar on Hover */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-white shadow-2xl opacity-90 hover:opacity-100 transition-opacity">
            <button
              onClick={togglePlay}
              className="p-1 hover:text-teal-300 transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
            <button
              onClick={restartVideo}
              className="p-1 hover:text-teal-300 transition-colors"
              title="Restart"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              onClick={toggleMute}
              className="p-1 hover:text-teal-300 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <span className="text-[11px] font-mono text-teal-300">ORCA Multi-Agent Walkthrough</span>
          </div>
        </div>
      </div>

      {/* Frame Dimensions Caption */}
      <div className="mt-4 text-center text-xs font-mono text-slate-500">
        macOS Framed Composition (1600×940) • 16:9 Inner Screen Ratio • Screen Studio / Recordly Style
      </div>
    </div>
  );
}
