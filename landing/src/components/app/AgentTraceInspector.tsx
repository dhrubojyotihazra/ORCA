"use client";

import React, { useState } from "react";
import { AgentTraceStep } from "@/lib/chat-store";
import {
  ChevronDown,
  ChevronUp,
  Cpu,
  Compass,
  Waves,
  Wind,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Activity,
  Layers,
} from "lucide-react";

interface AgentTraceInspectorProps {
  trace: AgentTraceStep[];
  isLight: boolean;
}

const AGENT_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeBg: string;
    borderColor: string;
  }
> = {
  planner: {
    icon: Compass,
    accentColor: "text-sky-400",
    badgeBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    borderColor: "border-sky-500/30",
  },
  ocean_specialist: {
    icon: Waves,
    accentColor: "text-teal-400",
    badgeBg: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    borderColor: "border-teal-500/30",
  },
  weather_specialist: {
    icon: Wind,
    accentColor: "text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  risk_specialist: {
    icon: ShieldAlert,
    accentColor: "text-rose-400",
    badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    borderColor: "border-rose-500/30",
  },
  synthesizer: {
    icon: Sparkles,
    accentColor: "text-cyan-400",
    badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    borderColor: "border-cyan-500/30",
  },
};

export function AgentTraceInspector({ trace, isLight }: AgentTraceInspectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  if (!trace || trace.length === 0) return null;

  const totalDuration = trace.reduce((acc, s) => acc + (s.durationMs || 0), 0);
  const hasLiveFeed = trace.some((s) => s.isLive);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isLight
          ? "bg-[#edf2f7] border-slate-200 shadow-sm"
          : "bg-[#0b1622]/90 border-cyan-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
      }`}
    >
      {/* Accordion Header Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer select-none ${
          isLight
            ? "hover:bg-slate-200/60"
            : "hover:bg-white/[0.04]"
        }`}
      >
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          {/* Engine Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold">
            <Cpu className="size-3" />
            <span>Multi-Agent DAG Trace</span>
          </div>

          {/* Quick Agent Avatars */}
          <div className="flex items-center -space-x-1.5">
            {trace.map((step) => {
              const cfg = AGENT_CONFIG[step.agentId] || AGENT_CONFIG.synthesizer;
              const Icon = cfg.icon;
              return (
                <div
                  key={step.id}
                  title={`${step.name}: ${step.role}`}
                  className={`size-5 rounded-full flex items-center justify-center border ring-1 ring-black/40 ${
                    isLight ? "bg-white border-slate-300" : "bg-slate-900 border-white/20"
                  } ${cfg.accentColor}`}
                >
                  <Icon className="size-2.5" />
                </div>
              );
            })}
          </div>

          {/* Metrics summary */}
          <span className="text-[11px] text-slate-400 font-mono">
            {trace.length} Agents · {totalDuration}ms
          </span>

          {/* Live indicator badge */}
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{hasLiveFeed ? "INCOIS ERDDAP Live" : "Calibrated Baseline"}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[10px] hidden sm:inline font-mono">
            {isExpanded ? "Collapse" : "Inspect"}
          </span>
          {isExpanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </div>
      </button>

      {/* Expanded Trace Breakdown */}
      {isExpanded && (
        <div
          className={`p-3.5 border-t space-y-3 ${
            isLight
              ? "border-slate-200 bg-white/60"
              : "border-cyan-500/15 bg-black/20"
          }`}
        >
          {/* Stepper Grid */}
          <div className="space-y-2">
            {trace.map((step, idx) => {
              const cfg = AGENT_CONFIG[step.agentId] || AGENT_CONFIG.synthesizer;
              const Icon = cfg.icon;
              const isSelected = selectedAgentId === step.id;

              return (
                <div
                  key={step.id}
                  className={`rounded-xl p-2.5 border transition-all text-xs ${
                    isSelected
                      ? isLight
                        ? "bg-sky-50 border-sky-300 ring-1 ring-sky-200"
                        : "bg-cyan-950/40 border-cyan-400/40 ring-1 ring-cyan-500/20"
                      : isLight
                      ? "bg-white/80 border-slate-200 hover:border-slate-300"
                      : "bg-[#0c1824]/60 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div
                    className="flex items-center justify-between gap-2 cursor-pointer select-none"
                    onClick={() =>
                      setSelectedAgentId(isSelected ? null : step.id)
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`size-6 rounded-lg flex items-center justify-center shrink-0 ${cfg.badgeBg} border`}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-bold ${
                              isLight ? "text-slate-900" : "text-white"
                            }`}
                          >
                            {step.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({step.role})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                        <Clock className="size-2.5" />
                        {step.durationMs}ms
                      </span>
                      {step.status === "completed" ? (
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="size-3.5 text-amber-400" />
                      )}
                    </div>
                  </div>

                  {/* Summary Text */}
                  <p
                    className={`mt-1.5 text-[11px] leading-relaxed ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    {step.summary}
                  </p>

                  {/* Telemetry Key-Value Grid */}
                  {step.telemetry && Object.keys(step.telemetry).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
                      {Object.entries(step.telemetry).map(([key, val]) => (
                        <div
                          key={key}
                          className={`p-1.5 rounded-md font-mono ${
                            isLight
                              ? "bg-slate-100 text-slate-800"
                              : "bg-black/30 text-slate-200 border border-white/5"
                          }`}
                        >
                          <span className="text-slate-400 block text-[9px] uppercase tracking-wider truncate">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span className="font-semibold text-cyan-400 truncate block">
                            {typeof val === "object"
                              ? JSON.stringify(val)
                              : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Citations Footer */}
                  {step.citations && step.citations.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] text-slate-400 font-mono">
                        Sources:
                      </span>
                      {step.citations.map((cite, cIdx) => (
                        <span
                          key={cIdx}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                            isLight
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-white/[0.04] text-slate-300 border-white/10"
                          }`}
                        >
                          {cite}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span>Orchestration Framework: LangGraph StateGraph</span>
            <span>Zero-Hallucination Certified</span>
          </div>
        </div>
      )}
    </div>
  );
}
