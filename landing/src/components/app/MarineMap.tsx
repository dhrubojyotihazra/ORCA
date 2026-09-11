"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  Compass,
  Fish,
  Waves,
  Shield,
  Maximize2,
  Minimize2,
  X,
  ChevronUp,
  ChevronDown,
  Layers,
  Thermometer,
  Wind,
  Info,
  Crosshair,
  Satellite,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

export interface MarineMapProps {
  mode: "inline" | "modal";
  contextType?: "pfz" | "safety" | "geofence" | "general";
  title?: string;
  caption?: string;
  className?: string;
  customCenter?: [number, number];
  customZoom?: number;
  onExpand?: () => void;
  onClose?: () => void;
}

// ── Geographic Data Layers across Target Sectors (SIH26176) ──
interface SectorData {
  center: [number, number];
  zoom: number;
  pfzEllipse: {
    center: [number, number];
    radiusY: number; // in degrees
    radiusX: number;
    bearing: string;
    distance: string;
    description: string;
  };
  mpaSanctuary: {
    name: string;
    polygon: [number, number][];
    bufferRadiusNm: number;
    status: string;
  };
  imblBoundary: [number, number][];
  sstHeatPoints: [number, number, number][]; // [lat, lon, normalized_intensity]
  chlorophyllHeatPoints: [number, number, number][];
  windVectors: {
    speedKnots: number;
    directionDeg: number;
    currentSpeedMs: number;
  };
}

const SECTOR_DATA: Record<string, SectorData> = {
  paradip: {
    center: [20.26, 86.67],
    zoom: 9,
    pfzEllipse: {
      center: [19.98, 87.02],
      radiusY: 0.18,
      radiusX: 0.28,
      bearing: "135° SE",
      distance: "14.2 NM",
      description: "Indian Mackerel & Tuna Thermal Convergence",
    },
    mpaSanctuary: {
      name: "Gahirmatha Marine Sanctuary (MPA)",
      polygon: [
        [20.55, 86.90],
        [20.78, 87.05],
        [20.85, 87.25],
        [20.60, 87.35],
        [20.45, 87.08],
      ],
      bufferRadiusNm: 12,
      status: "Strict No-Take Turtle Buffer Zone",
    },
    imblBoundary: [
      [21.20, 88.40],
      [20.80, 88.60],
      [20.20, 88.90],
      [19.50, 89.20],
    ],
    sstHeatPoints: [
      [20.20, 86.80, 0.75],
      [20.10, 86.95, 0.90],
      [20.00, 87.05, 0.95],
      [19.90, 87.15, 0.85],
      [19.80, 87.00, 0.70],
      [20.15, 86.60, 0.60],
      [20.35, 86.75, 0.65],
    ],
    chlorophyllHeatPoints: [
      [20.30, 86.85, 0.85],
      [20.15, 86.90, 0.95],
      [20.05, 87.00, 0.90],
      [19.95, 86.90, 0.80],
      [20.40, 87.00, 0.75],
      [20.50, 87.10, 0.85],
    ],
    windVectors: {
      speedKnots: 18.5,
      directionDeg: 65, // ENE
      currentSpeedMs: 0.42,
    },
  },
  // Fallback / default sector
  default: {
    center: [20.26, 86.67],
    zoom: 9,
    pfzEllipse: {
      center: [19.98, 87.02],
      radiusY: 0.18,
      radiusX: 0.28,
      bearing: "135° SE",
      distance: "14.2 NM",
      description: "Indian Mackerel & Tuna Thermal Convergence",
    },
    mpaSanctuary: {
      name: "Gahirmatha Marine Sanctuary (MPA)",
      polygon: [
        [20.55, 86.90],
        [20.78, 87.05],
        [20.85, 87.25],
        [20.60, 87.35],
        [20.45, 87.08],
      ],
      bufferRadiusNm: 12,
      status: "Strict No-Take Turtle Buffer Zone",
    },
    imblBoundary: [
      [21.20, 88.40],
      [20.80, 88.60],
      [20.20, 88.90],
      [19.50, 89.20],
    ],
    sstHeatPoints: [
      [20.20, 86.80, 0.75],
      [20.10, 86.95, 0.90],
      [20.00, 87.05, 0.95],
      [19.90, 87.15, 0.85],
    ],
    chlorophyllHeatPoints: [
      [20.30, 86.85, 0.85],
      [20.15, 86.90, 0.95],
      [20.05, 87.00, 0.90],
    ],
    windVectors: {
      speedKnots: 18.5,
      directionDeg: 65,
      currentSpeedMs: 0.42,
    },
  },
};

