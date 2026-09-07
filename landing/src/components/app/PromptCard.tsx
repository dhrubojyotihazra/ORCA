"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/app-context";
import {
  Plus,
  Mic,
  MicOff,
  ArrowUp,
  AudioWaveform,
} from "lucide-react";

interface PromptCardProps {
  initialText?: string;
  onSend?: (text: string) => void;
  showHero?: boolean;
}

export function PromptCard({ initialText = "", onSend, showHero = true }: PromptCardProps) {
  const {
    theme,
    createNewChat,
    setIsVoiceActive,
    showToast,
  } = useApp();

  const isLight = theme === "light";
  const [prompt, setPrompt] = useState(initialText);
  const [isDictating, setIsDictating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dictationRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = (file.size / 1024).toFixed(1);
    showToast(`Attached dataset: ${file.name} (${sizeKb} KB) - Ready for multi-agent reasoning`, "success");
    setPrompt((prev) =>
      prev
        ? `${prev} [Attached file: ${file.name}]`
        : `Analyze uploaded ocean dataset "${file.name}" for navigational hazards: `
    );
    e.target.value = "";
  };

  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Update text when initialText changes
  useEffect(() => {
    if (initialText) {
      setPrompt(initialText);
      textareaRef.current?.focus();
    }
  }, [initialText]);

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

  const [greeting, setGreeting] = useState("Evening, Captain.");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Morning, Captain.");
    else if (hour < 17) setGreeting("Afternoon, Captain.");
    else setGreeting("Evening, Captain.");
  }, []);

  // ── Speech-to-Text: Dual Engine (MediaRecorder + Groq Whisper + WebSpeech) ──
  const toggleDictation = async () => {
    if (isDictating) {
      // Stop recording
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
                setPrompt((prev) => {
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

      // Concurrently run WebSpeech for live typing if supported
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-IN";

          const initialPrefix = prompt ? prompt.trim() + " " : "";

          recognition.onresult = (event: any) => {
            let current = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            if (current.trim()) {
              setPrompt(initialPrefix + current);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!prompt.trim()) return;
    if (isDictating && dictationRef.current) {
      try {
        dictationRef.current.stop();
      } catch {}
      setIsDictating(false);
    }

    if (onSend) {
      onSend(prompt.trim());
      setPrompt("");
    } else {
      createNewChat(prompt.trim());
    }
  };

  return (
    <div className="w-full max-w-[680px] mx-auto px-4">
      {/* ── Hero Greeting — single focal point ── */}
      {showHero && (
        <div className="text-center mb-8 flex flex-col items-center select-none">
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* Orca Logo */}
            <img
              src={isLight ? "/images/orca-logo-light.png" : "/images/orca-logo-dark-transparent.png"}
              alt="ORCA"
              className="size-8 object-contain shrink-0"
            />
            <h1
              className={`text-2xl sm:text-3xl font-serif tracking-tight ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              {greeting}
            </h1>
          </div>

          <p
            className={`text-xs sm:text-sm max-w-md ${
              isLight ? "text-slate-400" : "text-slate-500"
            } transition-colors`}
          >
            ISRO Earth Observation · INCOIS Wave Forecasts · Marine Geofences
          </p>
        </div>
      )}

      {/* ── Neomorphic Prompt Card ── */}
      <div
        className={`relative rounded-[24px] p-4 transition-all duration-300 ${
          isLight ? "neo-prompt-light" : "neo-prompt-dark"
        } ${isDictating ? "ring-2 ring-rose-500/50" : ""}`}
      >
        {/* Input Textarea */}
        <textarea
          ref={textareaRef}
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isTranscribing
              ? "Transcribing audio with Groq Whisper LPU..."
              : isDictating
              ? "Recording voice... Speak now (Click mic again when finished)..."
              : "Ask about fishing zones, weather safety, or sea conditions..."
          }
          className={`w-full bg-transparent resize-none outline-none text-sm sm:text-[15px] font-normal p-2 pb-1 ${
            isLight
              ? "text-slate-800 placeholder-slate-400 caret-cyan-600"
              : "text-slate-100 placeholder-slate-400 caret-cyan-400"
          }`}
        />

        {/* ── Bottom Controls ── */}
        <div className="flex items-center justify-between gap-2 pt-2 select-none">
          {/* Left: Attachment */}
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
                  ? "bg-[#eaf1f8] text-slate-500 hover:text-slate-700 shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(180,195,215,0.4)] border border-white/60 active:scale-95"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.5)] active:scale-95"
              }`}
              title="Attach marine data or voyage logs"
            >
              <Plus className="size-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Right: Dictation (Speech to Text) + Gemini Live Voice Mode + Send */}
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
                  ? "bg-[#eaf1f8] text-slate-500 hover:text-slate-900 shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(180,195,215,0.4)] border border-white/60 active:scale-95"
                  : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.5)] active:scale-95"
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
              className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                isLight
                  ? "bg-gradient-to-r from-teal-50 to-cyan-100 text-teal-800 border border-teal-200/80 shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(180,195,215,0.4)] hover:shadow-cyan-500/20"
                  : "bg-gradient-to-r from-teal-950/70 via-cyan-950/80 to-slate-900 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:border-cyan-400/50"
              }`}
              title="Enter ORCA Live (Gemini Live / Advanced Voice Mode)"
            >
              <AudioWaveform className="size-3.5 text-cyan-500 animate-pulse" />
              <span className="text-[11px] font-medium tracking-tight">Live</span>
            </button>

            {/* Send Button — only visible when there's text */}
            {prompt.trim() && (
              <button
                type="button"
                onClick={handleSend}
                className="size-8 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-lg hover:shadow-cyan-500/30 transition-all cursor-pointer active:scale-95"
                title="Send inquiry"
              >
                <ArrowUp className="size-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
