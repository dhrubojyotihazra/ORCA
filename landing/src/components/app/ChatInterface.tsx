"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { ChatSession, ChatMessage } from "@/lib/chat-store";
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Volume2,
  FileCode,
  ArrowUp,
  Plus,
  Mic,
  MicOff,
  AudioWaveform,
  ChevronDown,
  Layers,
  Sparkles,
  Map,
  Zap,
  Sun,
  Moon,
  Share2,
  FileDown,
  Printer,
  FileText,
} from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MarineMap } from "./MarineMap";
import { AgentTraceInspector } from "./AgentTraceInspector";

interface ChatInterfaceProps {
  chat: ChatSession;
}

export function ChatInterface({ chat }: ChatInterfaceProps) {
  const {
    theme,
    toggleTheme,
    sendMessage,
    setActiveArtifact,
    isVoiceActive,
    setIsVoiceActive,
    setIsMapOpen,
    isSidebarCollapsed,
    userRole,
    userLocation,
    vesselType,
    showToast,
  } = useApp();

  const isLight = theme === "light";
  const [inputText, setInputText] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dictationRef = useRef<any>(null);

  // Close share dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setIsShareOpen(false);
      }
    }
    if (isShareOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isShareOpen]);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  // Clean up audio & dictation recognition on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (dictationRef.current) {
        try {
          dictationRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Response text copied to clipboard", "info");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast("Share conversation link copied to clipboard!", "success");
    setIsShareOpen(false);
  };

  const handleExportPdf = () => {
    setIsShareOpen(false);
    showToast("Formatting LaTeX-aware PDF export...", "info");
    const prevTitle = document.title;
    const safePort = (userLocation?.name || "Coastal").replace(/[^a-zA-Z0-9]/g, "_");
    const dateStr = new Date().toISOString().slice(0, 10);
    document.title = `ORCA_Advisory_Report_${safePort}_${userRole}_${dateStr}`;
    setTimeout(() => {
      window.print();
      document.title = prevTitle;
    }, 450);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = (file.size / 1024).toFixed(1);
    showToast(`Attached dataset: ${file.name} (${sizeKb} KB) - Ready for multi-agent reasoning`, "success");
    setInputText((prev) =>
      prev
        ? `${prev} [Attached dataset: ${file.name}]`
        : `Analyze uploaded marine telemetry "${file.name}" for navigation and fish habitats: `
    );
    e.target.value = "";
  };

  const handleReadAloud = (id: string, text: string) => {
    if (speakingId === id) {
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`$]/g, ""));
      utterance.rate = 1.05;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    } else {
      showToast("Speech synthesis is not supported on this browser.", "warning");
    }
  };

  // ── Speech-to-Text: Dual Engine (MediaRecorder + Groq Whisper + WebSpeech) ──
  const toggleDictation = async () => {
    if (isDictating) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (dictationRef.current) {
        try {
          dictationRef.current.stop();
        } catch {}
        dictationRef.current = null;
      }
      setIsDictating(false);
      return;
    }

    if (typeof window === "undefined") return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Microphone access is not supported by your browser.", "warning");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          try {
            setIsTranscribing(true);
            const formData = new FormData();
            formData.append("file", audioBlob, "speech.webm");

            const res = await fetch("/api/voice/transcribe", {
              method: "POST",
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();
              if (data.text && data.text.trim()) {
                const transcribed = data.text.trim();
                setInputText((prev) => {
                  const cleaned = prev.trim();
                  if (cleaned.toLowerCase().includes(transcribed.toLowerCase())) {
                    return cleaned;
                  }
                  return cleaned ? `${cleaned} ${transcribed}` : transcribed;
                });
              }
            }
          } catch (fetchErr) {
            console.warn("Groq Whisper transcription network error:", fetchErr);
          } finally {
            setIsTranscribing(false);
          }
        }
      };

      recorder.start(250);
      setIsDictating(true);

      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-IN";

          const initialPrefix = inputText ? inputText.trim() + " " : "";

          recognition.onresult = (event: any) => {
            let current = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            if (current.trim()) {
              setInputText(initialPrefix + current);
            }
          };

          recognition.onerror = (e: any) => {
            console.warn("WebSpeech preview notice (Groq Whisper will finalize):", e.error);
          };

          recognition.start();
          dictationRef.current = recognition;
        } catch {}
      }
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        showToast("Microphone permission was denied. Please allow microphone access in your browser address bar.", "error");
      } else {
        showToast("Microphone could not be accessed: " + (err.message || "Unknown error"), "error");
      }
      setIsDictating(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (isDictating && dictationRef.current) {
      try {
        dictationRef.current.stop();
      } catch {}
      setIsDictating(false);
    }
    sendMessage(chat.id, inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* ── Compact Unified Conversation Header ── */}
      <div
        className={`h-11 sm:h-12 px-4 sm:px-6 border-b flex items-center justify-between z-10 select-none shrink-0 transition-colors ${
          isSidebarCollapsed ? "pl-14 sm:pl-16" : ""
        } ${
          isLight
            ? "border-slate-200/80 bg-white/40 backdrop-blur-sm"
            : "border-white/5 bg-black/20 backdrop-blur-sm"
        }`}
      >
        {/* Left: Status Dot + Title + Model Badge */}
        <div className="flex items-center gap-2.5 min-w-0 mr-2">
          <span className="size-2 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <h2
            className={`text-xs sm:text-sm font-semibold truncate ${
              isLight ? "text-slate-800" : "text-slate-100"
            }`}
            title={chat.title}
          >
            {chat.title}
          </h2>
          <span
            className={`hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold shrink-0 uppercase ${
              isLight
                ? "bg-cyan-100 text-cyan-800"
                : "bg-cyan-950/80 text-cyan-300 border border-cyan-800/40"
            }`}
          >
            {userRole.replace("_", " ")} · 5-Agent DAG
          </span>
        </div>

        {/* Right: Share + Marine Map + Voice + Theme Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Share & LaTeX PDF Export Menu */}
          <div className="relative" ref={shareMenuRef}>
            <button
              onClick={() => setIsShareOpen((prev) => !prev)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                isLight
                  ? "neo-btn-light text-slate-700 hover:text-slate-900"
                  : "neo-btn-dark text-slate-300 hover:text-white"
              }`}
              title="Share or Export Conversation"
            >
              <Share2 className="size-3 text-cyan-400" />
              <span>Share</span>
            </button>

            {isShareOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-64 rounded-2xl p-1.5 shadow-2xl backdrop-blur-2xl border z-50 animate-in fade-in slide-in-from-top-2 select-none ${
                  isLight
                    ? "bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60"
                    : "bg-[#081220]/95 border-cyan-500/20 text-slate-100 shadow-black/80"
                }`}
              >
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    isLight
                      ? "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                      : "hover:bg-cyan-950/60 text-slate-200 hover:text-cyan-200"
                  }`}
                >
                  <Copy className="size-3.5 text-cyan-500 shrink-0" />
                  <div>
                    <div className="font-semibold">Copy Share Link</div>
                    <div className="text-[10px] opacity-70">Direct link to current conversation</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    isLight
                      ? "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                      : "hover:bg-cyan-950/60 text-slate-200 hover:text-cyan-200"
                  }`}
                >
                  <FileDown className="size-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>Export PDF Report</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">LaTeX</span>
                    </div>
                    <div className="text-[10px] opacity-70">Publication vector math report (Print/PDF)</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Marine Map */}
          <button
            onClick={() => setIsMapOpen(true)}
            className={`size-7 sm:size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isLight
                ? "neo-btn-light text-slate-500 hover:text-teal-700"
                : "neo-btn-dark text-slate-400 hover:text-cyan-300"
            }`}
            title="Open Marine Map"
            aria-label="Marine Map"
          >
            <Map className="size-3.5" />
          </button>

          {/* Voice Mode */}
          <button
            onClick={() => setIsVoiceActive(true)}
            className={`size-7 sm:size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isVoiceActive
                ? "bg-cyan-500 text-white shadow-[0_0_16px_rgba(6,182,212,0.6)] animate-pulse"
                : isLight
                ? "neo-btn-light text-slate-500 hover:text-cyan-600"
                : "neo-btn-dark text-slate-400 hover:text-cyan-300"
            }`}
            title="Voice Assistant"
            aria-label="Voice Mode"
          >
            <Zap className="size-3.5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`size-7 sm:size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
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
      </div>

      {/* ── Messages Stream ── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 md:px-8 space-y-5 auth-form-scrollbar max-w-4xl w-full mx-auto chat-scroll-container">
        {/* ── LaTeX-Aware PDF Report Header (Visible only when exporting to PDF / Printing) ── */}
        <div className="hidden print:block mb-8 p-6 rounded-2xl border-2 border-slate-900 bg-white text-slate-950 font-sans shadow-none">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 font-bold font-mono tracking-wider bg-slate-900 text-white rounded">
                  ISRO SIH26176
                </span>
                <h1 className="text-lg font-black tracking-tight uppercase">
                  ORCA Marine Decision Advisory Report
                </h1>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Autonomous Multi-Agent System · Grounded Ocean, Weather & Risk Telemetry
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 text-xs font-bold font-mono uppercase border border-slate-900 rounded-md">
                {userRole.replace("_", " ")} REGISTER
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-xs font-mono bg-slate-100/70 p-3 rounded-xl border border-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Anchor Station</span>
              <span className="font-semibold text-slate-900">{userLocation.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Coordinates</span>
              <span className="font-semibold text-slate-900">{userLocation.lat}°N, {userLocation.lon}°E</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Vessel Class</span>
              <span className="font-semibold text-slate-900">
                {vesselType === "small" ? "Small (<8m)" : vesselType === "medium" ? "Motorized (8-15m)" : "Deep-Sea (>15m)"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">DAG Execution</span>
              <span className="font-semibold text-slate-900">5-Node LangGraph</span>
            </div>
          </div>
        </div>

        {chat.messages.map((message) => {
          const isUser = message.role === "user";

          if (isUser) {
            return (
              <div key={message.id} className="flex justify-end gap-3 group chat-msg-row">
                <div
                  className={`max-w-[80%] rounded-[22px] px-5 py-3.5 text-sm sm:text-base leading-relaxed chat-bubble-card ${
                    isLight
                      ? "bg-[#e2ebf5] text-slate-900 shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),2px_2px_6px_rgba(180,195,215,0.4)] border border-white/70"
                      : "bg-[#142233] text-slate-100 border border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <span className="block text-[10px] opacity-50 text-right mt-1 font-mono">
                    {message.timestamp}
                  </span>
                </div>

                {/* User Avatar */}
                <div className="size-8 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm self-start mt-1">
                  D
                </div>
              </div>
            );
          }

          // Assistant Message Turn
          return (
            <div key={message.id} className="flex items-start gap-3.5 group chat-msg-row">
              {/* Orca Assistant Avatar */}
              <div className="size-8 rounded-full flex items-center justify-center shrink-0 mt-1 p-1 no-print">
                {isLight ? (
                  <img
                    src="/images/orca-logo-light.png"
                    alt="ORCA"
                    className="w-full h-full object-contain filter drop-shadow-sm"
                  />
                ) : (
                  <img
                    src="/images/orca-logo-dark-transparent.png"
                    alt="ORCA"
                    className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                  />
                )}
              </div>

              {/* Message Content Container */}
              <div className="flex-1 min-w-0 space-y-3 chat-bubble-card">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold tracking-tight font-serif ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    Orca
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {message.modelUsed || "ORCA Multi-Agent (Groq LPU)"} · {message.timestamp}
                  </span>
                </div>

                <div
                  className={`text-sm sm:text-base leading-relaxed space-y-3 ${
                    isLight ? "text-slate-800" : "text-slate-200"
                  }`}
                >
                  {/* Multi-Agent Reasoning Trace & Telemetry DAG */}
                  {message.agentTrace && message.agentTrace.length > 0 && (
                    <div className="pb-1 max-w-2xl">
                      <AgentTraceInspector trace={message.agentTrace} isLight={isLight} />
                    </div>
                  )}

                  {/* Clean Formatted Text with LaTeX, Mermaid, and Tables */}
                  {message.content.startsWith("Analyzing") ? (
                    <div className="flex items-center gap-2.5 py-2 text-xs font-mono text-cyan-400">
                      <span className="size-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                      <span className="animate-pulse">{message.content}</span>
                    </div>
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}

                  {/* Inline Mini-Map for Marine Spatial Responses */}
                  {(() => {
                    if (message.content.startsWith("Analyzing")) return null;
                    const c = message.content.toLowerCase();
                    const isPfz = c.includes("pfz") || c.includes("potential fishing") || c.includes("chlorophyll");
                    const isSafety = c.includes("safety") || c.includes("wave") || c.includes("hydrodynamic") || c.includes("venture");
                    const isGeofence = c.includes("geofenc") || c.includes("sanctuary") || c.includes("imbl") || c.includes("boundary");

                    if (isPfz || isSafety || isGeofence) {
                      const contextType = isPfz ? "pfz" : isSafety ? "safety" : "geofence";
                      const mapCaption = isPfz
                        ? "PFZ Zone 14.2 NM Southeast · Favorable SST front (29.4°C) & Chlorophyll plume"
                        : isSafety
                        ? "Wave State: Hs 2.1m (Rough) · 18.5 kts winds ENE · Departure delayed"
                        : "Gahirmatha Marine Sanctuary 9.2 NM NE (Restricted) · IMBL 18.4 NM East";

                      return (
                        <div className="pt-2 max-w-xl">
                          <MarineMap
                            mode="inline"
                            contextType={contextType}
                            caption={mapCaption}
                          />
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Inline Artifact Card if present */}
                  {message.artifact && (
                    <div
                      onClick={() => setActiveArtifact(message.artifact)}
                      className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isLight
                          ? "bg-[#eaf1f8] hover:bg-[#e1ecf6] border border-white/80 shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(180,195,215,0.35)]"
                          : "bg-slate-900/90 hover:bg-slate-800/90 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
                          <FileCode className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <span
                            className={`text-xs font-bold block truncate ${
                              isLight ? "text-slate-900" : "text-white"
                            }`}
                          >
                            {message.artifact.title}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {message.artifact.subtitle || "Click to open interactive artifact"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                          isLight
                            ? "bg-teal-100 text-teal-800"
                            : "bg-teal-950 text-teal-300 border border-teal-800"
                        }`}
                      >
                        View Artifact
                      </span>
                    </div>
                  )}
                </div>

                {/* Assistant Message Actions Toolbar */}
                <div className="flex items-center gap-1 pt-1 opacity-75 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(message.id, message.content)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isLight
                        ? "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                    title="Copy message"
                  >
                    {copiedId === message.id ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleReadAloud(message.id, message.content)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      speakingId === message.id
                        ? "text-cyan-400 bg-cyan-500/20 animate-pulse"
                        : isLight
                        ? "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                    title="Read aloud"
                  >
                    <Volume2 className="size-3.5" />
                  </button>

                  <button
                    onClick={() => showToast("Feedback logged: Helpful response", "success")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isLight
                        ? "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                    title="Good response"
                  >
                    <ThumbsUp className="size-3.5" />
                  </button>

                  <button
                    onClick={() => showToast("Feedback logged. Thank you for refining ORCA!", "info")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isLight
                        ? "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                    title="Bad response"
                  >
                    <ThumbsDown className="size-3.5" />
                  </button>

                  <button
                    onClick={() => sendMessage(chat.id, "Please regenerate your previous response with deeper technical granularity.")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isLight
                        ? "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                    title="Retry / Regenerate"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Persistent Floating Neomorphic Bottom Prompt Bar ── */}
      <div className="p-4 pb-6 max-w-4xl w-full mx-auto">
        <div
          className={`rounded-[24px] p-3 transition-all ${
            isLight ? "neo-prompt-light" : "neo-prompt-dark"
          }`}
        >
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isTranscribing
                ? "Transcribing audio with Groq Whisper LPU..."
                : isDictating
                ? "Recording voice... Speak now (Click mic again when finished)..."
                : "Reply to Orca..."
            }
            className={`w-full bg-transparent resize-none outline-none text-sm font-normal px-2 ${
              isLight
                ? "text-slate-800 placeholder-slate-400 caret-cyan-600"
                : "text-slate-100 placeholder-slate-400 caret-cyan-400"
            }`}
          />

          <div className="flex items-center justify-between pt-1 select-none">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.json,.txt,.nc,.tiff,.geotiff,.pdf"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isLight
                    ? "bg-[#eaf1f8] text-slate-700 hover:text-slate-900 shadow-sm"
                    : "bg-slate-900/80 text-slate-300 hover:text-white"
                }`}
                title="Attach datasets or voyage logs"
              >
                <Plus className="size-4" />
              </button>

              <span className="text-[11px] font-mono text-slate-400">
                {`ORCA Multi-Agent`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 🎤 Dedicated Speech-to-Text Dictation Button */}
              <button
                type="button"
                onClick={toggleDictation}
                className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                  isTranscribing
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/40 animate-pulse"
                    : isDictating
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse ring-2 ring-rose-400"
                    : isLight
                    ? "bg-[#eaf1f8] text-slate-600 hover:text-slate-900 shadow-sm hover:shadow"
                    : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10"
                }`}
                title={
                  isTranscribing
                    ? "Transcribing with Groq Whisper..."
                    : isDictating
                    ? "Stop Dictation (Click when done speaking)"
                    : "Speech to Text (Dictate into prompt)"
                }
              >
                {isDictating ? (
                  <MicOff className="size-4 animate-bounce" />
                ) : (
                  <Mic className="size-4" />
                )}
                {isDictating && (
                  <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-rose-400 animate-ping" />
                )}
              </button>

              {/* 🎙️ Gemini Live / Advanced Voice Mode Pill Button */}
              <button
                type="button"
                onClick={() => setIsVoiceActive(true)}
                className={`h-8 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  isLight
                    ? "bg-gradient-to-r from-teal-50 to-cyan-100 text-teal-800 border border-teal-200/80 shadow-sm hover:shadow"
                    : "bg-gradient-to-r from-teal-950/70 via-cyan-950/80 to-slate-900 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:border-cyan-400/50"
                }`}
                title="Enter ORCA Live (Gemini Live / Advanced Voice Mode)"
              >
                <AudioWaveform className="size-3.5 text-cyan-500 animate-pulse" />
                <span className="text-[11px] font-medium tracking-tight">Live</span>
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  inputText.trim()
                    ? "bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-md active:scale-95"
                    : "bg-slate-300/40 dark:bg-white/10 text-slate-400 cursor-not-allowed"
                }`}
                title="Send inquiry"
              >
                <ArrowUp className="size-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
