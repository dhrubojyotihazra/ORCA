"use client";

import React from "react";
import { useApp } from "@/lib/app-context";
import {
  Fish,
  Waves,
  CloudRain,
  AlertTriangle,
  Satellite,
  Compass,
  TrendingDown,
  Shield,
} from "lucide-react";

interface ActionChipsProps {
  onSelectPrompt: (promptText: string) => void;
}

export function ActionChips({ onSelectPrompt }: ActionChipsProps) {
  const { theme, userLocation, vesselType } = useApp();
  const isLight = theme === "light";

  const vesselLabel = vesselType === "small" ? "small craft (<8m)" : vesselType === "medium" ? "medium vessel (8-15m)" : "deep-sea trawler (>15m)";

  const chips = [
    {
      id: "pfz",
      label: "Nearest PFZ today",
      icon: Fish,
      prompt: `Where is the nearest Potential Fishing Zone (PFZ) today from ${userLocation.name}?`,
    },
    {
      id: "safety",
      label: "Safe to venture?",
      icon: Waves,
      prompt: `Is it safe to venture into the sea tomorrow morning for a ${vesselLabel}?`,
    },
    {
      id: "conditions",
      label: "Tide & sea conditions",
      icon: CloudRain,
      prompt: `What are the tide, weather, and sea conditions near ${userLocation.name}?`,
    },
    {
      id: "cyclone",
      label: "Cyclone & lightning alerts",
      icon: AlertTriangle,
      prompt: `Are there any lightning or cyclone alerts in our area near ${userLocation.name}?`,
    },
    {
      id: "sst",
      label: "Chlorophyll & SST",
      icon: Satellite,
      prompt: `Which regions show high chlorophyll and favorable sea surface temperature near ${userLocation.name}?`,
    },
    {
      id: "route",
      label: "Safest route",
      icon: Compass,
      prompt: `What is the safest route given current weather and sea state from ${userLocation.name}?`,
    },
    {
      id: "decline",
      label: "Fish productivity decline",
      icon: TrendingDown,
      prompt: `Why has fish productivity declined in the coastal region near ${userLocation.name}?`,
    },
    {
      id: "geofence",
      label: "Geofence restrictions",
      icon: Shield,
      prompt: `Which fishing zones should be avoided due to geofencing restrictions near ${userLocation.name}?`,
    },
  ];

  return (
    <div className="flex flex-nowrap sm:flex-wrap items-center sm:justify-center overflow-x-auto w-full max-w-2xl mx-auto px-4 gap-2 pt-4 pb-2 scrollbar-none touch-pan-x select-none">
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelectPrompt(chip.prompt)}
            className={`inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
              isLight
                ? "bg-[#eaf1f8] text-slate-600 hover:text-slate-800 shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(180,195,215,0.35)] border border-white/60 hover:shadow-[-3px_-3px_7px_rgba(255,255,255,1),3px_3px_7px_rgba(180,195,215,0.45)]"
                : "bg-slate-900/50 text-slate-400 hover:text-slate-200 border border-white/[0.06] shadow-[0_2px_6px_rgba(0,0,0,0.4)] hover:border-white/10"
            }`}
          >
            <Icon className="size-3 text-cyan-500/70 shrink-0" />
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}
