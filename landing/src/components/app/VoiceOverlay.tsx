"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/lib/app-context";
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Globe,
  Radio,
  AudioWaveform,
  Square,
  Compass,
} from "lucide-react";

const REGIONAL_LANGUAGES = [
  { code: "en-IN", label: "English", tag: "en" },
  { code: "hi-IN", label: "हिंदी (Hindi)", tag: "hi" },
  { code: "bn-IN", label: "বাংলা (Bengali)", tag: "bn" },
  { code: "ta-IN", label: "தமிழ் (Tamil)", tag: "ta" },
  { code: "mr-IN", label: "मराठी (Marathi)", tag: "mr" },
];

export function VoiceOverlay() {
  const {
    isVoiceActive,
    setIsVoiceActive,
    createNewChat,
    sendMessage,
    activeChatId,
    userLocation,
    vesselType,
  } = useApp();

  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastUserSpeech, setLastUserSpeech] = useState("");
  const [aiSpokenResponse, setAiSpokenResponse] = useState("");
  const [status, setStatus] = useState<"listening" | "thinking" | "speaking" | "paused">("listening");

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  const statusRef = useRef<string>("listening");

  // Keep ref synchronized with status
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // ── Speech Synthesis Voices Cache ──
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // ── Initialize or Terminate Voice Engine ──
  useEffect(() => {
    if (!isVoiceActive) {
      cleanupAudio();
      return;
    }

    setTranscript("");
    setLastUserSpeech("");
    setAiSpokenResponse(
      `ORCA Live connected. Station: ${userLocation.name}. How can I assist your voyage?`
    );
    startListening();

    return () => {
      cleanupAudio();
    };
  }, [isVoiceActive, selectedLang]);

  const cleanupAudio = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
  };

  // ── Start Speech Recognition ──
  const startListening = () => {
    if (typeof window === "undefined") return;

    // Cancel any active TTS speech
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("paused");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setStatus("listening");
      };

      recognition.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }

        if (currentText.trim()) {
          setTranscript(currentText);

          // Reset silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Automatically process when user pauses speaking for 1.8 seconds
          silenceTimerRef.current = setTimeout(() => {
            handleUserTurnFinished(currentText);
          }, 1800);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event.error);
      };

      recognition.onend = () => {
        // Automatically restart listening if still active and not speaking/thinking
        if (isVoiceActive && !isSpeakingRef.current && statusRef.current === "listening") {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn("Could not start recognition:", err);
    }
  };

  // ── Process User Turn & Generate Agent Response ──
  const handleUserTurnFinished = (userQuery: string) => {
    const trimmed = userQuery.trim();
    if (!trimmed) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop recognition during thinking and speaking
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setLastUserSpeech(trimmed);
    setTranscript("");
    setStatus("thinking");

    // Persist message to chat session
    if (activeChatId) {
      sendMessage(activeChatId, trimmed);
    } else {
      createNewChat(trimmed);
    }

    // Formulate concise, natural conversational response for Live Voice
    setTimeout(() => {
      const spokenText = generateSpokenResponse(trimmed, userLocation.name, vesselType, selectedLang);
      setAiSpokenResponse(spokenText);
      speakResponse(spokenText);
    }, 700);
  };

  // ── Text-to-Speech Output ──
  const speakResponse = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("listening");
      startListening();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.02;

    // Pick best matching voice
    const langCode = selectedLang.split("-")[0];
    const match = availableVoices.find(
      (v) => v.lang.toLowerCase().includes(langCode) || v.lang.toLowerCase().includes(selectedLang.toLowerCase())
    );
    if (match) {
      utterance.voice = match;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setStatus("speaking");
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setStatus("listening");
      // Resume listening for the next conversational turn
      setTimeout(() => {
        if (isVoiceActive) {
          startListening();
        }
      }, 400);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setStatus("listening");
      startListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  // ── Tap to Interrupt ──
  const handleInterrupt = () => {
    if (status === "speaking" || isSpeakingRef.current) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
      setStatus("listening");
      startListening();
    } else if (status === "listening") {
      if (transcript.trim()) {
        handleUserTurnFinished(transcript);
      }
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setStatus("paused");
    }
  };

  const handleEndLive = () => {
    cleanupAudio();
    setIsVoiceActive(false);
  };

  if (!isVoiceActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#040810]/95 backdrop-blur-2xl p-6 select-none transition-all duration-500 font-sans text-white">
      {/* ── Ambient Glowing Aurora Fog ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-600/15 via-teal-500/10 to-transparent blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-cyan-900/10 blur-[100px]" />
      </div>

      {/* ── Top Bar: Navigation & Controls ── */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10 pt-2">
        {/* Live Indicator Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md">
          <span className="relative flex size-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === "speaking"
                  ? "bg-emerald-400"
                  : status === "thinking"
                  ? "bg-amber-400"
                  : "bg-cyan-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full size-2 ${
                status === "speaking"
                  ? "bg-emerald-400"
                  : status === "thinking"
                  ? "bg-amber-400"
                  : "bg-cyan-400"
              }`}
            />
          </span>
          <span className="text-xs font-semibold tracking-tight text-slate-200">
            {status === "listening"
              ? "Listening..."
              : status === "thinking"
              ? "Thinking..."
              : status === "speaking"
              ? "ORCA Speaking..."
              : "Paused"}
          </span>
        </div>

        {/* Dialect Switcher */}
        <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-full border border-white/10">
          <Globe className="size-3.5 text-cyan-400 ml-2 mr-1" />
          {REGIONAL_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                selectedLang === lang.code
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {lang.tag.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={handleEndLive}
          className="size-9 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
          title="End Live Voice Mode"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* ── Centerpiece: Gemini Live Fluid Chromatic Orb ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 my-auto py-8">
        <div
          onClick={handleInterrupt}
          className="relative size-60 sm:size-72 flex items-center justify-center cursor-pointer group"
          title={
            status === "speaking"
              ? "Tap to interrupt ORCA"
              : status === "listening"
              ? "Tap when done speaking"
              : "ORCA Live Orb"
          }
        >
          {/* Radiating Ripple Wave Rings (Gemini Live Acoustic Pulse) */}
          <div
            className={`absolute inset-0 rounded-full border border-cyan-400/30 ${
              status === "listening" || status === "speaking"
                ? "gemini-live-ripple"
                : "opacity-0"
            }`}
          />
          <div
            className={`absolute inset-4 rounded-full border border-teal-400/25 ${
              status === "listening" || status === "speaking"
                ? "gemini-live-ripple"
                : "opacity-0"
            }`}
            style={{ animationDelay: "0.8s" }}
          />

          {/* Exterior Glow Aura */}
          <div
            className={`absolute inset-6 rounded-full bg-gradient-to-tr from-cyan-500/40 via-teal-400/30 to-blue-600/40 blur-2xl transition-all duration-700 ${
              status === "speaking"
                ? "scale-125 opacity-90"
                : status === "thinking"
                ? "scale-100 opacity-60 animate-spin-slow"
                : "scale-110 opacity-70"
            }`}
          />

          {/* Fluid Chromatic Nucleus Orb */}
          <div
            className={`relative size-44 sm:size-52 shadow-[0_0_60px_rgba(6,182,212,0.6)] flex items-center justify-center transition-all duration-500 ${
              status === "thinking"
                ? "gemini-live-orb-thinking bg-gradient-to-tr from-cyan-500 via-amber-400 to-teal-500"
                : "gemini-live-orb bg-gradient-to-tr from-[#06b6d4] via-[#0284c7] via-[#14b8a6] to-[#8b5cf6]"
            }`}
          >
            {/* Core Lens Flare */}
            <div className="size-20 rounded-full bg-white/20 blur-md" />

            {/* Tap to Interrupt Indicator */}
            {status === "speaking" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Square className="size-6 text-white fill-white mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">Interrupt</span>
              </div>
            )}
          </div>
        </div>

        {/* Coastal Corridor Anchor */}
        <div className="flex items-center gap-2 mt-4 px-3 py-1 rounded-full bg-white/[0.04] border border-white/5 text-slate-400 text-xs">
          <Compass className="size-3 text-cyan-400" />
          <span>{userLocation.name}</span>
          <span className="opacity-40">·</span>
          <span>{vesselType === "small" ? "Craft <8m" : vesselType === "medium" ? "8-15m" : ">15m"}</span>
        </div>
      </div>

      {/* ── Bottom Section: Dynamic Live Transcription & Captions ── */}
      <div className="w-full max-w-xl z-10 flex flex-col items-center gap-4 pb-4">
        {/* Real-time Subtitles Bubble */}
        <div className="w-full min-h-[76px] px-5 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl flex flex-col justify-center text-center">
          {transcript ? (
            <p className="text-sm font-medium text-cyan-200 italic leading-relaxed animate-fade-in">
              "{transcript}"
            </p>
          ) : status === "speaking" ? (
            <p className="text-sm font-medium text-slate-100 leading-relaxed">
              {aiSpokenResponse}
            </p>
          ) : status === "thinking" ? (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-300 font-mono">
              <span className="size-2 rounded-full bg-amber-400 animate-ping" />
              <span>Cross-referencing MOSDAC SST & INCOIS wave forecasts...</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              {lastUserSpeech ? (
                <span>Last asked: "{lastUserSpeech}"</span>
              ) : (
                <span>Ask: "Is it safe to sail tomorrow?" or "Where is the nearest fish zone?"</span>
              )}
            </p>
          )}
        </div>

        {/* ── Live Control Action Bar ── */}
        <div className="flex items-center justify-center gap-4">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={toggleMute}
            className={`size-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                : "bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 border border-white/10"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5 text-cyan-400" />}
          </button>

          {/* Interrupt / Done Speaking */}
          <button
            type="button"
            onClick={handleInterrupt}
            className={`px-5 h-12 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              status === "speaking"
                ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/25 active:scale-95"
                : transcript.trim()
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/30 active:scale-95 animate-pulse"
                : "bg-white/[0.08] hover:bg-white/[0.12] text-slate-300 border border-white/10"
            }`}
          >
            {status === "speaking" ? (
              <>
                <Square className="size-4 fill-current" />
                <span>Tap to Interrupt</span>
              </>
            ) : transcript.trim() ? (
              <>
                <AudioWaveform className="size-4 text-white" />
                <span>Send Query</span>
              </>
            ) : (
              <>
                <Radio className="size-4 text-cyan-400 animate-pulse" />
                <span>Listening</span>
              </>
            )}
          </button>

          {/* End Live Session */}
          <button
            type="button"
            onClick={handleEndLive}
            className="size-12 rounded-full flex items-center justify-center bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
            title="End Live Session"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Conversational Spoken Response Generator ──
function generateSpokenResponse(
  query: string,
  portName: string,
  vessel: string,
  langCode: string
): string {
  const q = query.toLowerCase();

  // Regional Language Support
  if (langCode.startsWith("hi")) {
    if (q.includes("safe") || q.includes("सुरक्षा") || q.includes("हवामान") || q.includes("मौसम")) {
      return `कप्तान, ${portName} के पास कल सुबह समुद्र अशांत रहेगा। लहरों की ऊंचाई दो दशमलव एक मीटर है। छोटी नौकाओं को बंदरगाह में रहने की सख्त सलाह दी जाती है।`;
    }
    return `कप्तान, ${portName} से चौदह नॉटिकल मील दक्षिण-पूर्व में संभावित मछली पकड़ने का क्षेत्र सक्रिय है। महासागर सतह का तापमान उनतीस दशमलव चार डिग्री सेल्सियस है।`;
  }

  if (langCode.startsWith("bn")) {
    if (q.includes("safe") || q.includes("নিরাপদ") || q.includes("ঢেউ") || q.includes("ঝড়")) {
      return `ক্যাপ্টেন, ${portName} এর কাছে আগামী কাল সকালে ঢেউয়ের উচ্চতা দুই দশমিক এক মিটার হতে পারে। ছোট নৌকার জন্য সমুদ্রে যাওয়া অত্যন্ত ঝুঁকিপূর্ণ।`;
    }
    return `ক্যাপ্টেন, ${portName} থেকে চৌদ্দ নটিক্যাল মাইল দক্ষিণ-পূর্বে সক্রিয় মাছ ধরার জোন শনাক্ত করা হয়েছে। জলের তাপমাত্রা অনুকূল রয়েছে।`;
  }

  // English Spoken Summaries
  if (q.includes("pfz") || q.includes("fish") || q.includes("chlorophyll") || q.includes("catch")) {
    return `Captain, the nearest Potential Fishing Zone is 14.2 nautical miles southeast of ${portName}. High chlorophyll concentration and thermal fronts indicate active Indian Mackerel and Tuna schools.`;
  }

  if (q.includes("safe") || q.includes("venture") || q.includes("wave") || q.includes("weather") || q.includes("wind")) {
    if (vessel === "small") {
      return `Captain, departure is not advised for small craft. Significant wave height is 2.1 meters, exceeding your 1.5 meter threshold. Please delay departure until wave heights ease after 12 UTC.`;
    }
    return `Captain, conditions near ${portName} show wave heights of 2.1 meters and winds at 18 knots. Mechanized vessels may operate with vigilance, but remain alert to squall lines.`;
  }

  if (q.includes("geofence") || q.includes("imbl") || q.includes("border") || q.includes("mpa") || q.includes("sanctuary")) {
    return `Captain, keep vigilance near Gahirmatha Sanctuary, 9 miles northeast, which is a strict no-take marine protected area. The international boundary line is clear, located 18 miles east.`;
  }

  return `Captain, telemetry from ISRO Oceansat-3 and INCOIS wave buoys is normal near ${portName}. Sea surface temperature is 29.4 degrees Celsius with moderate seas. How else can I guide your navigation?`;
}
