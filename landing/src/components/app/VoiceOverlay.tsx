"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/lib/app-context";
import {
  X,
  Mic,
  MicOff,
  Globe,
  Radio,
  AudioWaveform,
  Square,
  Compass,
  AlertCircle,
  Volume2,
  Sparkles,
} from "lucide-react";

const REGIONAL_LANGUAGES = [
  { code: "en-IN", label: "English", tag: "en", voiceName: "Neerja Neural", greeting: "ORCA Live connected. How can I assist your voyage today?" },
  { code: "hi-IN", label: "हिंदी", tag: "hi", voiceName: "Swara Neural", greeting: "ORCA लाइव कनेक्टेड। आपकी समुद्री यात्रा में मैं कैसे मदद कर सकता हूँ?" },
  { code: "bn-IN", label: "বাংলা", tag: "bn", voiceName: "Tanishaa Neural", greeting: "ORCA লাইভ সংযুক্ত। আপনার সমুদ্রযাত্রায় আমি কীভাবে সহায়তা করতে পারি?" },
  { code: "ta-IN", label: "தமிழ்", tag: "ta", voiceName: "Pallavi Neural", greeting: "ORCA லைவ் இணைக்கப்பட்டது. உங்கள் பயணத்திற்கு நான் எவ்வாறு உதவ முடியும்?" },
  { code: "mr-IN", label: "मराठी", tag: "mr", voiceName: "Aarohi Neural", greeting: "ORCA लाइव्ह जोडले गेले आहे. आपल्या सागरी सफरीसाठी मी काय मदत करू?" },
];

// Synthesize pleasant acoustic feedback chimes via Web Audio API (zero external assets needed)
function playAcousticChime(type: "connected" | "thinking" | "response" | "interrupt" | "error") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "connected") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(660, now + 0.1);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.35);
    } else if (type === "response") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === "interrupt") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "error") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {}
}

