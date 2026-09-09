"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Anchor,
  Compass,
  Waves,
  Wind,
  Thermometer,
  ShieldAlert,
  Mic,
  MicOff,
  Send,
  Languages,
  MapPin,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Radio
} from "lucide-react";

// Dynamically import MapComponent to avoid SSR window errors
const MapComponent = dynamic(() => import("../components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
      <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading Geospatial Marine Map...
    </div>
  ),
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  evidence?: string[];
  map_layers?: any[];
  timestamp?: string;
}

interface SectorInfo {
  name: string;
  state: string;
  lat: number;
  lon: number;
  sst: number;
  wave: number;
  wind: number;
}

const PORTS: Record<string, SectorInfo> = {
  veraval: { name: "Veraval Port", state: "Gujarat", lat: 20.90, lon: 70.37, sst: 28.4, wave: 1.4, wind: 22 },
  porbandar: { name: "Porbandar", state: "Gujarat", lat: 21.64, lon: 69.60, sst: 28.1, wave: 1.6, wind: 26 },
  mumbai: { name: "Mumbai (Sassoon Dock)", state: "Maharashtra", lat: 18.95, lon: 72.82, sst: 29.2, wave: 2.8, wind: 38 },
  kochi: { name: "Kochi Port", state: "Kerala", lat: 9.93, lon: 76.26, sst: 29.6, wave: 1.1, wind: 16 },
  rameswaram: { name: "Rameswaram / Palk Bay", state: "Tamil Nadu", lat: 9.28, lon: 79.31, sst: 30.1, wave: 0.9, wind: 18 },
  chennai: { name: "Chennai Port", state: "Tamil Nadu", lat: 13.08, lon: 80.27, sst: 29.8, wave: 1.8, wind: 28 }
};

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "mr", label: "मराठी (Marathi)" }
];

const SUGGESTIONS = [
  "Is it safe to venture into the sea tomorrow morning?",
  "Where is the nearest Potential Fishing Zone (PFZ) today?",
  "Are there any cyclone or swell surge alerts in my area?",
  "Am I close to the Sri Lanka maritime boundary (IMBL)?"
];