export function MarineMap({
  mode,
  contextType = "general",
  title,
  caption,
  className = "",
  customCenter,
  customZoom,
  onExpand,
  onClose,
}: MarineMapProps) {
  const { theme, userLocation, setIsMapOpen, vesselType } = useApp();
  const isLight = theme === "light";

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const satelliteLayerRef = useRef<any>(null);

  // Satellite vs OSM base layer toggle (Default to true: genuine keyless NASA GIBS satellite)
  const [isSatelliteMode, setIsSatelliteMode] = useState(true);

  // Modal telemetry drawer open/collapsed state (collapsed by default per guidelines)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Active layer toggles (4-5 layers maximum, none bloated)
  const [layers, setLayers] = useState({
    pfz: mode === "inline" ? contextType === "pfz" || contextType === "general" : true,
    sst: mode === "inline" ? false : true,
    chlorophyll: mode === "inline" ? false : false,
    vectors: mode === "inline" ? contextType === "safety" : true,
    geofence: mode === "inline" ? contextType === "geofence" || contextType === "general" : true,
  });

  const toggleLayer = (layerKey: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Determine sector data
  const sector = SECTOR_DATA[userLocation.id] || SECTOR_DATA.default;
  const centerCoord: [number, number] = customCenter || [userLocation.lat, userLocation.lon];
  const zoomLevel = customZoom || (mode === "inline" ? 8 : sector.zoom);

  // ── Leaflet Initialization & Tile Rendering ──
  useEffect(() => {
    let isMounted = true;

    // Load Leaflet dynamically on client to guarantee zero SSR conflicts
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      // 1. Initialize Map Instance
      const map = L.map(mapContainerRef.current, {
        center: centerCoord,
        zoom: zoomLevel,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: mode === "modal",
        dragging: mode === "modal",
        touchZoom: mode === "modal",
        doubleClickZoom: mode === "modal",
        scrollWheelZoom: mode === "modal",
        attributionControl: mode === "modal",
      });

      mapInstanceRef.current = map;

      // 2. Base Tile Layers
      // 2. Base Tile Layers
      // Seamless High-Resolution Satellite Layer: ESRI World Imagery (zero orbital swath gaps)
      const esriSatellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: 'Satellite Imagery &copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a>, Maxar, Earthstar Geographics',
        }
      );

      // Cyber-Ocean Marine Nautical Base Layer (Dark Matter / OSM)
      const baseOsm = L.tileLayer(
        isLight
          ? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; CARTO',
        }
      ).addTo(map);

      if (isSatelliteMode) {
        esriSatellite.addTo(map);
      }
      satelliteLayerRef.current = esriSatellite;

      // Layer group for dynamic overlays
      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = { group: layersGroup, L };

      // Render overlay graphics
      renderOverlays(layersGroup, L, layers, sector, userLocation, vesselType, mode);

      // Force Leaflet invalidation on layout render
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }
    };
  }, [userLocation.id, isLight, mode]);

  // Synchronize satellite layer toggle dynamically without map rebuild
  useEffect(() => {
    if (satelliteLayerRef.current && mapInstanceRef.current) {
      if (isSatelliteMode) {
        if (!mapInstanceRef.current.hasLayer(satelliteLayerRef.current)) {
          satelliteLayerRef.current.addTo(mapInstanceRef.current);
          satelliteLayerRef.current.bringToBack();
        }
      } else {
        if (mapInstanceRef.current.hasLayer(satelliteLayerRef.current)) {
          satelliteLayerRef.current.remove();
        }
      }
    }
  }, [isSatelliteMode]);

  // Update layers when toggled without recreating the whole map
  useEffect(() => {
    if (layersGroupRef.current && mapInstanceRef.current) {
      const { group, L } = layersGroupRef.current;
      group.clearLayers();
      renderOverlays(group, L, layers, sector, userLocation, vesselType, mode);
    }
  }, [layers, vesselType, mode]);

  // Recenter map on active coastal station
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], mode === "inline" ? 8 : 10, {
        animate: true,
      });
    }
  };

  // Keyboard shortcut: Esc closes full modal
  useEffect(() => {
    if (mode !== "modal") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onClose) onClose();
        else setIsMapOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, onClose, setIsMapOpen]);

  const handleCardClick = () => {
    if (mode === "inline") {
      if (onExpand) {
        onExpand();
      } else {
        setIsMapOpen(true);
      }
    }
  };

  // Caption resolution for inline mode
  const resolvedCaption =
    caption ||
    (contextType === "pfz"
      ? `🐟 PFZ Zone: ${sector.pfzEllipse.distance} ${sector.pfzEllipse.bearing} · ${sector.pfzEllipse.description}`
      : contextType === "safety"
      ? `🌊 Wave Warning: Hs 2.1m (Rough) · Sustained winds ${sector.windVectors.speedKnots} kts`
      : contextType === "geofence"
      ? `🛡️ Geofence: ${sector.mpaSanctuary.name} (${sector.mpaSanctuary.bufferRadiusNm} NM Buffer)`
      : `📍 Spatial Corridor: ${userLocation.name} · Live ISRO & INCOIS GIS Telemetry`);

  // ─────────────────────────────────────────────────────────────
  // ── INLINE MINI-MAP MODE (Rendered inside Chat Bubbles) ──
  // ─────────────────────────────────────────────────────────────
  if (mode === "inline") {
    return (
      <div
        onClick={handleCardClick}
        className={`w-full rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 relative border select-none ${
          isLight
            ? "bg-[#edf3f9] border-slate-300/80 shadow-[-2px_-2px_6px_rgba(255,255,255,0.9),2px_2px_6px_rgba(180,195,215,0.4)] hover:border-cyan-500/50"
            : "bg-[#0c1420] border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-cyan-500/40"
        } ${className}`}
      >
        {/* Map Container (Fixed Height ~210px, non-interactive to prevent scroll-jacking) */}
        <div className="h-[210px] w-full relative z-0">
          <div ref={mapContainerRef} className="h-full w-full z-0 pointer-events-none" />

          {/* Floating Tap-to-Expand Glass Badge */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-md group-hover:bg-cyan-500 transition-colors">
              <Maximize2 className="size-3" />
              <span>Expand Map</span>
            </span>
          </div>

          {/* Context Badge */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-black/60 text-cyan-300 backdrop-blur-md border border-cyan-500/30">
              <Compass className="size-3 text-cyan-400" />
              <span>{userLocation.name}</span>
            </span>
          </div>
        </div>

        {/* Clean Plain-Language Caption Underneath (No raw numbers directly inline) */}
        <div
          className={`px-3.5 py-2.5 flex items-center justify-between border-t transition-colors ${
            isLight
              ? "bg-white/80 border-slate-200 text-slate-700 group-hover:bg-white"
              : "bg-[#080e18]/90 border-white/5 text-slate-300 group-hover:bg-[#0c1422]"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <p className="text-xs font-medium truncate">{resolvedCaption}</p>
          </div>
          <span className="text-[10px] font-mono text-cyan-500 font-semibold shrink-0 group-hover:underline">
            View GIS ➔
          </span>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // ── FULL GIS MODAL MODE (Opened via Header or Mini-map) ──
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (onClose) onClose();
          else setIsMapOpen(false);
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6 transition-all select-none"
    >
      <div
        className={`relative w-full max-w-6xl h-[90dvh] rounded-[28px] overflow-hidden flex flex-col shadow-2xl transition-all ${
          isLight ? "neo-card-light" : "neo-card-dark"
        } ${className}`}
      >
        {/* ── Top Bar: Layer Toggles (Slim Horizontal Strip, Max 4-5 Toggles) ── */}
        <div
          className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 z-10 backdrop-blur-md transition-colors ${
            isLight
              ? "bg-white/90 border-slate-200 shadow-sm"
              : "bg-black/50 border-white/10"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleRecenter}
              title="Recenter Map on Vessel (Compass)"
              className={`p-1.5 rounded-xl shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isLight
                  ? "bg-cyan-100 text-cyan-800 border-2 border-cyan-400/80 hover:bg-cyan-200"
                  : "bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500/50 hover:bg-cyan-500/30"
              }`}
            >
              <Compass className="size-4.5 stroke-[2.4]" />
            </button>
            <div className="min-w-0">
              <h2 className={`text-sm font-bold truncate flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
                <span>ORCA Live Marine GIS</span>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold hidden sm:inline">
                  (ESRI Satellite · ISRO · INCOIS)
                </span>
              </h2>
              <p className={`text-[10px] truncate ${isLight ? "text-slate-600 font-medium" : "text-slate-400"}`}>
                Anchor: {userLocation.name} ({userLocation.lat}°N, {userLocation.lon}°E) · Vessel: {vesselType === "small" ? "<8m Craft" : vesselType === "medium" ? "8-15m Motorized" : ">15m Trawler"}
              </p>
            </div>
          </div>

          {/* 4-5 Slim Toggle Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* PFZ Toggle */}
            <button
              type="button"
              onClick={() => toggleLayer("pfz")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                layers.pfz
                  ? "bg-teal-500 text-white shadow-md shadow-teal-500/30"
                  : isLight
                  ? "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                  : "bg-slate-800/70 text-slate-400 border border-white/10 hover:bg-slate-700"
              }`}
            >
              <Fish className="size-3.5" />
              <span>PFZ Zones</span>
            </button>

            {/* SST Heatmap Toggle */}
            <button
              type="button"
              onClick={() => toggleLayer("sst")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                layers.sst
                  ? "bg-amber-500 text-black font-bold shadow-md shadow-amber-500/30"
                  : isLight
                  ? "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                  : "bg-slate-800/70 text-slate-400 border border-white/10 hover:bg-slate-700"
              }`}
            >
              <Thermometer className="size-3.5" />
              <span>SST Heat</span>
            </button>

            {/* Chlorophyll Toggle */}
            <button
              type="button"
              onClick={() => toggleLayer("chlorophyll")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                layers.chlorophyll
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                  : isLight
                  ? "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                  : "bg-slate-800/70 text-slate-400 border border-white/10 hover:bg-slate-700"
              }`}
            >
              <Waves className="size-3.5" />
              <span>Chlorophyll</span>
            </button>

            {/* Wind / Waves Vectors Toggle */}
            <button
              type="button"
              onClick={() => toggleLayer("vectors")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                layers.vectors
                  ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30"
                  : isLight
                  ? "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                  : "bg-slate-800/70 text-slate-400 border border-white/10 hover:bg-slate-700"
              }`}
            >
              <Wind className="size-3.5" />
              <span>Wind / Vectors</span>
            </button>

            {/* Geofence Toggle */}
            <button
              type="button"
              onClick={() => toggleLayer("geofence")}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                layers.geofence
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                  : isLight
                  ? "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                  : "bg-slate-800/70 text-slate-400 border border-white/10 hover:bg-slate-700"
              }`}
            >
              <Shield className="size-3.5" />
              <span>IMBL & MPA</span>
            </button>

            {/* Satellite Base Layer Toggle */}
            <button
              type="button"
              onClick={() => setIsSatelliteMode((prev) => !prev)}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSatelliteMode
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/50"
                  : isLight
                  ? "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                  : "bg-slate-800/70 text-slate-300 border border-white/10 hover:bg-slate-700"
              }`}
              title={isSatelliteMode ? "ESRI Satellite active · Click to switch to Marine Basemap" : "Marine Basemap active · Click to switch to ESRI Satellite"}
            >
              <Satellite className="size-3.5" />
              <span>{isSatelliteMode ? "Satellite: ON" : "Marine Map"}</span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-300 dark:bg-white/20 mx-1 hidden sm:block" />

            {/* Recenter / Compass Button */}
            <button
              type="button"
              onClick={handleRecenter}
              className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md ${
                isLight
                  ? "bg-white hover:bg-cyan-50 text-cyan-800 hover:text-cyan-900 border-2 border-cyan-400 hover:border-cyan-500 shadow-sm"
                  : "bg-slate-900/90 hover:bg-cyan-950/80 text-cyan-400 hover:text-cyan-300 border-2 border-cyan-500/60 hover:border-cyan-400 shadow-sm"
              }`}
              title="Recenter Map on Vessel (Compass)"
              aria-label="Recenter on Vessel (Compass)"
            >
              <Compass className="size-4.5 stroke-[2.4]" />
            </button>

            {/* Close Modal Button (X) */}
            <button
              type="button"
              onClick={() => (onClose ? onClose() : setIsMapOpen(false))}
              className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md ${
                isLight
                  ? "bg-rose-500 hover:bg-rose-600 text-white border-2 border-rose-600 shadow-rose-500/25"
                  : "bg-rose-500/90 hover:bg-rose-500 text-white border-2 border-rose-400/80 shadow-rose-500/40"
              }`}
              title="Close Map (Esc)"
              aria-label="Close Map"
            >
              <X className="size-4.5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* ── Interactive Leaflet Canvas ── */}
        <div className="flex-1 relative overflow-hidden">
          <div ref={mapContainerRef} className="h-full w-full z-0" />

          {/* Floating Comprehensive Map Legend Card */}
          <div
            className={`absolute top-4 left-4 z-20 flex flex-col gap-2 p-2.5 rounded-2xl backdrop-blur-md border text-[10px] shadow-xl select-none max-w-[220px] ${
              isLight
                ? "bg-white/95 border-slate-300 text-slate-800 shadow-slate-300/40"
                : "bg-black/80 border-white/15 text-white shadow-black/80"
            }`}
          >
            {/* Legend Header with Base Layer Indicator */}
            <div className={`flex items-center justify-between pb-1.5 border-b ${isLight ? "border-slate-200" : "border-white/10"}`}>
              <span className={`font-mono text-[9px] uppercase tracking-wider font-bold ${isLight ? "text-cyan-700" : "text-cyan-400"}`}>
                Map Legend
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isLight ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-white/10 text-slate-300"}`}>
                {isSatelliteMode ? "ESRI Satellite" : "Marine GIS"}
              </span>
            </div>

            {/* SST Thermal Fronts */}
            {layers.sst && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full border border-orange-400 bg-orange-500 shrink-0 shadow-sm" />
                  <span className={`font-semibold ${isLight ? "text-amber-800" : "text-amber-300"}`}>Thermal Front (SST)</span>
                </div>
                <div className="flex items-center gap-1.5 pl-4">
                  <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-blue-600 via-emerald-400 to-amber-500" />
                  <span className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-300"}`}>Cooler → Warmer</span>
                </div>
              </div>
            )}

            {/* Chlorophyll Plumes */}
            {layers.chlorophyll && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full border border-emerald-400 bg-emerald-500 shrink-0 shadow-sm" />
                  <span className={`font-semibold ${isLight ? "text-emerald-800" : "text-emerald-300"}`}>Chlorophyll-a Plume</span>
                </div>
                <div className="flex items-center gap-1.5 pl-4">
                  <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-teal-900 via-emerald-400 to-lime-300" />
                  <span className={`text-[9px] ${isLight ? "text-slate-600" : "text-slate-300"}`}>Low → Bloom</span>
                </div>
              </div>
            )}

            {/* PFZ Zones */}
            {layers.pfz && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded border border-dashed border-teal-400 bg-teal-500/30 shrink-0" />
                <span className={`font-medium ${isLight ? "text-teal-800" : "text-teal-300"}`}>PFZ Fishing Corridor</span>
              </div>
            )}

            {/* IMBL & MPA Sanctuary */}
            {layers.geofence && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded border border-rose-500 bg-rose-500/30 shrink-0" />
                <span className={`font-medium ${isLight ? "text-rose-800" : "text-rose-300"}`}>MPA Sanctuary / IMBL</span>
              </div>
            )}

            {/* Wind / Currents */}
            {layers.vectors && (
              <div className="flex items-center gap-1.5">
                <span className={`text-xs leading-none shrink-0 font-bold ${isLight ? "text-cyan-700" : "text-cyan-400"}`}>➔</span>
                <span className={`font-medium ${isLight ? "text-cyan-800" : "text-cyan-300"}`}>Current / Wind Vector</span>
              </div>
            )}

            {/* Vessel Anchor */}
            <div className={`flex items-center gap-1.5 pt-1 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
              <span className="size-2 rounded-full bg-cyan-400 ring-2 ring-cyan-400/40 shrink-0" />
              <span className={`font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>{userLocation.name} (Anchor)</span>
            </div>
          </div>

          {/* ── Collapsible "See Details" Drawer (Bottom Sheet) ── */}
          {/* Numbers stay strictly behind "See Details", collapsed by default */}
          <div
            className={`absolute bottom-0 inset-x-0 z-20 transition-all duration-300 ${
              isDetailsOpen
                ? "translate-y-0"
                : "translate-y-[calc(100%-42px)]"
            }`}
          >
            <div className="max-w-3xl mx-auto px-3">
              <div
                className={`rounded-t-2xl p-3 border border-b-0 shadow-2xl backdrop-blur-xl ${
                  isLight
                    ? "bg-white/95 border-slate-300 text-slate-800"
                    : "bg-[#0c1422]/95 border-white/15 text-slate-100"
                }`}
              >
                {/* Drawer Toggle Header */}
                <button
                  type="button"
                  onClick={() => setIsDetailsOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between cursor-pointer py-1 px-2"
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Info className="size-3.5 text-cyan-400" />
                    <span>See Technical Telemetry & Spatial Metrics</span>
                    <span className="text-[10px] opacity-60 font-normal hidden sm:inline">
                      (Hydrodynamic Safety Index, Species HSI, Geofence Buffers)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-cyan-500 font-semibold">
                    <span>{isDetailsOpen ? "Collapse" : "Expand"}</span>
                    {isDetailsOpen ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                  </div>
                </button>

                {/* Expanded Telemetry Numbers */}
                {isDetailsOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-2 border-t border-black/10 dark:border-white/10 text-xs">
                    {/* Hydrodynamic Safety Metrics */}
                    <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                      <span className={`text-[10px] font-mono font-bold uppercase block ${isLight ? "text-cyan-800" : "text-cyan-400"}`}>
                        Sea-Venture Safety Index
                      </span>
                      <p className={`text-base font-bold ${isLight ? "text-amber-700" : "text-amber-400"}`}>29.35 / 100</p>
                      <p className="text-[11px] opacity-75">Condition: Elevated Vigilance</p>
                      <div className="pt-1 text-[10px] opacity-60 space-y-0.5">
                        <p>Hs (Wave): 2.1 m (Limit 1.5 m)</p>
                        <p>Wind: {sector.windVectors.speedKnots} kts ENE</p>
                        <p>Current: {sector.windVectors.currentSpeedMs} m/s</p>
                      </div>
                    </div>

                    {/* Species Catch Probability */}
                    <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                      <span className={`text-[10px] font-mono font-bold uppercase block ${isLight ? "text-emerald-800" : "text-emerald-400"}`}>
                        Species Habitat Suitability
                      </span>
                      <p className={`text-base font-bold ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>0.84 HSI</p>
                      <p className="text-[11px] opacity-75">Target: Indian Mackerel</p>
                      <div className="pt-1 text-[10px] opacity-60 space-y-0.5">
                        <p>Yellowfin Tuna: 0.65 HSI</p>
                        <p>Hilsa Plume: 0.88 HSI</p>
                        <p>SST Front: 29.4°C (+0.8°C)</p>
                      </div>
                    </div>

                    {/* Geofence & Boundary Proximity */}
                    <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 space-y-1">
                      <span className={`text-[10px] font-mono font-bold uppercase block ${isLight ? "text-rose-800" : "text-rose-400"}`}>
                        Spatial Boundaries
                      </span>
                      <p className={`text-base font-bold ${isLight ? "text-rose-700" : "text-rose-400"}`}>9.2 NM to MPA</p>
                      <p className="text-[11px] opacity-75">{sector.mpaSanctuary.name}</p>
                      <div className="pt-1 text-[10px] opacity-60 space-y-0.5">
                        <p>Status: Buffer Alert Active</p>
                        <p>IMBL Sovereign Line: 18.4 NM East</p>
                        <p>Beacon: Audio Warning at 5 NM</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Overlays Generator Function ──
function renderOverlays(
  group: any,
  L: any,
  layers: { pfz: boolean; sst: boolean; chlorophyll: boolean; vectors: boolean; geofence: boolean },
  sector: SectorData,
  userLocation: { lat: number; lon: number; name: string },
  vesselType: string,
  mode: "inline" | "modal"
) {
  // 1. Vessel Position Anchor (Always shown)
  const vesselIcon = L.divIcon({
    className: "custom-vessel-marker",
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: rgba(6, 182, 212, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 12px; height: 12px; border-radius: 50%; background: #06b6d4; border: 2px solid #ffffff; box-shadow: 0 0 10px #06b6d4;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const vesselMarker = L.marker([userLocation.lat, userLocation.lon], { icon: vesselIcon });
  if (mode === "modal") {
    vesselMarker.bindPopup(
      `<b>${userLocation.name}</b><br/>Active Corridor Anchor<br/>Vessel: ${vesselType}`
    );
  }
  group.addLayer(vesselMarker);

  // 2. PFZ Potential Fishing Zone Ellipse & Target Marker
  if (layers.pfz) {
    const pfzBounds: [[number, number], [number, number]] = [
      [
        sector.pfzEllipse.center[0] - sector.pfzEllipse.radiusY,
        sector.pfzEllipse.center[1] - sector.pfzEllipse.radiusX,
      ],
      [
        sector.pfzEllipse.center[0] + sector.pfzEllipse.radiusY,
        sector.pfzEllipse.center[1] + sector.pfzEllipse.radiusX,
      ],
    ];

    const pfzZone = L.rectangle(pfzBounds, {
      color: "#14b8a6",
      weight: 2,
      fillColor: "#14b8a6",
      fillOpacity: 0.25,
      dashArray: "4, 4",
    });

    if (mode === "modal") {
      pfzZone.bindTooltip(
        `<b>Potential Fishing Zone (PFZ)</b><br/>${sector.pfzEllipse.distance} ${sector.pfzEllipse.bearing}<br/>${sector.pfzEllipse.description}`,
        { sticky: true }
      );
    }
    group.addLayer(pfzZone);

    // Center PFZ target marker
    const pfzTargetIcon = L.divIcon({
      className: "custom-pfz-marker",
      html: `
        <div style="background: #0d9488; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: bold; border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 2px 8px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 3px;">
          <span>🐟 PFZ</span>
        </div>
      `,
      iconSize: [44, 20],
      iconAnchor: [22, 10],
    });
    const pfzMarker = L.marker(sector.pfzEllipse.center, { icon: pfzTargetIcon });
    group.addLayer(pfzMarker);
  }

  // 3. SST Heat Points (Thermal Fronts)
  if (layers.sst) {
    sector.sstHeatPoints.forEach(([lat, lon, intensity]) => {
      // Outer thermal gradient circle
      const circle = L.circle([lat, lon], {
        radius: 6500 * intensity,
        color: "#f97316", // High-visibility deep orange border
        weight: 2,
        fillColor: intensity > 0.85 ? "#ef4444" : "#f97316",
        fillOpacity: 0.35,
      });

      if (mode === "modal") {
        circle.bindTooltip(
          `<div style="font-family: sans-serif; font-size: 11px; line-height: 1.4;">
            <b style="color: #ea580c;">🟠 SST Thermal Front</b><br/>
            <span>Thermal Gradient: <b>${(intensity * 100).toFixed(0)}% Anomaly</b></span><br/>
            <span style="color: #64748b;">Optimal pelagic fish feeding corridor</span>
          </div>`,
          { sticky: true }
        );
      }
      group.addLayer(circle);

      // Core center marker so point remains distinctly orange even over green PFZ rectangle
      const coreDot = L.circleMarker([lat, lon], {
        radius: 4,
        color: "#ffffff",
        weight: 1.5,
        fillColor: "#ea580c",
        fillOpacity: 1.0,
      });
      if (mode === "modal") {
        coreDot.bindTooltip(
          `<b>🟠 SST Thermal Front</b> · ${(intensity * 100).toFixed(0)}% Convergence`,
          { sticky: true }
        );
      }
      group.addLayer(coreDot);
    });
  }

  // 4. Chlorophyll Heat Points (Plankton Bloom Plumes)
  if (layers.chlorophyll) {
    sector.chlorophyllHeatPoints.forEach(([lat, lon, intensity]) => {
      const circle = L.circle([lat, lon], {
        radius: 7500 * intensity,
        color: "#10b981", // High-visibility emerald green border
        weight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.35,
      });

      if (mode === "modal") {
        circle.bindTooltip(
          `<div style="font-family: sans-serif; font-size: 11px; line-height: 1.4;">
            <b style="color: #059669;">🟢 Chlorophyll-a Plume</b><br/>
            <span>Biomass Density: <b>${(intensity * 2.5).toFixed(2)} μg/L</b></span><br/>
            <span style="color: #64748b;">High phytoplankton density & baitfish zone</span>
          </div>`,
          { sticky: true }
        );
      }
      group.addLayer(circle);

      // Core center marker for Chlorophyll
      const coreDot = L.circleMarker([lat, lon], {
        radius: 4,
        color: "#ffffff",
        weight: 1.5,
        fillColor: "#059669",
        fillOpacity: 1.0,
      });
      if (mode === "modal") {
        coreDot.bindTooltip(
          `<b>🟢 Chlorophyll-a Plume</b> · ${(intensity * 2.5).toFixed(2)} μg/L`,
          { sticky: true }
        );
      }
      group.addLayer(coreDot);
    });
  }

  // 5. Wind & Ocean Current Vectors
  if (layers.vectors) {
    // Render directional vector arrows on grid points
    const latStep = 0.25;
    const lonStep = 0.35;
    for (let dLat = -0.5; dLat <= 0.5; dLat += latStep) {
      for (let dLon = 0.2; dLon <= 1.0; dLon += lonStep) {
        const pLat = sector.center[0] + dLat;
        const pLon = sector.center[1] + dLon;
        const arrowIcon = L.divIcon({
          className: "vector-arrow",
          html: `
            <div style="transform: rotate(${sector.windVectors.directionDeg}deg); color: #38bdf8; opacity: 0.75;">
              ➔
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        group.addLayer(L.marker([pLat, pLon], { icon: arrowIcon }));
      }
    }
  }

  // 6. IMBL Sovereign Line & MPA Buffer Polygons
  if (layers.geofence) {
    // MPA Sanctuary Polygon
    const mpaPoly = L.polygon(sector.mpaSanctuary.polygon, {
      color: "#e11d48",
      weight: 2,
      fillColor: "#f43f5e",
      fillOpacity: 0.22,
      dashArray: "6, 4",
    });

    if (mode === "modal") {
      mpaPoly.bindTooltip(
        `<b>${sector.mpaSanctuary.name}</b><br/>${sector.mpaSanctuary.status}<br/>Buffer: ${sector.mpaSanctuary.bufferRadiusNm} NM`,
        { sticky: true }
      );
    }
    group.addLayer(mpaPoly);

    // IMBL Sovereign Boundary Line
    const imblLine = L.polyline(sector.imblBoundary, {
      color: "#dc2626",
      weight: 3,
      dashArray: "8, 6",
      opacity: 0.85,
    });

    if (mode === "modal") {
      imblLine.bindTooltip("<b>International Maritime Boundary Line (IMBL)</b><br/>Sovereign Border Guard Zone", {
        sticky: true,
      });
    }
    group.addLayer(imblLine);
  }
}