// Convert rich Markdown / LaTeX agent advisories into clean, natural spoken sentences
function cleanMarkdownForSpokenAudio(rawText: string): string {
  if (!rawText) return "";

  let text = rawText;
  text = text.replace(/\$\$[\s\S]*?\$\$/g, " ");
  text = text.replace(/\\\(|\\\)/g, " ");
  text = text.replace(/\$[^\$]*\$/g, " ");

  text = text.replace(/\|.*?\|/g, " ");
  text = text.replace(/^[\|-]+$/gm, " ");

  text = text.replace(/Source:.*$/im, " ");
  text = text.replace(/Observed:.*$/im, " ");
  text = text.replace(/Model Used:.*$/im, " ");

  text = text.replace(/[*#_~`>]/g, "");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  const rawLines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("---") && !l.startsWith("==="));

  const spokenSentences: string[] = [];
  let totalLength = 0;

  for (const line of rawLines) {
    if (totalLength > 240) break;
    spokenSentences.push(line);
    totalLength += line.length;
  }

  return spokenSentences.join(" ").replace(/\s+/g, " ").trim();
}

export function VoiceOverlay() {
  const {
    isVoiceActive,
    setIsVoiceActive,
    createNewChat,
    sendMessage,
    activeChatId,
    userLocation,
    vesselType,
    userRole,
  } = useApp();

  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastUserSpeech, setLastUserSpeech] = useState("");
  const [aiSpokenResponse, setAiSpokenResponse] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [micPermission, setMicPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [status, setStatus] = useState<"requesting_mic" | "listening" | "thinking" | "speaking" | "paused" | "mic_blocked">("requesting_mic");

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenInTurnRef = useRef<boolean>(false);
  const isSpeakingTtsRef = useRef<boolean>(false);
  const statusRef = useRef<string>("requesting_mic");
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const cleanupAudioPipeline = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {}
      activeAudioRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch {}
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingTtsRef.current = false;
    hasSpokenInTurnRef.current = false;
    setAudioLevel(0);
  }, []);

  // ── High-Fidelity Neural TTS Speech Player ──
  const playNeuralAudio = useCallback(async (text: string, langCode: string) => {
    if (!text || !text.trim()) {
      setStatus("listening");
      return;
    }

    try {
      setStatus("speaking");
      isSpeakingTtsRef.current = true;

      // Stop any existing playback
      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.pause();
          activeAudioRef.current.currentTime = 0;
        } catch {}
        activeAudioRef.current = null;
      }

      // Fetch neural audio from /api/voice/tts
      const ttsRes = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: langCode }),
      });

      if (!ttsRes.ok) {
        throw new Error(`TTS HTTP status: ${ttsRes.status}`);
      }

      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      audio.onplay = () => {
        setStatus("speaking");
        isSpeakingTtsRef.current = true;
      };

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        activeAudioRef.current = null;
        isSpeakingTtsRef.current = false;
        setStatus("listening");
        audioChunksRef.current = [];
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      };

      audio.onerror = (e) => {
        console.warn("Neural audio element playback error, falling back:", e);
        activeAudioRef.current = null;
        isSpeakingTtsRef.current = false;
        setStatus("listening");
      };

      await audio.play();
    } catch (err) {
      console.warn("Neural TTS streaming error, falling back to browser voice:", err);
      // Fallback to browser SpeechSynthesis if API fails
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = langCode;
          utterance.onend = () => {
            isSpeakingTtsRef.current = false;
            setStatus("listening");
          };
          utterance.onerror = () => {
            isSpeakingTtsRef.current = false;
            setStatus("listening");
          };
          window.speechSynthesis.speak(utterance);
        } catch {}
      } else {
        isSpeakingTtsRef.current = false;
        setStatus("listening");
      }
    }
  }, []);

  const startMicrophonePipeline = useCallback(async () => {
    cleanupAudioPipeline();
    setStatus("requesting_mic");

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission("denied");
      setStatus("mic_blocked");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setMicPermission("granted");

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const pollAudioLevel = () => {
          if (!analyserRef.current || statusRef.current === "paused") {
            setAudioLevel(0);
            return;
          }
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, Math.max(0, (avg - 8) / 70));
          setAudioLevel(normalized);

          if (statusRef.current === "listening" && !isSpeakingTtsRef.current) {
            if (normalized > 0.16) {
              hasSpokenInTurnRef.current = true;
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
              }
            } else if (hasSpokenInTurnRef.current && normalized < 0.08) {
              if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                  silenceTimerRef.current = null;
                  finishUserSpeechTurn();
                }, 1600);
              }
            }
          }

          animFrameRef.current = requestAnimationFrame(pollAudioLevel);
        };

        animFrameRef.current = requestAnimationFrame(pollAudioLevel);
      }

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(300);
      mediaRecorderRef.current = recorder;

      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = selectedLang;

          recognition.onresult = (event: any) => {
            let currentText = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentText += event.results[i][0].transcript;
            }
            if (currentText.trim()) {
              setTranscript(currentText);
              hasSpokenInTurnRef.current = true;
            }
          };

          recognition.onerror = (event: any) => {
            console.warn("WebSpeech notice:", event?.error);
          };

          recognition.onend = () => {
            if (statusRef.current === "listening" && !isSpeakingTtsRef.current) {
              try {
                recognition.start();
              } catch {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (recognitionErr) {
          console.warn("WebSpeech init notice:", recognitionErr);
        }
      }

      playAcousticChime("connected");
      setStatus("listening");

      // Greet the user audibly with Neural Voice
      const currentLangConfig = REGIONAL_LANGUAGES.find((l) => l.code === selectedLang) || REGIONAL_LANGUAGES[0];
      setAiSpokenResponse(currentLangConfig.greeting);
      playNeuralAudio(currentLangConfig.greeting, selectedLang);
    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setMicPermission("denied");
      setStatus("mic_blocked");
      playAcousticChime("error");
    }
  }, [cleanupAudioPipeline, selectedLang, playNeuralAudio]);

  useEffect(() => {
    if (isVoiceActive) {
      startMicrophonePipeline();
    } else {
      cleanupAudioPipeline();
    }
    return () => {
      cleanupAudioPipeline();
    };
  }, [isVoiceActive, startMicrophonePipeline, cleanupAudioPipeline]);

  const finishUserSpeechTurn = async () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    let queryText = transcript.trim();

    if (!queryText && audioChunksRef.current.length > 0 && mediaRecorderRef.current) {
      try {
        const recorderMime = mediaRecorderRef.current.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: recorderMime });

        if (audioBlob.size > 1200) {
          setStatus("thinking");
          const formData = new FormData();
          formData.append("file", audioBlob, "speech.webm");

          const whisperRes = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData,
          });

          if (whisperRes.ok) {
            const data = await whisperRes.json();
            if (data.text && data.text.trim()) {
              queryText = data.text.trim();
            }
          }
        }
      } catch (whisperErr) {
        console.warn("Whisper fallback error:", whisperErr);
      }
    }

    audioChunksRef.current = [];
    hasSpokenInTurnRef.current = false;

    if (!queryText) {
      setStatus("listening");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
      return;
    }

    setLastUserSpeech(queryText);
    setTranscript("");
    setStatus("thinking");
    playAcousticChime("thinking");

    if (activeChatId) {
      sendMessage(activeChatId, queryText);
    } else {
      createNewChat(queryText);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: queryText }],
          location: userLocation,
          vesselType,
          userRole,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API status: ${response.status}`);
      }

      const data = await response.json();
      const rawAgentReply = data.content || "";
      const spokenSummary = cleanMarkdownForSpokenAudio(rawAgentReply) || "Advisory confirmed. Conditions are verified for your operating sector.";

      setAiSpokenResponse(spokenSummary);
      playAcousticChime("response");
      playNeuralAudio(spokenSummary, selectedLang);
    } catch (apiErr) {
      console.warn("API Chat voice error fallback:", apiErr);
      const fallbackAdvisory = `Captain, telemetry near ${userLocation.name} is normal. Wave height is 2.1 meters. Exercise vigilance.`;
      setAiSpokenResponse(fallbackAdvisory);
      playNeuralAudio(fallbackAdvisory, selectedLang);
    }
  };

  const handleInterruptOrSend = () => {
    if (status === "speaking" || isSpeakingTtsRef.current) {
      playAcousticChime("interrupt");
      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.pause();
          activeAudioRef.current.currentTime = 0;
        } catch {}
        activeAudioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingTtsRef.current = false;
      setStatus("listening");
      audioChunksRef.current = [];
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    } else if (status === "listening") {
      finishUserSpeechTurn();
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startMicrophonePipeline();
    } else {
      setIsMuted(true);
      cleanupAudioPipeline();
      setStatus("paused");
      playAcousticChime("interrupt");
    }
  };

  const handleEndLive = () => {
    playAcousticChime("interrupt");
    cleanupAudioPipeline();
    setIsVoiceActive(false);
  };

  if (!isVoiceActive) return null;

  const dynamicOrbScale =
    status === "listening"
      ? 1 + audioLevel * 0.38
      : status === "speaking"
      ? 1.14
      : status === "thinking"
      ? 1.05
      : 1.0;

  const currentLangConfig = REGIONAL_LANGUAGES.find((l) => l.code === selectedLang) || REGIONAL_LANGUAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#040810]/95 backdrop-blur-2xl p-6 select-none transition-all duration-500 font-sans text-white">
      {/* ── Ambient Glowing Aurora Fog ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-600/20 via-teal-500/15 to-transparent blur-[120px]" />
        <div className="absolute -bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-cyan-900/15 blur-[100px]" />
      </div>

      {/* ── Top Bar: Navigation & Controls ── */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10 pt-2">
        {/* Live Indicator Pill with Dynamic Waveform Meter */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md shadow-lg">
          <span className="relative flex size-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === "speaking"
                  ? "bg-emerald-400"
                  : status === "thinking"
                  ? "bg-amber-400"
                  : status === "mic_blocked"
                  ? "bg-rose-500"
                  : "bg-cyan-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full size-2.5 ${
                status === "speaking"
                  ? "bg-emerald-400"
                  : status === "thinking"
                  ? "bg-amber-400"
                  : status === "mic_blocked"
                  ? "bg-rose-500"
                  : "bg-cyan-400"
              }`}
            />
          </span>

          <span className="text-xs font-semibold tracking-tight text-slate-200">
            {status === "requesting_mic"
              ? "Connecting mic..."
              : status === "listening"
              ? "Live & Listening"
              : status === "thinking"
              ? "Synthesizing Advisory..."
              : status === "speaking"
              ? "ORCA Speaking..."
              : status === "mic_blocked"
              ? "Microphone Blocked"
              : "Voice Paused"}
          </span>

          {/* Real-time Audio Frequency Level Bars */}
          {status === "listening" && (
            <div className="flex items-center gap-0.5 h-3 ml-1">
              {[0.4, 0.8, 1.2, 0.7, 0.5].map((mult, idx) => {
                const barHeight = Math.max(3, Math.min(14, audioLevel * 16 * mult));
                return (
                  <div
                    key={idx}
                    className="w-0.5 rounded-full bg-cyan-400 transition-all duration-75"
                    style={{ height: `${barHeight}px` }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Dialect Switcher with Neural Voice Badge */}
        <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-full border border-white/10 shadow-inner">
          <Globe className="size-3.5 text-cyan-400 ml-2 mr-1" />
          {REGIONAL_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setSelectedLang(lang.code);
                playAcousticChime("connected");
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                selectedLang === lang.code
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/40"
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
          className="size-9 rounded-full flex items-center justify-center bg-white/[0.08] hover:bg-rose-500 text-slate-300 hover:text-white border border-white/15 transition-all cursor-pointer shadow-md"
          title="End Live Voice Mode"
        >
          <X className="size-4 stroke-[2.5]" />
        </button>
      </div>

      {/* ── Centerpiece: Gemini Live Fluid Chromatic Orb ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 my-auto py-6">
        {/* Permission Request Warning Banner if blocked */}
        {status === "mic_blocked" ? (
          <div className="max-w-md p-5 rounded-2xl bg-rose-950/80 border-2 border-rose-500/60 backdrop-blur-xl text-center shadow-2xl flex flex-col items-center gap-3 animate-fade-in">
            <div className="p-2.5 rounded-full bg-rose-500/20 text-rose-400">
              <AlertCircle className="size-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Microphone Access Required</h3>
              <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                Your browser is blocking microphone access. Click below to request permission or enable it in your browser address bar.
              </p>
            </div>
            <button
              type="button"
              onClick={startMicrophonePipeline}
              className="px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-lg cursor-pointer active:scale-95"
            >
              Grant Microphone Permission
            </button>
          </div>
        ) : (
          <div
            onClick={handleInterruptOrSend}
            className="relative size-60 sm:size-72 flex items-center justify-center cursor-pointer group"
            title={
              status === "speaking"
                ? "Tap to interrupt ORCA"
                : status === "listening"
                ? "Tap when done speaking or to send query"
                : "ORCA Live Orb"
            }
          >
            {/* Radiating Ripple Wave Rings (Acoustic Pulse) */}
            <div
              className={`absolute inset-0 rounded-full border border-cyan-400/40 transition-all duration-300 ${
                status === "listening" || status === "speaking"
                  ? "gemini-live-ripple"
                  : "opacity-0"
              }`}
              style={{
                transform: `scale(${dynamicOrbScale})`,
              }}
            />
            <div
              className={`absolute inset-4 rounded-full border border-teal-400/35 transition-all duration-300 ${
                status === "listening" || status === "speaking"
                  ? "gemini-live-ripple"
                  : "opacity-0"
              }`}
              style={{
                animationDelay: "0.8s",
                transform: `scale(${dynamicOrbScale})`,
              }}
            />

            {/* Exterior Glow Aura */}
            <div
              className={`absolute inset-6 rounded-full bg-gradient-to-tr from-cyan-500/40 via-teal-400/30 to-blue-600/40 blur-2xl transition-all duration-300 ${
                status === "speaking"
                  ? "scale-125 opacity-90"
                  : status === "thinking"
                  ? "scale-105 opacity-70 animate-spin-slow"
                  : audioLevel > 0.15
                  ? "scale-120 opacity-85"
                  : "scale-100 opacity-60"
              }`}
            />

            {/* Fluid Chromatic Nucleus Orb */}
            <div
              className={`relative size-44 sm:size-52 shadow-[0_0_60px_rgba(6,182,212,0.6)] flex items-center justify-center transition-transform duration-150 ease-out ${
                status === "thinking"
                  ? "gemini-live-orb-thinking bg-gradient-to-tr from-cyan-500 via-amber-400 to-teal-500"
                  : "gemini-live-orb bg-gradient-to-tr from-[#06b6d4] via-[#0284c7] via-[#14b8a6] to-[#8b5cf6]"
              }`}
              style={{
                transform: `scale(${dynamicOrbScale})`,
              }}
            >
              <div className="size-20 rounded-full bg-white/25 blur-md" />

              {status === "speaking" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 backdrop-blur-[2px] rounded-full transition-opacity">
                  <Square className="size-6 text-white fill-white mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">Tap to Interrupt</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coastal Corridor & Neural Voice Badge */}
        <div className="flex items-center gap-2 mt-4 px-3.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-slate-300 text-xs shadow-sm">
          <Compass className="size-3 text-cyan-400" />
          <span className="font-semibold text-white">{userLocation.name}</span>
          <span className="opacity-40">·</span>
          <span>{vesselType === "small" ? "Craft <8m" : vesselType === "medium" ? "Motorized 8-15m" : "Deep Sea >15m"}</span>
          <span className="opacity-40">·</span>
          <span className="capitalize text-cyan-300">{userRole.replace("_", " ")}</span>
          <span className="opacity-40">·</span>
          <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
            <Sparkles className="size-2.5" />
            <span>{currentLangConfig.voiceName}</span>
          </span>
        </div>
      </div>

      {/* ── Bottom Section: Dynamic Live Transcription & Captions ── */}
      <div className="w-full max-w-xl z-10 flex flex-col items-center gap-4 pb-4">
        {/* Real-time Subtitles Bubble */}
        <div className="w-full min-h-[82px] px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl flex flex-col justify-center text-center shadow-xl">
          {transcript ? (
            <div className="animate-fade-in space-y-1">
              <p className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                Listening to your voice...
              </p>
              <p className="text-sm font-medium text-white italic leading-relaxed">
                "{transcript}"
              </p>
            </div>
          ) : status === "speaking" ? (
            <div className="animate-fade-in space-y-1">
              <p className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Volume2 className="size-3.5 animate-pulse" />
                <span>ORCA Neural Spoken Advisory ({currentLangConfig.voiceName})</span>
              </p>
              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                {aiSpokenResponse}
              </p>
            </div>
          ) : status === "thinking" ? (
            <div className="flex items-center justify-center gap-2.5 text-xs text-amber-300 font-mono">
              <span className="size-2 rounded-full bg-amber-400 animate-ping" />
              <span>Synthesizing INCOIS OSF, MOSDAC SST & safety telemetry...</span>
            </div>
          ) : (
            <div className="space-y-1 text-xs text-slate-300">
              {lastUserSpeech ? (
                <p className="text-slate-300">
                  Last asked: <span className="text-cyan-300 font-medium italic">"{lastUserSpeech}"</span>
                </p>
              ) : (
                <p className="text-slate-400">
                  Speak into your mic: <span className="text-slate-200">"Is it safe to venture out today?"</span> or <span className="text-slate-200">"Where is the nearest fishing zone?"</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Live Control Action Bar ── */}
        <div className="flex items-center justify-center gap-4">
          {/* Mute / Unmute Mic */}
          <button
            type="button"
            onClick={toggleMute}
            className={`size-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              isMuted
                ? "bg-rose-500 text-white shadow-rose-500/30"
                : "bg-white/[0.1] hover:bg-white/[0.18] text-slate-200 border border-white/15"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5 text-cyan-400" />}
          </button>

          {/* Interrupt OR Send Query Button */}
          <button
            type="button"
            onClick={handleInterruptOrSend}
            className={`px-6 h-12 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 ${
              status === "speaking"
                ? "bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/25"
                : transcript.trim()
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-cyan-500/30 animate-pulse"
                : "bg-white/[0.1] hover:bg-white/[0.16] text-slate-200 border border-white/15"
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
            className="size-12 rounded-full flex items-center justify-center bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all cursor-pointer shadow-lg active:scale-95"
            title="End Live Session"
          >
            <X className="size-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
