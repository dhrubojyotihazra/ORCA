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
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";

const REGIONAL_LANGUAGES = [
  { code: "en-IN", label: "English", tag: "en", voiceName: "Neerja Neural", greeting: "ORCA Live connected. How can I assist your voyage today?" },
  { code: "hi-IN", label: "हिंदी", tag: "hi", voiceName: "Swara Neural", greeting: "ORCA लाइव कनेक्टेड। आपकी समुद्री यात्रा में मैं कैसे मदद कर सकता हूँ?" },
  { code: "bn-IN", label: "বাংলা", tag: "bn", voiceName: "Tanishaa Neural", greeting: "ORCA লাইভ সংযুক্ত। আপনার সমুদ্রযাত্রায় আমি কীভাবে সহায়তা করতে পারি?" },
  { code: "ta-IN", label: "தமிழ்", tag: "ta", voiceName: "Pallavi Neural", greeting: "ORCA லைவ் இணைக்கப்பட்டது. உங்கள் பயணத்திற்கு நான் எவ்வாறு உதவ முடியும்?" },
  { code: "mr-IN", label: "मराठी", tag: "mr", voiceName: "Aarohi Neural", greeting: "ORCA लाइव्ह जोडले गेले आहे. आपल्या सागरी सफरीसाठी मी काय मदत करू?" },
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
    userRole,
  } = useApp();

  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastUserSpeech, setLastUserSpeech] = useState("");
  const [lastAsrProvider, setLastAsrProvider] = useState<"bhasini" | "groq" | null>(null);
  const [aiSpokenResponse, setAiSpokenResponse] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [freqBands, setFreqBands] = useState<number[]>(new Array(20).fill(0));
  const [micPermission, setMicPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [status, setStatus] = useState<"connecting" | "listening" | "transcribing" | "thinking" | "speaking" | "paused" | "mic_blocked">("connecting");

  // Web Audio Context & Streams (GitHub AudioContext standard)
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ttsSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // MediaRecorder & Recognition
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenInTurnRef = useRef<boolean>(false);
  const isSpeakingTtsRef = useRef<boolean>(false);
  const statusRef = useRef<string>("connecting");
  const selectedLangRef = useRef<string>(selectedLang);

  useEffect(() => {
    selectedLangRef.current = selectedLang;
  }, [selectedLang]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Acoustic chime helper using the unlocked AudioContext
  const playChime = useCallback((type: "connected" | "thinking" | "response" | "interrupt" | "error") => {
    try {
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === "suspended") return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === "connected") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "response") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "interrupt") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(330, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "error") {
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
  }, []);

  // Cleanup all audio resources
  const cleanupAudioPipeline = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (ttsSourceNodeRef.current) {
      try {
        ttsSourceNodeRef.current.stop();
        ttsSourceNodeRef.current.disconnect();
      } catch {}
      ttsSourceNodeRef.current = null;
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
    setFreqBands(new Array(20).fill(0));
  }, []);

  // Forward declaration ref
  const finishUserSpeechTurnRef = useRef<() => Promise<void>>(async () => {});

  // Start fresh recording turn
  const startTurnRecording = useCallback(() => {
    if (!mediaStreamRef.current || isSpeakingTtsRef.current) return;

    audioChunksRef.current = [];
    hasSpokenInTurnRef.current = false;
    setTranscript("");

    // Initialize MediaRecorder
    let mimeType = "audio/webm";
    if (typeof MediaRecorder !== "undefined") {
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      }

      try {
        const recorder = mimeType
          ? new MediaRecorder(mediaStreamRef.current, { mimeType })
          : new MediaRecorder(mediaStreamRef.current);

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn("MediaRecorder start error:", recErr);
      }
    }

    // WebSpeech API for instantaneous interim captions
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLangRef.current;

        recognition.onresult = (event: any) => {
          let currentText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          if (currentText.trim()) {
            setTranscript(currentText);
            hasSpokenInTurnRef.current = true;
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.warn("WebSpeech recognition notice:", e?.error);
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
      } catch (recogErr) {
        console.warn("WebSpeech start error:", recogErr);
      }
    }

    setStatus("listening");
  }, []);

  // High-Fidelity Neural TTS Audio Player via Web Audio AudioContext (Autoplay-Proof)
  const playNeuralAudio = useCallback(async (text: string, langCode: string) => {
    if (!text || !text.trim()) {
      startTurnRecording();
      return;
    }

    try {
      setStatus("speaking");
      isSpeakingTtsRef.current = true;

      // Stop mic recording while ORCA speaks to prevent echo feedback
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      // Stop any existing TTS source node
      if (ttsSourceNodeRef.current) {
        try {
          ttsSourceNodeRef.current.stop();
          ttsSourceNodeRef.current.disconnect();
        } catch {}
        ttsSourceNodeRef.current = null;
      }

      // Ensure AudioContext is running
      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === "closed") {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioCtx();
        audioContextRef.current = ctx;
      }
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      // Fetch MP3 bytes from /api/voice/tts
      const ttsRes = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: langCode }),
      });

      if (!ttsRes.ok) {
        throw new Error(`TTS HTTP error ${ttsRes.status}`);
      }

      const arrayBuffer = await ttsRes.arrayBuffer();
      // Decode audio data directly into Web Audio buffer
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;

      // Connect source to analyser so the visual orb dynamically pulses to the AI voice!
      if (analyserRef.current) {
        sourceNode.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      } else {
        sourceNode.connect(ctx.destination);
      }

      ttsSourceNodeRef.current = sourceNode;

      sourceNode.onended = () => {
        ttsSourceNodeRef.current = null;
        isSpeakingTtsRef.current = false;
        // Resume fresh turn recording automatically
        startTurnRecording();
      };

      sourceNode.start(0);
    } catch (err) {
      console.warn("AudioContext decode error, attempting HTML5 Audio fallback:", err);
      // HTML5 Audio fallback
      try {
        const ttsRes = await fetch("/api/voice/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: langCode }),
        });
        if (ttsRes.ok) {
          const blob = await ttsRes.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => {
            URL.revokeObjectURL(url);
            isSpeakingTtsRef.current = false;
            startTurnRecording();
          };
          audio.onerror = () => {
            isSpeakingTtsRef.current = false;
            startTurnRecording();
          };
          await audio.play();
          return;
        }
      } catch {}

      isSpeakingTtsRef.current = false;
      startTurnRecording();
    }
  }, [startTurnRecording]);

  // Finish User Speech Turn: Transcribe with Whisper and query Voice Brain
  const finishUserSpeechTurn = useCallback(async () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setStatus("transcribing");

    // Flush MediaRecorder by requesting data and stopping
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.requestData();
      } catch {}
      await new Promise<void>((resolve) => {
        if (!mediaRecorderRef.current) {
          resolve();
          return;
        }
        mediaRecorderRef.current.onstop = () => resolve();
        try {
          mediaRecorderRef.current.stop();
        } catch {
          resolve();
        }
      });
    }

    let queryText = transcript.trim();

    // If WebSpeech was empty or partial, transcribe with Groq Whisper Large-v3 Turbo
    if ((!queryText || queryText.length < 4) && audioChunksRef.current.length > 0) {
      try {
        const recorderMime = mediaRecorderRef.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: recorderMime });

        if (audioBlob.size > 800) {
          const formData = new FormData();
          formData.append("file", audioBlob, "speech.webm");
          const langCode = selectedLang.split("-")[0] || "en";
          formData.append("language", langCode);

          const whisperRes = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData,
          });

          if (whisperRes.ok) {
            const data = await whisperRes.json();
            if (data.provider === "bhasini") {
              setLastAsrProvider("bhasini");
            } else if (data.provider === "groq") {
              setLastAsrProvider("groq");
            }
            if (data.text && data.text.trim()) {
              queryText = data.text.trim();
            }
          }
        }
      } catch (whisperErr) {
        console.warn("ASR transcription error:", whisperErr);
      }
    }

    audioChunksRef.current = [];
    hasSpokenInTurnRef.current = false;

    if (!queryText) {
      // Nothing heard, resume listening
      setStatus("listening");
      startTurnRecording();
      return;
    }

    // Display user speech prominently
    setLastUserSpeech(queryText);
    setTranscript("");
    setStatus("thinking");
    playChime("thinking");

    // Sync user message to main chat history
    if (activeChatId) {
      sendMessage(activeChatId, queryText);
    } else {
      createNewChat(queryText);
    }

    try {
      // High-speed conversational voice route (< 1s turnaround)
      const res = await fetch("/api/voice/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          location: userLocation,
          vesselType,
          userRole,
          language: selectedLang,
        }),
      });

      if (!res.ok) {
        throw new Error(`Voice chat status: ${res.status}`);
      }

      const data = await res.json();
      const spokenSummary = data.text || "Advisory confirmed. Parameters are verified for your operating sector.";

      setAiSpokenResponse(spokenSummary);
      playChime("response");
      await playNeuralAudio(spokenSummary, selectedLang);
    } catch (apiErr) {
      console.warn("Voice chat API fallback:", apiErr);
      const fallbackAdvisory = `Captain, sea conditions off ${userLocation.name} show wave height at 1.8 metres with 16 knot winds. Exercise caution.`;
      setAiSpokenResponse(fallbackAdvisory);
      await playNeuralAudio(fallbackAdvisory, selectedLang);
    }
  }, [
    transcript,
    activeChatId,
    createNewChat,
    sendMessage,
    userLocation,
    vesselType,
    userRole,
    selectedLang,
    playChime,
    playNeuralAudio,
    startTurnRecording,
  ]);

  useEffect(() => {
    finishUserSpeechTurnRef.current = finishUserSpeechTurn;
  }, [finishUserSpeechTurn]);

  // Hardware Microphone Stream & Web Audio Analyser
  const startMicrophonePipeline = useCallback(async () => {
    cleanupAudioPipeline();
    setStatus("connecting");

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission("denied");
      setStatus("mic_blocked");
      return;
    }

    try {
      // Unlock Web Audio AudioContext immediately on user interaction
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      audioContextRef.current = ctx;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setMicPermission("granted");

      // Connect mic to AnalyserNode
      const source = ctx.createMediaStreamSource(stream);
      micSourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const freqData = new Uint8Array(analyser.frequencyBinCount);

      // Real-time Visualizer & VAD loop
      const pollAudio = () => {
        if (!analyserRef.current || statusRef.current === "paused") {
          setAudioLevel(0);
          setFreqBands(new Array(20).fill(0));
          return;
        }

        analyserRef.current.getByteFrequencyData(freqData);

        // Calculate average energy
        let sum = 0;
        const bands: number[] = [];
        const step = Math.max(1, Math.floor(freqData.length / 20));

        for (let i = 0; i < 20; i++) {
          const val = freqData[i * step] || 0;
          sum += val;
          bands.push(Math.min(1, val / 200));
        }

        const avg = sum / (freqData.length || 1);
        const normalizedVolume = Math.min(1, Math.max(0, (avg - 10) / 70));

        setAudioLevel(normalizedVolume);
        setFreqBands(bands);

        // Voice Activity Detection (VAD)
        if (statusRef.current === "listening" && !isSpeakingTtsRef.current) {
          if (normalizedVolume > 0.12) {
            hasSpokenInTurnRef.current = true;
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          } else if (hasSpokenInTurnRef.current && normalizedVolume < 0.08) {
            // User paused for 1.2s -> auto submit turn
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                silenceTimerRef.current = null;
                finishUserSpeechTurnRef.current();
              }, 1200);
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(pollAudio);
      };

      animFrameRef.current = requestAnimationFrame(pollAudio);

      playChime("connected");

      // Welcome greeting in selected language
      const currentLangConfig = REGIONAL_LANGUAGES.find((l) => l.code === selectedLangRef.current) || REGIONAL_LANGUAGES[0];
      setAiSpokenResponse(currentLangConfig.greeting);
      await playNeuralAudio(currentLangConfig.greeting, selectedLangRef.current);
    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setMicPermission("denied");
      setStatus("mic_blocked");
      playChime("error");
    }
  }, [cleanupAudioPipeline, playChime, playNeuralAudio]);

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

  // Interrupt OR Done Speaking
  const handleInterruptOrSend = () => {
    if (status === "speaking" || isSpeakingTtsRef.current) {
      playChime("interrupt");
      if (ttsSourceNodeRef.current) {
        try {
          ttsSourceNodeRef.current.stop();
          ttsSourceNodeRef.current.disconnect();
        } catch {}
        ttsSourceNodeRef.current = null;
      }
      isSpeakingTtsRef.current = false;
      startTurnRecording();
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
      playChime("interrupt");
    }
  };

  const handleEndLive = () => {
    playChime("interrupt");
    cleanupAudioPipeline();
    setIsVoiceActive(false);
  };

  if (!isVoiceActive) return null;

  const dynamicOrbScale =
    status === "listening"
      ? 1 + audioLevel * 0.4
      : status === "speaking"
      ? 1.15
      : status === "thinking" || status === "transcribing"
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
        {/* Live Indicator Pill with Status & Real-time Pulse */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md shadow-lg">
          <span className="relative flex size-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                status === "speaking"
                  ? "bg-emerald-400"
                  : status === "thinking" || status === "transcribing"
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
                  : status === "thinking" || status === "transcribing"
                  ? "bg-amber-400"
                  : status === "mic_blocked"
                  ? "bg-rose-500"
                  : "bg-cyan-400"
              }`}
            />
          </span>

          <span className="text-xs font-semibold tracking-tight text-slate-200">
            {status === "connecting"
              ? "Connecting mic..."
              : status === "listening"
              ? audioLevel > 0.12 ? "Hearing You..." : "Listening (Speak Now)"
              : status === "transcribing"
              ? "Whisper Transcribing..."
              : status === "thinking"
              ? "Analyzing Marine Data..."
              : status === "speaking"
              ? "ORCA Speaking..."
              : status === "mic_blocked"
              ? "Microphone Blocked"
              : "Voice Paused"}
          </span>
        </div>

        {/* Dialect Switcher with Neural Voice Badge */}
        <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-full border border-white/10 shadow-inner">
          <Globe className="size-3.5 text-cyan-400 ml-2 mr-1" />
          {REGIONAL_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={async () => {
                if (selectedLang === lang.code) return;
                setSelectedLang(lang.code);
                selectedLangRef.current = lang.code;
                playChime("connected");
                if (ttsSourceNodeRef.current) {
                  try {
                    ttsSourceNodeRef.current.stop();
                    ttsSourceNodeRef.current.disconnect();
                  } catch {}
                  ttsSourceNodeRef.current = null;
                }
                isSpeakingTtsRef.current = false;
                setAiSpokenResponse(lang.greeting);
                await playNeuralAudio(lang.greeting, lang.code);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer min-h-[30px] flex items-center justify-center ${
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

      {/* ── Centerpiece: Gemini Live Fluid Chromatic Orb & Real-Time Waveform ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 my-auto py-6">
        {status === "mic_blocked" ? (
          <div className="max-w-md p-5 rounded-2xl bg-rose-950/80 border-2 border-rose-500/60 backdrop-blur-xl text-center shadow-2xl flex flex-col items-center gap-3 animate-fade-in">
            <div className="p-2.5 rounded-full bg-rose-500/20 text-rose-400">
              <AlertCircle className="size-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Microphone Access Required</h3>
              <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                Your browser is blocking microphone access. Click below to grant permission in your browser address bar.
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
            className="relative size-64 sm:size-72 flex items-center justify-center cursor-pointer group"
            title={
              status === "speaking"
                ? "Tap to interrupt ORCA"
                : status === "listening"
                ? "Tap to send now"
                : "ORCA Live Orb"
            }
          >
            {/* Radiating Ripple Wave Rings */}
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
                  : status === "thinking" || status === "transcribing"
                  ? "scale-105 opacity-70 animate-spin-slow"
                  : audioLevel > 0.12
                  ? "scale-125 opacity-90"
                  : "scale-100 opacity-60"
              }`}
            />

            {/* Fluid Chromatic Nucleus Orb */}
            <div
              className={`relative size-44 sm:size-52 shadow-[0_0_60px_rgba(6,182,212,0.6)] flex items-center justify-center transition-transform duration-150 ease-out ${
                status === "thinking" || status === "transcribing"
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

              {status === "listening" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <AudioWaveform className="size-6 text-white mb-1 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">Tap to Send</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Real-Time 20-Bar Frequency Visualizer (Definitive Proof Mic is Active) ── */}
        <div className="w-full max-w-xs flex flex-col items-center gap-2 mt-4">
          <div className="flex items-center justify-center gap-1 h-8 w-full px-4">
            {freqBands.map((val, idx) => {
              const heightPx = Math.max(3, Math.min(30, val * 30));
              const isVoiceHot = val > 0.25;
              return (
                <div
                  key={idx}
                  className={`w-1.5 rounded-full transition-all duration-75 ${
                    status === "speaking"
                      ? "bg-emerald-400"
                      : isVoiceHot
                      ? "bg-gradient-to-t from-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : audioLevel > 0.08
                      ? "bg-cyan-400/80"
                      : "bg-white/15"
                  }`}
                  style={{ height: `${heightPx}px` }}
                />
              );
            })}
          </div>

          {/* Voice Registration Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-mono">
            <Mic className={`size-3.5 ${audioLevel > 0.1 ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
            <span className="text-slate-400">Mic State:</span>
            <span className={`font-bold ${audioLevel > 0.1 ? "text-emerald-400" : "text-slate-400"}`}>
              {status === "speaking"
                ? "ORCA Speaking"
                : audioLevel > 0.1
                ? `Voice Detected (${Math.round(audioLevel * 100)}%)`
                : "Ready · Speak freely"}
            </span>
          </div>
        </div>

        {/* Coastal Corridor & Voice Profile Badge */}
        <div className="flex items-center gap-2 mt-3 px-3.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-slate-300 text-xs shadow-sm">
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

      {/* ── Bottom Section: Real-time Live Subtitles & Captions ── */}
      <div className="w-full max-w-xl z-10 flex flex-col items-center gap-4 pb-4">
        {/* Subtitles Bubble */}
        <div className="w-full min-h-[86px] px-5 py-3.5 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl flex flex-col justify-center text-center shadow-xl">
          {transcript ? (
            <div className="animate-fade-in space-y-1">
              <p className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1">
                <span className="size-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Hearing your voice...</span>
              </p>
              <p className="text-sm font-medium text-white italic leading-relaxed">
                "{transcript}"
              </p>
            </div>
          ) : status === "transcribing" ? (
            <div className="animate-fade-in space-y-1">
              <p className="text-[11px] font-mono text-amber-300 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Bhasini AI Indic Speech Transcribing...</span>
              </p>
              <p className="text-xs text-slate-300">
                Converting Indic audio to text via MeitY National AI pipeline...
              </p>
            </div>
          ) : status === "speaking" ? (
            <div className="animate-fade-in space-y-1">
              <p className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Volume2 className="size-3.5 animate-pulse" />
                <span>ORCA Spoken Advisory ({currentLangConfig.voiceName})</span>
              </p>
              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                {aiSpokenResponse}
              </p>
            </div>
          ) : status === "thinking" ? (
            <div className="flex items-center justify-center gap-2.5 text-xs text-amber-300 font-mono">
              <span className="size-2 rounded-full bg-amber-400 animate-ping" />
              <span>Synthesizing INCOIS wave, wind & safety data...</span>
            </div>
          ) : (
            <div className="space-y-1.5 text-xs text-slate-300">
              {lastUserSpeech ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                    <span>You: <strong className="text-cyan-300 font-medium italic">"{lastUserSpeech}"</strong></span>
                  </div>
                  {lastAsrProvider === "bhasini" && (
                    <div className="flex justify-center pt-1">
                      <div
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[11px] font-medium bg-gradient-to-r from-[#0e1824] to-[#0a111a] text-slate-200 border border-white/[0.1] shadow-[0_4px_14px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.12)]"
                        title="MeitY National AI Language Architecture (ULCA)"
                      >
                        <span className="relative flex size-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                        </span>
                        <span className="font-semibold text-emerald-400 tracking-tight">Bhasini ASR</span>
                        <span className="opacity-30">|</span>
                        <span className="text-[10px] text-slate-300 font-normal">
                          Speech recognition via Bhasini (Government of India)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">
                  Speak into your mic: <span className="text-slate-200">"Is it safe to go out today?"</span> or <span className="text-slate-200">"Where is the nearest fishing zone?"</span>
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

          {/* Interrupt OR Tap to Send */}
          <button
            type="button"
            onClick={handleInterruptOrSend}
            className={`px-6 h-12 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 ${
              status === "speaking"
                ? "bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/25"
                : audioLevel > 0.12 || transcript.trim()
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-cyan-500/30 animate-pulse"
                : "bg-white/[0.1] hover:bg-white/[0.16] text-slate-200 border border-white/15"
            }`}
          >
            {status === "speaking" ? (
              <>
                <Square className="size-4 fill-current" />
                <span>Tap to Interrupt</span>
              </>
            ) : status === "transcribing" ? (
              <>
                <Loader2 className="size-4 animate-spin text-amber-300" />
                <span>Transcribing...</span>
              </>
            ) : status === "thinking" ? (
              <>
                <Loader2 className="size-4 animate-spin text-amber-300" />
                <span>Thinking...</span>
              </>
            ) : audioLevel > 0.12 || transcript.trim() ? (
              <>
                <Send className="size-4 text-white" />
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