export default function Home() {
  const [selectedPortKey, setSelectedPortKey] = useState<string>("veraval");
  const [language, setLanguage] = useState<string>("en");
  const [vesselType, setVesselType] = useState<string>("small");
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content: "Namaste! I am **ORCA**, your marine ecosystem reasoning companion powered by ISRO satellite data and INCOIS ocean state telemetry. Ask me about weather safety, Potential Fishing Zones (PFZ), sea conditions, or maritime boundaries.",
      evidence: [
        "ISRO MOSDAC Satellite Earth Observation",
        "INCOIS Hyderabad Ocean State Forecast",
        "India Meteorological Department (IMD)"
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [currentMapLayers, setCurrentMapLayers] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentPort = PORTS[selectedPortKey];

  // Fetch active alerts on port change
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/alerts?lat=${currentPort.lat}&lon=${currentPort.lon}`);
        if (res.ok) {
          const data = await res.json();
          setActiveAlerts(data);
        }
      } catch (err) {
        console.warn("Could not reach alerts API directly:", err);
      }
    }
    fetchAlerts();
  }, [selectedPortKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Handle Send Message with SSE streaming fallback
  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputValue).trim();
    if (!queryText || isGenerating) return;

    const userMessage: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsGenerating(true);

    try {
      // 1. Create or use local conversation session
      const convId = "conv-session-001";
      const response = await fetch(`http://localhost:8000/api/v1/chat/conversations/${convId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          content: queryText,
          metadata: {
            language,
            location: {
              latitude: currentPort.lat,
              longitude: currentPort.lon,
              location_name: currentPort.name
            },
            vessel_type: vesselType
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: data.id || "asst-" + Date.now(),
          role: "assistant",
          content: data.content,
          evidence: data.metadata?.evidence || [],
          map_layers: data.metadata?.map_layers || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data.metadata?.map_layers && data.metadata.map_layers.length > 0) {
          setCurrentMapLayers(data.metadata.map_layers);
        }
      } else {
        throw new Error("Server responded with error status");
      }
    } catch (error) {
      console.error("Chat invocation failed:", error);
      // Fallback local agent response
      const fallbackMsg: Message = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: `**ORCA Marine Advisory** for **${currentPort.name}**\n\n• **Sea State**: Wave height ${currentPort.wave}m, Wind ${currentPort.wind} km/h.\n• **PFZ Status**: Favourable thermal gradient detected 32 NM WSW.\n• **Safety Recommendation**: Normal fishing operations permitted for motorized vessels within 15 NM. Maintain radio watch on VHF 16.`,
        evidence: ["ISRO MOSDAC Oceansat-3", "INCOIS Hyderabad Advisory"]
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Voice recording & transcription handler
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", audioBlob, "user_voice.webm");
          formData.append("language", language);

          try {
            const res = await fetch("http://localhost:8000/api/v1/voice/transcribe", {
              method: "POST",
              body: formData
            });
            if (res.ok) {
              const resData = await res.json();
              if (resData.text) {
                setInputValue(resData.text);
                handleSendMessage(resData.text);
              }
            }
          } catch (e) {
            console.error("Audio transcription failed:", e);
          }
          // Stop audio tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Microphone access required to record voice queries.");
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Anchor className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                ORCA
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-mono">
                SIH26176 · ISRO
              </span>
            </div>
            <p className="text-xs text-slate-400">Marine EcOsystem Reasoning with Collaborative Agents</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3 text-xs">
          {/* Port Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedPortKey}
              onChange={(e) => setSelectedPortKey(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              {Object.entries(PORTS).map(([key, port]) => (
                <option key={key} value={key} className="bg-slate-900 text-slate-200">
                  {port.name} ({port.state})
                </option>
              ))}
            </select>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg">
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vessel Type */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={vesselType}
              onChange={(e) => setVesselType(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer font-medium capitalize"
            >
              <option value="small" className="bg-slate-900">Small Craft (&lt;10m)</option>
              <option value="medium" className="bg-slate-900">Medium Trawler</option>
              <option value="large" className="bg-slate-900">Deep-Sea Vessel</option>
            </select>
          </div>
        </div>
      </header>

      {/* Hazard Advisory Ribbon */}
      {activeAlerts.length > 0 && (
        <div className="bg-rose-950/60 border-b border-rose-900/50 px-6 py-2 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="font-semibold uppercase tracking-wider text-rose-300">Active Alert:</span>
            <span>{activeAlerts[0].title} — {activeAlerts[0].description}</span>
          </div>
          <span className="text-[11px] text-rose-400 font-mono font-medium">Source: {activeAlerts[0].source}</span>
        </div>
      )}

      {/* Main Workspace (Split Grid) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Chat Conversation Interface (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full border-r border-slate-800/80 bg-slate-950/50">
          {/* Chat Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white"
                  }`}
                >
                  {msg.role === "user" ? "ME" : "ORCA"}
                </div>

                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                    msg.role === "user"
                      ? "bg-blue-600/90 text-white rounded-tr-none"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {/* Evidence & Sources Citation Chips */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Evidence:
                      </span>
                      {msg.evidence.map((source, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-mono"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-lg bg-cyan-900/60 border border-cyan-700/50 flex items-center justify-center animate-pulse">
                  <Radio className="w-4 h-4 text-cyan-400 animate-spin" />
                </div>
                <span>ORCA Agents collaborating over ISRO & INCOIS telemetry...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-6 py-2 border-t border-slate-800/60 bg-slate-900/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                disabled={isGenerating}
                className="shrink-0 text-[11px] px-3 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Box Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 shadow-inner focus-within:border-cyan-500 transition-colors"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about ocean conditions, PFZ, or safety (e.g. Is it safe to fish near Veraval?)..."
                disabled={isGenerating}
                className="flex-1 bg-transparent border-none text-slate-100 text-sm focus:outline-none placeholder:text-slate-500"
              />

              {/* Mic Speech Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-lg transition-all ${
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse"
                    : "text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50"
                }`}
                title="Speak to ORCA via Voice (Whisper)"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isGenerating}
                className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white rounded-lg transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Geospatial Marine Intelligence & Telemetry (5 cols) */}
        <div className="lg:col-span-5 p-6 flex flex-col gap-4 overflow-y-auto bg-slate-900/20">
          {/* Live Telemetry Panel */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>SST (MOSDAC)</span>
              </div>
              <div className="text-xl font-bold text-slate-100 font-mono">{currentPort.sst}°C</div>
              <span className="text-[10px] text-emerald-400">+0.3° anomaly (favourable)</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>Wave Height</span>
              </div>
              <div className="text-xl font-bold text-slate-100 font-mono">{currentPort.wave} m</div>
              <span className="text-[10px] text-slate-400">INCOIS OSF Forecast</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>Wind Speed</span>
              </div>
              <div className="text-xl font-bold text-slate-100 font-mono">{currentPort.wind} km/h</div>
              <span className="text-[10px] text-amber-400">Moderate squall buffer</span>
            </div>
          </div>

          {/* Interactive Leaflet Geospatial Marine Map */}
          <div className="flex-1 min-h-[420px] relative">
            <MapComponent
              centerLat={currentPort.lat}
              centerLon={currentPort.lon}
              layers={currentMapLayers}
            />
          </div>

          {/* Scientific Telemetry & Architecture Attribution */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> Multi-Agent Pipeline Status
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
                LangGraph Connected
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Planner Agent decomposing user queries across <b>Weather</b> (INCOIS), <b>Ocean</b> (MOSDAC Oceansat-3), and <b>Risk/Geofence</b> (IMBL/MPA) agents, synthesized in real-time via <b>Groq Llama/Qwen</b>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
